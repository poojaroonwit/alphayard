import json
import time

import jwt as pyjwt
from fastapi import APIRouter, Header, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from config.env import config
from services import config_service, memory, rate_limiter
from services.orchestrator import run_chat

router = APIRouter()


class ChatAttachment(BaseModel):
    type: str = "image"
    media_type: str
    data: str  # base64 data


class ChatRequest(BaseModel):
    message: str
    appId: str = "appkit"
    sessionId: str = "default"
    attachments: list[ChatAttachment] = []


class FeedbackRequest(BaseModel):
    sessionId: str = "default"
    messageIndex: int
    rating: int       # 1 = positive, -1 = negative
    comment: str = ""


def verify_user_jwt(token: str) -> str:
    try:
        payload = pyjwt.decode(token, config.JWT_SECRET, algorithms=["HS256"])
    except pyjwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    if payload.get("type") not in ("user", "mobile"):
        raise HTTPException(status_code=401, detail="Invalid token type")
    user_id = payload.get("userId") or payload.get("id") or payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Missing user id in token")
    return str(user_id)


def _bearer(authorization: str) -> str:
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Unauthorized")
    return authorization[7:]


# ─── POST /v1/chat/stream ─────────────────────────────────────────────────────

@router.post("/stream")
async def chat_stream(body: ChatRequest, authorization: str = Header(...)):
    token = _bearer(authorization)
    user_id = verify_user_jwt(token)

    if not body.message.strip():
        raise HTTPException(status_code=400, detail="Message required")

    # Rate limiting (limits come from admin-configurable AI config)
    ai_cfg = await config_service.get_config()
    rl = await rate_limiter.check(
        user_id,
        per_minute=ai_cfg.get("rateLimitPerMinute", 20),
        per_day=ai_cfg.get("rateLimitPerDay", 200),
    )
    if not rl["allowed"]:
        raise HTTPException(
            status_code=429,
            detail={"reason": rl["reason"], "remaining_minute": rl["remaining_minute"],
                    "remaining_day": rl["remaining_day"]},
        )

    async def event_generator():
        async for evt in run_chat(
            user_id=user_id,
            app_id=body.appId,
            user_jwt=token,
            user_message=body.message,
            session_id=body.sessionId,
            attachments=[a.dict() for a in body.attachments],
        ):
            yield f"event: {evt['event']}\ndata: {json.dumps(evt['data'])}\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


# ─── DELETE /v1/chat/history ──────────────────────────────────────────────────

@router.delete("/history")
async def clear_history(
    sessionId: str = "default",
    authorization: str = Header(...),
):
    user_id = verify_user_jwt(_bearer(authorization))
    await memory.clear_history(user_id, session_id=sessionId)
    return {"ok": True}


# ─── GET /v1/chat/sessions ────────────────────────────────────────────────────

@router.get("/sessions")
async def list_sessions(authorization: str = Header(...)):
    user_id = verify_user_jwt(_bearer(authorization))
    sessions = await memory.get_sessions(user_id)
    result = []
    for sid in sessions:
        history = await memory.get_history(user_id, session_id=sid)
        result.append({
            "sessionId": sid,
            "messageCount": len(history),
            "lastMessage": history[-1] if history else None,
        })
    return {"sessions": result}


# ─── POST /v1/chat/feedback ───────────────────────────────────────────────────

@router.post("/feedback")
async def submit_feedback(body: FeedbackRequest, authorization: str = Header(...)):
    user_id = verify_user_jwt(_bearer(authorization))

    if body.rating not in (1, -1):
        raise HTTPException(status_code=400, detail="rating must be 1 or -1")

    await memory.save_feedback(user_id, body.sessionId, {
        "message_index": body.messageIndex,
        "rating": body.rating,
        "comment": body.comment,
        "timestamp": int(time.time() * 1000),
    })
    return {"ok": True}


# ─── GET /v1/chat/feedback ────────────────────────────────────────────────────

@router.get("/feedback")
async def get_session_feedback(
    sessionId: str = "default",
    authorization: str = Header(...),
):
    user_id = verify_user_jwt(_bearer(authorization))
    feedback = await memory.get_feedback(user_id, sessionId)
    return {"sessionId": sessionId, "feedback": feedback}
