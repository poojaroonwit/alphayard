import json
from datetime import datetime

from config.env import config
from services.memory import get_redis

CONFIG_KEY = "ai:global:config"

DEFAULT_CONFIG = {
    "provider": "anthropic",
    "model": config.DEFAULT_MODEL,
    "temperature": 0.7,
    "maxTokens": 4096,
    "rateLimitPerMinute": 20,
    "rateLimitPerDay": 200,
    "systemPromptTemplate": (
        "You are a helpful personal assistant integrated into a mobile app.\n"
        "You have access to the user's data across multiple modules.\n"
        "Current date: {{date}}\n"
        "User: {{userName}}\n\n"
        "Be concise, friendly, and actionable. When performing actions "
        "(creating records, etc.), confirm what you did.\n"
        "Always respond in the same language the user uses."
    ),
    "enabledModules": ["financial", "social", "profile"],
}


async def get_config() -> dict:
    r = get_redis()
    raw = await r.get(CONFIG_KEY)
    if not raw:
        return dict(DEFAULT_CONFIG)
    return {**DEFAULT_CONFIG, **json.loads(raw)}


async def update_config(updates: dict) -> dict:
    current = await get_config()
    updated = {**current, **updates}
    r = get_redis()
    await r.set(CONFIG_KEY, json.dumps(updated))
    return updated


async def build_system_prompt(cfg: dict, user_name: str = "User") -> str:
    date_str = datetime.now().strftime("%A, %B %d, %Y")
    return (
        cfg["systemPromptTemplate"]
        .replace("{{date}}", date_str)
        .replace("{{userName}}", user_name)
    )
