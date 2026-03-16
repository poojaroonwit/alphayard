"""
Exponential backoff retry wrapper for provider API calls.
Retries on: 429 (rate limit), 500/503 (server errors), connection errors.
"""
import asyncio
import logging
from collections.abc import Callable, Coroutine
from typing import TypeVar

logger = logging.getLogger(__name__)

T = TypeVar("T")

RETRYABLE_STATUS = {429, 500, 502, 503, 529}
MAX_RETRIES = 3
BASE_DELAY = 1.0   # seconds
MAX_DELAY = 30.0


def _is_retryable(exc: Exception) -> bool:
    # Anthropic / OpenAI SDK raise APIStatusError with status_code
    status = getattr(exc, "status_code", None)
    if status in RETRYABLE_STATUS:
        return True
    # Network errors
    import httpx
    if isinstance(exc, (httpx.ConnectError, httpx.TimeoutException, httpx.ReadTimeout)):
        return True
    return False


async def with_retry(fn: Callable[[], Coroutine[None, None, T]]) -> T:
    """
    Calls `fn()` up to MAX_RETRIES times with exponential backoff.
    Usage:
        response = await with_retry(lambda: provider.complete(**kwargs))
    """
    last_exc: Exception | None = None
    for attempt in range(MAX_RETRIES + 1):
        try:
            return await fn()
        except Exception as exc:
            last_exc = exc
            if attempt == MAX_RETRIES or not _is_retryable(exc):
                raise

            delay = min(BASE_DELAY * (2 ** attempt), MAX_DELAY)
            logger.warning(
                "Retryable error on attempt %d/%d: %s — retrying in %.1fs",
                attempt + 1, MAX_RETRIES, exc, delay,
            )
            await asyncio.sleep(delay)

    raise last_exc  # unreachable but satisfies type checkers
