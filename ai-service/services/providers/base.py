"""
Unified provider interface.

Tools are always passed in Anthropic format (input_schema).
Each provider converts internally to its native wire format.

The orchestrator owns the tool-use loop; providers expose:
  - complete()             → single API call → ProviderResponse
  - assistant_message()    → dict to append to messages after a turn
  - tool_results_message() → dict to append after executing tools
"""
from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class ToolCall:
    id: str
    name: str
    input: dict


@dataclass
class Usage:
    input_tokens: int
    output_tokens: int


@dataclass
class ProviderResponse:
    stop_reason: str          # "end_turn" | "tool_use"
    text: str                 # full assistant text (empty if tool_use)
    tool_calls: list[ToolCall] = field(default_factory=list)
    usage: Usage = field(default_factory=lambda: Usage(0, 0))
    _raw: object = field(default=None, repr=False)   # raw SDK response


class AIProvider(ABC):
    id: str
    label: str
    models: list[dict]  # [{"id": "...", "label": "..."}]

    @abstractmethod
    async def complete(
        self,
        *,
        messages: list[dict],
        system: str,
        tools: list[dict],       # Anthropic-format defs (input_schema)
        model: str,
        max_tokens: int,
        temperature: float,
    ) -> ProviderResponse:
        """Single non-streaming API call."""
        ...

    async def stream(
        self,
        *,
        messages: list[dict],
        system: str,
        tools: list[dict],
        model: str,
        max_tokens: int,
        temperature: float,
    ):
        """
        Async generator: yields str text tokens during generation,
        then finally yields ProviderResponse.

        Default implementation wraps complete() with simulated chunking.
        Override in providers that support native streaming.
        """
        import asyncio
        response = await self.complete(
            messages=messages, system=system, tools=tools,
            model=model, max_tokens=max_tokens, temperature=temperature,
        )
        for i in range(0, len(response.text), 4):
            yield response.text[i : i + 4]
            await asyncio.sleep(0.01)
        yield response

    @abstractmethod
    def assistant_message(self, response: ProviderResponse) -> dict:
        """Return the message dict to append to `messages` for this turn."""
        ...

    @abstractmethod
    def tool_results_message(self, calls_with_results: list) -> dict:
        """
        Return the message dict representing tool results.
        `calls_with_results` is a list of (ToolCall, json_result_str) pairs.
        """
        ...
