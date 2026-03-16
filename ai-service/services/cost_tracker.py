"""
Model pricing and per-user cost tracking.
Prices are in USD per 1M tokens (as of early 2026 — update as needed).
"""
import time

from services.memory import get_redis

# USD per 1M tokens
MODEL_PRICING: dict[str, dict] = {
    # Anthropic
    "claude-opus-4-6":           {"input": 15.0,  "output": 75.0},
    "claude-sonnet-4-6":         {"input": 3.0,   "output": 15.0},
    "claude-haiku-4-5-20251001": {"input": 0.80,  "output": 4.0},
    # OpenAI
    "gpt-4o":                    {"input": 2.5,   "output": 10.0},
    "gpt-4o-mini":               {"input": 0.15,  "output": 0.60},
    "o3-mini":                   {"input": 1.10,  "output": 4.40},
    # Gemini
    "gemini-2.0-flash":          {"input": 0.10,  "output": 0.40},
    "gemini-2.0-flash-lite":     {"input": 0.075, "output": 0.30},
    "gemini-1.5-pro":            {"input": 1.25,  "output": 5.0},
    "gemini-1.5-flash":          {"input": 0.075, "output": 0.30},
}

COST_TTL = 60 * 60 * 24 * 90   # 90 days


def estimate_cost(model: str, input_tokens: int, output_tokens: int) -> float:
    """Returns estimated cost in USD."""
    pricing = MODEL_PRICING.get(model, {"input": 0.0, "output": 0.0})
    return (input_tokens * pricing["input"] + output_tokens * pricing["output"]) / 1_000_000


async def track_cost(user_id: str, model: str, input_tokens: int, output_tokens: int) -> float:
    """Stores daily per-user cost and returns the cost for this call."""
    cost = estimate_cost(model, input_tokens, output_tokens)
    if cost == 0:
        return 0.0

    r = get_redis()
    date = time.strftime("%Y-%m-%d")
    key = f"ai:cost:{user_id}:{date}"

    # Store as integer micro-dollars (avoid float precision issues in Redis)
    micro = int(cost * 1_000_000)
    async with r.pipeline() as pipe:
        pipe.incrby(key, micro)
        pipe.expire(key, COST_TTL)
        await pipe.execute()

    return cost


async def get_user_cost(user_id: str, days: int = 30) -> list[dict]:
    """Returns daily cost breakdown for a user."""
    from datetime import datetime, timedelta
    r = get_redis()
    result = []
    for i in range(days):
        d = datetime.utcnow() - timedelta(days=i)
        date = d.strftime("%Y-%m-%d")
        raw = await r.get(f"ai:cost:{user_id}:{date}")
        result.append({"date": date, "cost_usd": int(raw or 0) / 1_000_000})
    result.reverse()
    return result


async def get_global_cost_stats(days: int = 30) -> list[dict]:
    """Returns aggregate daily cost across all users."""
    from datetime import datetime, timedelta
    r = get_redis()
    result = []
    for i in range(days):
        d = datetime.utcnow() - timedelta(days=i)
        date = d.strftime("%Y-%m-%d")
        keys = await r.keys(f"ai:cost:*:{date}")
        total_micro = 0
        for k in keys:
            v = await r.get(k)
            total_micro += int(v or 0)
        result.append({"date": date, "cost_usd": total_micro / 1_000_000})
    result.reverse()
    return result
