import asyncio
import json
import time
from collections.abc import AsyncGenerator
from typing import Any

from services import config_service, memory
from services.cost_tracker import track_cost
from services.providers.base import ProviderResponse
from services.providers.registry import get_provider
from services.retry import BASE_DELAY, _is_retryable
from tools.registry import execute_tool, get_enabled_tools


async def run_chat(
    user_id: str,
    app_id: str,
    user_jwt: str,
    user_message: str,
    session_id: str = "default",
    attachments: list[dict[str, Any]] | None = None,
) -> AsyncGenerator[dict[str, Any], None]:
    """
    Async generator yielding SSE-style event dicts:
      {"event": "token",      "data": {"token": "..."}}
      {"event": "tool_start", "data": {"name": "...", "input": {...}}}
      {"event": "tool_end",   "data": {"name": "...", "result": {...}}}
      {"event": "done",       "data": {"usage": {...}, "cost_usd": N, "provider": "...", "model": "..."}}
      {"event": "error",      "data": {"message": "..."}}
    """
    try:
        ai_config = await config_service.get_config()
        provider = get_provider(ai_config.get("provider", "anthropic"))
        model = ai_config["model"]

        history = await memory.get_history(user_id, session_id)
        messages: list[dict] = [
            {"role": m["role"], "content": m["content"]}
            for m in history
        ]

        if attachments:
            msg_content = [{"type": "text", "text": user_message}]
            for att in attachments:
                if att["type"] == "image":
                    msg_content.append({
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": att["media_type"],
                            "data": att["data"],
                        }
                    })
                elif att["type"] == "document":
                    # Attempt to decode text content if it's a text file
                    if "text" in att["media_type"]:
                        try:
                            import base64
                            text_content = base64.b64decode(att["data"]).decode("utf-8")
                            msg_content.append({
                                "type": "text",
                                "text": f"\n\n[Content of {att.get('name', 'document')}]:\n{text_content}"
                            })
                        except Exception as e:
                            msg_content.append({
                                "type": "text",
                                "text": f"\n\n[Document {att.get('name', 'attached')} (could not decode text)]"
                            })
                    else:
                        # For other types, just mention the attachment
                        msg_content.append({
                            "type": "text",
                            "text": f"\n\n[Document {att.get('name', 'attached')} (MIME: {att['media_type']})]"
                        })
            messages.append({"role": "user", "content": msg_content})
        else:
            messages.append({"role": "user", "content": user_message})

        tools = get_enabled_tools(ai_config["enabledModules"])
        system_prompt = await config_service.build_system_prompt(ai_config)

        total_input = total_output = 0

        while True:
            kwargs = dict(
                messages=messages,
                system=system_prompt,
                tools=tools,
                model=model,
                max_tokens=ai_config["maxTokens"],
                temperature=ai_config["temperature"],
            )

            # Stream with one retry on transient errors
            final_response: ProviderResponse | None = None
            try:
                async for chunk in provider.stream(**kwargs):
                    if isinstance(chunk, str):
                        yield {"event": "token", "data": {"token": chunk}}
                    else:
                        final_response = chunk
            except Exception as exc:
                if not _is_retryable(exc):
                    raise
                yield {"event": "retry", "data": {"message": str(exc)}}
                await asyncio.sleep(BASE_DELAY)
                async for chunk in provider.stream(**kwargs):
                    if isinstance(chunk, str):
                        yield {"event": "token", "data": {"token": chunk}}
                    else:
                        final_response = chunk

            if final_response is None:
                break

            total_input += final_response.usage.input_tokens
            total_output += final_response.usage.output_tokens
            messages.append(provider.assistant_message(final_response))

            if final_response.stop_reason in ("end_turn", "stop_sequence"):
                await memory.append_history(user_id, [
                    {"role": "user",      "content": user_message,        "timestamp": _now_ms()},
                    {"role": "assistant", "content": final_response.text, "timestamp": _now_ms()},
                ], session_id=session_id)

                await memory.track_usage(total_input, total_output)
                cost = await track_cost(user_id, model, total_input, total_output)

                yield {"event": "done", "data": {
                    "usage": {"input_tokens": total_input, "output_tokens": total_output},
                    "cost_usd": round(cost, 6),
                    "provider": provider.id,
                    "model": model,
                }}
                break

            if final_response.stop_reason == "tool_use":
                calls_with_results = []
                for call in final_response.tool_calls:
                    yield {"event": "tool_start", "data": {"name": call.name, "input": call.input}}
                    try:
                        result = await execute_tool(call.name, call.input, user_jwt, app_id)
                    except Exception as exc:
                        result = {"error": str(exc)}
                    yield {"event": "tool_end", "data": {"name": call.name, "result": result}}
                    calls_with_results.append((call, json.dumps(result)))

                messages.append(provider.tool_results_message(calls_with_results))

    except Exception as exc:
        yield {"event": "error", "data": {"message": str(exc)}}


def _now_ms() -> int:
    return int(time.time() * 1000)
