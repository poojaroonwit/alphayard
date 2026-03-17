import json

from openai import AsyncOpenAI

from config.env import config
from services.providers.base import AIProvider, ProviderResponse, ToolCall, Usage

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        if not config.OPENAI_API_KEY:
            raise RuntimeError("OPENAI_API_KEY is not set")
        _client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
    return _client


def _to_openai_tools(tools: list[dict]) -> list[dict]:
    """Convert Anthropic tool defs (input_schema) → OpenAI function tool defs."""
    result = []
    for t in tools:
        result.append({
            "type": "function",
            "function": {
                "name": t["name"],
                "description": t.get("description", ""),
                "parameters": t.get("input_schema", {"type": "object", "properties": {}}),
            },
        })
    return result


def _to_openai_messages(messages: list[dict]) -> list[dict]:
    """
    Convert messages list to OpenAI format.
    Anthropic tool_result blocks → OpenAI {"role": "tool", ...} messages.
    Anthropic assistant content list → OpenAI assistant with tool_calls.
    """
    out = []
    for m in messages:
        role = m["role"]
        content = m["content"]

        if role == "system":
            out.append({"role": "system", "content": content})
            continue

        if isinstance(content, str):
            out.append({"role": role, "content": content})
            continue

        # content is a list of blocks (Anthropic format)
        if role == "assistant":
            text_parts = [b for b in content if getattr(b, "type", b.get("type")) == "text"]
            tool_use_parts = [b for b in content if getattr(b, "type", b.get("type")) == "tool_use"]

            text = "".join(
                getattr(b, "text", b.get("text", "")) for b in text_parts
            )
            tool_calls = [
                {
                    "id": getattr(b, "id", b.get("id")),
                    "type": "function",
                    "function": {
                        "name": getattr(b, "name", b.get("name")),
                        "arguments": json.dumps(
                            getattr(b, "input", b.get("input", {}))
                        ),
                    },
                }
                for b in tool_use_parts
            ]
            msg: dict = {"role": "assistant", "content": text or None}
            if tool_calls:
                msg["tool_calls"] = tool_calls
            out.append(msg)

        elif role == "user":
            # Check if this is a tool_result block list
            tool_results = [b for b in content if (getattr(b, "type", None) or b.get("type")) == "tool_result"]
            if tool_results:
                for b in tool_results:
                    out.append({
                        "role": "tool",
                        "tool_call_id": getattr(b, "tool_use_id", b.get("tool_use_id")),
                        "content": getattr(b, "content", b.get("content", "")),
                    })
            else:
                # Regular user content list -> convert to OpenAI multi-modal format
                oai_content = []
                for b in content:
                    b_type = getattr(b, "type", b.get("type"))
                    if b_type == "text":
                        oai_content.append({"type": "text", "text": getattr(b, "text", b.get("text", ""))})
                    elif b_type == "image":
                        source = getattr(b, "source", b.get("source", {}))
                        media_type = source.get("media_type")
                        data = source.get("data")
                        oai_content.append({
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:{media_type};base64,{data}"
                            }
                        })
                out.append({"role": "user", "content": oai_content})
        else:
            out.append(m)

    return out


class OpenAIProvider(AIProvider):
    id = "openai"
    label = "OpenAI"
    models = [
        {"id": "gpt-4o",        "label": "GPT-4o"},
        {"id": "gpt-4o-mini",   "label": "GPT-4o mini"},
        {"id": "o3-mini",       "label": "o3-mini"},
    ]

    async def complete(self, *, messages, system, tools, model, max_tokens, temperature) -> ProviderResponse:
        oai_messages = [{"role": "system", "content": system}] + _to_openai_messages(messages)
        oai_tools = _to_openai_tools(tools) if tools else []

        kwargs: dict = {
            "model": model,
            "messages": oai_messages,
            "max_tokens": max_tokens,
        }
        # o3/o1 models don't support temperature
        if not model.startswith("o"):
            kwargs["temperature"] = temperature
        if oai_tools:
            kwargs["tools"] = oai_tools
            kwargs["tool_choice"] = "auto"

        resp = await _get_client().chat.completions.create(**kwargs)
        choice = resp.choices[0]
        msg = choice.message

        text = msg.content or ""
        calls: list[ToolCall] = []
        if msg.tool_calls:
            for tc in msg.tool_calls:
                try:
                    inp = json.loads(tc.function.arguments)
                except Exception:
                    inp = {}
                calls.append(ToolCall(id=tc.id, name=tc.function.name, input=inp))

        stop_reason = "end_turn"
        if choice.finish_reason == "tool_calls":
            stop_reason = "tool_use"

        usage = resp.usage
        return ProviderResponse(
            stop_reason=stop_reason,
            text=text,
            tool_calls=calls,
            usage=Usage(
                usage.prompt_tokens if usage else 0,
                usage.completion_tokens if usage else 0,
            ),
            _raw=resp,
        )

    def assistant_message(self, response: ProviderResponse) -> dict:
        """Store in a format that _to_openai_messages can re-convert."""
        msg = response._raw.choices[0].message
        # Store as a plain dict with OpenAI shape so _to_openai_messages passes it through
        content: dict = {"role": "assistant", "content": msg.content or ""}
        if msg.tool_calls:
            content["tool_calls"] = [
                {
                    "id": tc.id,
                    "type": "function",
                    "function": {"name": tc.function.name, "arguments": tc.function.arguments},
                }
                for tc in msg.tool_calls
            ]
        return content

    def tool_results_message(self, calls_with_results: list) -> dict:
        # OpenAI tool results are separate messages — we return a wrapper
        # that _to_openai_messages will expand
        return {
            "role": "user",
            "content": [
                {"type": "tool_result", "tool_use_id": call.id, "content": result_str}
                for call, result_str in calls_with_results
            ],
        }
