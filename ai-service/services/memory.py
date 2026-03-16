import json
from datetime import datetime, timedelta
from typing import TypedDict

import redis.asyncio as aioredis

from config.env import config

_redis: aioredis.Redis | None = None

MAX_HISTORY = 20
HISTORY_TTL = 60 * 60 * 24 * 7     # 7 days
USAGE_TTL   = 60 * 60 * 24 * 90    # 90 days
FEEDBACK_TTL = 60 * 60 * 24 * 180  # 180 days


def history_key(user_id: str, session_id: str = "default") -> str:
    return f"ai:history:{user_id}:{session_id}"


def usage_key(date: str) -> str:
    return f"ai:usage:{date}"


def session_index_key(user_id: str) -> str:
    return f"ai:sessions:{user_id}"


def feedback_key(user_id: str, session_id: str) -> str:
    return f"ai:feedback:{user_id}:{session_id}"


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(config.REDIS_URL, decode_responses=True)
    return _redis


class Message(TypedDict):
    role: str       # 'user' | 'assistant'
    content: str
    timestamp: int


class Feedback(TypedDict):
    message_index: int
    rating: int     # 1 = positive, -1 = negative
    comment: str
    timestamp: int


# ─── History ──────────────────────────────────────────────────────────────────

async def get_history(user_id: str, session_id: str = "default") -> list[Message]:
    r = get_redis()
    raw = await r.get(history_key(user_id, session_id))
    return json.loads(raw) if raw else []


async def append_history(user_id: str, messages: list[Message], session_id: str = "default") -> None:
    r = get_redis()
    existing = await get_history(user_id, session_id)
    updated = (existing + messages)[-MAX_HISTORY:]
    await r.setex(history_key(user_id, session_id), HISTORY_TTL, json.dumps(updated))
    # Track session in user's session index
    await _touch_session(user_id, session_id)


async def clear_history(user_id: str, session_id: str = "default") -> None:
    r = get_redis()
    await r.delete(history_key(user_id, session_id))
    await r.srem(session_index_key(user_id), session_id)


# ─── Session index ────────────────────────────────────────────────────────────

async def _touch_session(user_id: str, session_id: str) -> None:
    r = get_redis()
    await r.sadd(session_index_key(user_id), session_id)
    await r.expire(session_index_key(user_id), HISTORY_TTL)


async def get_sessions(user_id: str) -> list[str]:
    r = get_redis()
    return list(await r.smembers(session_index_key(user_id)))


async def get_all_user_ids() -> list[str]:
    r = get_redis()
    keys = await r.keys("ai:history:*")
    user_ids: set[str] = set()
    for k in keys:
        parts = k.split(":")
        if len(parts) >= 3:
            user_ids.add(parts[2])
    return list(user_ids)


# ─── Usage tracking ───────────────────────────────────────────────────────────

async def track_usage(input_tokens: int, output_tokens: int) -> None:
    r = get_redis()
    date = datetime.utcnow().strftime("%Y-%m-%d")
    key = usage_key(date)
    async with r.pipeline() as pipe:
        pipe.hincrby(key, "requests", 1)
        pipe.hincrby(key, "input_tokens", input_tokens)
        pipe.hincrby(key, "output_tokens", output_tokens)
        pipe.expire(key, USAGE_TTL)
        await pipe.execute()


async def get_usage_stats(days: int = 30) -> list[dict]:
    r = get_redis()
    stats = []
    for i in range(days):
        d = datetime.utcnow() - timedelta(days=i)
        date = d.strftime("%Y-%m-%d")
        raw = await r.hgetall(usage_key(date))
        stats.append({
            "date": date,
            "requests": int(raw.get("requests", 0)),
            "input_tokens": int(raw.get("input_tokens", 0)),
            "output_tokens": int(raw.get("output_tokens", 0)),
        })
    stats.reverse()
    return stats


# ─── Message feedback ─────────────────────────────────────────────────────────

async def save_feedback(user_id: str, session_id: str, feedback: Feedback) -> None:
    r = get_redis()
    key = feedback_key(user_id, session_id)
    existing_raw = await r.get(key)
    existing: list[Feedback] = json.loads(existing_raw) if existing_raw else []

    # Replace if same message_index already has feedback
    existing = [f for f in existing if f["message_index"] != feedback["message_index"]]
    existing.append(feedback)
    await r.setex(key, FEEDBACK_TTL, json.dumps(existing))


async def get_feedback(user_id: str, session_id: str) -> list[Feedback]:
    r = get_redis()
    raw = await r.get(feedback_key(user_id, session_id))
    return json.loads(raw) if raw else []


async def get_all_feedback() -> list[dict]:
    r = get_redis()
    keys = await r.keys("ai:feedback:*")
    results = []
    for k in keys:
        raw = await r.get(k)
        if raw:
            parts = k.split(":")
            user_id = parts[2] if len(parts) > 2 else "unknown"
            session_id = parts[3] if len(parts) > 3 else "default"
            results.append({"userId": user_id, "sessionId": session_id, "feedback": json.loads(raw)})
    return results
