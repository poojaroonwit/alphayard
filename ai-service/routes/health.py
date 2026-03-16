import anthropic
import google.generativeai as genai
from fastapi import APIRouter
from openai import AsyncOpenAI

from config.env import config
from services.memory import get_redis

router = APIRouter()


@router.get("/health")
async def health():
    checks: dict = {}

    # Redis
    try:
        r = get_redis()
        await r.ping()
        checks["redis"] = "ok"
    except Exception as e:
        checks["redis"] = f"error: {e}"

    # Anthropic
    if config.ANTHROPIC_API_KEY:
        try:
            client = anthropic.AsyncAnthropic(api_key=config.ANTHROPIC_API_KEY)
            await client.models.list()
            checks["anthropic"] = "ok"
        except Exception as e:
            checks["anthropic"] = f"error: {e}"
    else:
        checks["anthropic"] = "not configured"

    # OpenAI
    if config.OPENAI_API_KEY:
        try:
            client = AsyncOpenAI(api_key=config.OPENAI_API_KEY)
            await client.models.list()
            checks["openai"] = "ok"
        except Exception as e:
            checks["openai"] = f"error: {e}"
    else:
        checks["openai"] = "not configured"

    # Gemini
    if config.GOOGLE_API_KEY:
        try:
            genai.configure(api_key=config.GOOGLE_API_KEY)
            list(genai.list_models())
            checks["gemini"] = "ok"
        except Exception as e:
            checks["gemini"] = f"error: {e}"
    else:
        checks["gemini"] = "not configured"

    overall = "ok" if checks["redis"] == "ok" else "degraded"
    return {"status": overall, "checks": checks}
