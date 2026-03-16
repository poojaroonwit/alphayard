import json

import google.generativeai as genai

from config.env import config
from services.providers.base import AIProvider, ProviderResponse, ToolCall, Usage

_configured = False


def _ensure_configured() -> None:
    global _configured
    if not _configured:
        if not config.GOOGLE_API_KEY:
            raise RuntimeError("GOOGLE_API_KEY is not set")
        genai.configure(api_key=config.GOOGLE_API_KEY)
        _configured = True


def _to_gemini_tools(tools: list[dict]) -> list[dict]:
    """Convert Anthropic-format tool defs to Gemini function_declarations."""
    if not tools:
        return []
    declarations = []
    for t in tools:
        schema = dict(t.get("input_schema", {"type": "object", "properties": {}}))
        # Gemini doesn't accept an empty 'required' key
        if "required" in schema and not schema["required"]:
            schema.pop("required")
        declarations.append({
            "name": t["name"],
            "description": t.get("description", ""),
            "parameters": schema,
        })
    return [{"function_declarations": declarations}]


def _to_gemini_contents(messages: list[dict]) -> list[dict]:
    """
    Convert our messages list to Gemini Content dicts.
    Handles:
      - Plain {"role": "user"|"assistant", "content": "string"} (from Redis history)
      - Assistant turns with _gemini_parts (stored by assistant_message())
      - Tool result turns with _gemini_parts (stored by tool_results_message())
    """
    contents = []
    for m in messages:
        role = "model" if m["role"] == "assistant" else "user"

        if "_gemini_parts" in m:
            contents.append({"role": role, "parts": m["_gemini_parts"]})
            continue

        content = m.get("content", "")
        if isinstance(content, str):
            contents.append({"role": role, "parts": [{"text": content}]})

    return contents


class GeminiProvider(AIProvider):
    id = "gemini"
    label = "Google Gemini"
    models = [
        {"id": "gemini-2.0-flash",      "label": "Gemini 2.0 Flash"},
        {"id": "gemini-2.0-flash-lite",  "label": "Gemini 2.0 Flash Lite"},
        {"id": "gemini-1.5-pro",         "label": "Gemini 1.5 Pro"},
        {"id": "gemini-1.5-flash",       "label": "Gemini 1.5 Flash"},
    ]

    async def complete(self, *, messages, system, tools, model, max_tokens, temperature) -> ProviderResponse:
        _ensure_configured()

        gemini_model = genai.GenerativeModel(
            model_name=model,
            system_instruction=system,
            tools=_to_gemini_tools(tools) if tools else None,
            generation_config=genai.GenerationConfig(
                max_output_tokens=max_tokens,
                temperature=temperature,
            ),
        )

        contents = _to_gemini_contents(messages)
        response = await gemini_model.generate_content_async(contents)

        candidate = response.candidates[0]
        text = ""
        calls: list[ToolCall] = []

        for part in candidate.content.parts:
            if hasattr(part, "text") and part.text:
                text += part.text
            if hasattr(part, "function_call") and part.function_call.name:
                calls.append(ToolCall(
                    id=part.function_call.name,   # Gemini has no call ID; use name as ID
                    name=part.function_call.name,
                    input=dict(part.function_call.args),
                ))

        stop_reason = "tool_use" if calls else "end_turn"

        # Usage metadata (may be None on some models)
        usage_meta = getattr(response, "usage_metadata", None)
        usage = Usage(
            input_tokens=getattr(usage_meta, "prompt_token_count", 0) or 0,
            output_tokens=getattr(usage_meta, "candidates_token_count", 0) or 0,
        )

        return ProviderResponse(
            stop_reason=stop_reason,
            text=text,
            tool_calls=calls,
            usage=usage,
            _raw=response,
        )

    def assistant_message(self, response: ProviderResponse) -> dict:
        """Store Gemini parts so _to_gemini_contents can reconstruct them."""
        parts: list[dict] = []
        if response.text:
            parts.append({"text": response.text})
        for call in response.tool_calls:
            parts.append({"function_call": {"name": call.name, "args": call.input}})
        return {"role": "assistant", "_gemini_parts": parts}

    def tool_results_message(self, calls_with_results: list) -> dict:
        parts = [
            {
                "function_response": {
                    "name": call.name,
                    "response": json.loads(result_str),
                }
            }
            for call, result_str in calls_with_results
        ]
        return {"role": "user", "_gemini_parts": parts}
