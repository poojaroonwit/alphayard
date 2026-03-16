import anthropic

from config.env import config
from services.providers.base import AIProvider, ProviderResponse, ToolCall, Usage

_client: anthropic.AsyncAnthropic | None = None


def _get_client() -> anthropic.AsyncAnthropic:
    global _client
    if _client is None:
        if not config.ANTHROPIC_API_KEY:
            raise RuntimeError("ANTHROPIC_API_KEY is not set")
        _client = anthropic.AsyncAnthropic(api_key=config.ANTHROPIC_API_KEY)
    return _client


class AnthropicProvider(AIProvider):
    id = "anthropic"
    label = "Anthropic"
    models = [
        {"id": "claude-opus-4-6",           "label": "Claude Opus 4.6"},
        {"id": "claude-sonnet-4-6",          "label": "Claude Sonnet 4.6"},
        {"id": "claude-haiku-4-5-20251001",  "label": "Claude Haiku 4.5"},
    ]

    async def complete(self, *, messages, system, tools, model, max_tokens, temperature) -> ProviderResponse:
        kwargs = {
            "model": model,
            "system": system,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if tools:
            kwargs["tools"] = tools  # already in Anthropic format

        resp = await _get_client().messages.create(**kwargs)

        text = ""
        calls: list[ToolCall] = []

        for block in resp.content:
            if block.type == "text":
                text += block.text
            elif block.type == "tool_use":
                calls.append(ToolCall(
                    id=block.id,
                    name=block.name,
                    input=block.input if isinstance(block.input, dict) else {},
                ))

        return ProviderResponse(
            stop_reason=resp.stop_reason or "end_turn",
            text=text,
            tool_calls=calls,
            usage=Usage(resp.usage.input_tokens, resp.usage.output_tokens),
            _raw=resp,
        )

    async def stream(self, *, messages, system, tools, model, max_tokens, temperature):
        """Real token streaming via Anthropic's streaming API."""
        kwargs = {
            "model": model,
            "system": system,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": temperature,
        }
        if tools:
            kwargs["tools"] = tools

        async with _get_client().messages.stream(**kwargs) as stream:
            async for text in stream.text_stream:
                yield text
            final = await stream.get_final_message()

        text_out = ""
        calls: list[ToolCall] = []
        for block in final.content:
            if block.type == "text":
                text_out += block.text
            elif block.type == "tool_use":
                calls.append(ToolCall(
                    id=block.id,
                    name=block.name,
                    input=block.input if isinstance(block.input, dict) else {},
                ))

        yield ProviderResponse(
            stop_reason=final.stop_reason or "end_turn",
            text=text_out,
            tool_calls=calls,
            usage=Usage(final.usage.input_tokens, final.usage.output_tokens),
            _raw=final,
        )

    def assistant_message(self, response: ProviderResponse) -> dict:
        return {"role": "assistant", "content": response._raw.content}

    def tool_results_message(self, calls_with_results: list) -> dict:
        return {
            "role": "user",
            "content": [
                {
                    "type": "tool_result",
                    "tool_use_id": call.id,
                    "content": result_str,
                }
                for call, result_str in calls_with_results
            ],
        }
