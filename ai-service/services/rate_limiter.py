"""
Redis-based sliding-window rate limiter.
Default: 20 requests/minute per user, 200/day per user.
Both limits are configurable via AI config (rateLimitPerMinute, rateLimitPerDay).
"""
import time

from services.memory import get_redis

MINUTE_TTL = 120   # 2 min key expiry
DAY_TTL = 90_000   # 25 hr key expiry


async def check(user_id: str, per_minute: int = 20, per_day: int = 200) -> dict:
    """
    Returns {"allowed": bool, "remaining_minute": int, "remaining_day": int}.
    Increments counters only if allowed.
    """
    r = get_redis()
    window_min = int(time.time() // 60)
    window_day = time.strftime("%Y-%m-%d")
    key_min = f"ai:rate:min:{user_id}:{window_min}"
    key_day = f"ai:rate:day:{user_id}:{window_day}"

    # Read current counts without incrementing first
    count_min = int(await r.get(key_min) or 0)
    count_day = int(await r.get(key_day) or 0)

    if count_min >= per_minute:
        return {"allowed": False, "reason": "rate_limit_minute",
                "remaining_minute": 0, "remaining_day": max(0, per_day - count_day)}
    if count_day >= per_day:
        return {"allowed": False, "reason": "rate_limit_day",
                "remaining_minute": max(0, per_minute - count_min), "remaining_day": 0}

    # Increment
    async with r.pipeline() as pipe:
        pipe.incr(key_min)
        pipe.expire(key_min, MINUTE_TTL)
        pipe.incr(key_day)
        pipe.expire(key_day, DAY_TTL)
        await pipe.execute()

    return {
        "allowed": True,
        "remaining_minute": per_minute - count_min - 1,
        "remaining_day": per_day - count_day - 1,
    }
