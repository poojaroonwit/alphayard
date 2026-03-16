from services.providers.anthropic_provider import AnthropicProvider
from services.providers.gemini_provider import GeminiProvider
from services.providers.openai_provider import OpenAIProvider
from services.providers.base import AIProvider

_PROVIDERS: dict[str, AIProvider] = {
    p.id: p
    for p in [AnthropicProvider(), OpenAIProvider(), GeminiProvider()]
}

DEFAULT_PROVIDER = "anthropic"


def get_provider(provider_id: str) -> AIProvider:
    p = _PROVIDERS.get(provider_id)
    if p is None:
        raise ValueError(f"Unknown provider: {provider_id!r}. Available: {list(_PROVIDERS)}")
    return p


def list_providers() -> list[dict]:
    return [
        {"id": p.id, "label": p.label, "models": p.models}
        for p in _PROVIDERS.values()
    ]
