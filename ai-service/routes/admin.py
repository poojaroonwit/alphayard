from fastapi import APIRouter, Depends, Header, HTTPException, Query

from config.env import config
from services import config_service, memory
from services.cost_tracker import get_global_cost_stats, get_user_cost
from services.providers.registry import list_providers
from tools.registry import TOOL_MODULES

router = APIRouter()


def require_admin(x_admin_secret: str = Header(default="", alias="x-admin-secret")):
    if x_admin_secret != config.AI_ADMIN_SECRET:
        raise HTTPException(status_code=401, detail="Unauthorized")


# ─── Providers ────────────────────────────────────────────────────────────────

@router.get("/providers", dependencies=[Depends(require_admin)])
async def get_providers():
    return {"providers": list_providers()}


# ─── Config ───────────────────────────────────────────────────────────────────

@router.get("/config", dependencies=[Depends(require_admin)])
async def get_config():
    return await config_service.get_config()


@router.put("/config", dependencies=[Depends(require_admin)])
async def put_config(body: dict):
    return await config_service.update_config(body)


# ─── Tools ────────────────────────────────────────────────────────────────────

@router.get("/tools", dependencies=[Depends(require_admin)])
async def get_tools():
    cfg = await config_service.get_config()
    modules = [
        {
            "id": m["id"],
            "label": m["label"],
            "description": m["description"],
            "enabled": m["id"] in cfg["enabledModules"],
            "tools": [{"name": t["name"], "description": t["description"]} for t in m["module"].TOOL_DEFS],
        }
        for m in TOOL_MODULES
    ]
    return {"modules": modules}


# ─── Conversations ────────────────────────────────────────────────────────────

@router.get("/conversations", dependencies=[Depends(require_admin)])
async def list_conversations():
    user_ids = await memory.get_all_user_ids()
    conversations = []
    for uid in user_ids:
        sessions = await memory.get_sessions(uid)
        for sid in (sessions or ["default"]):
            history = await memory.get_history(uid, session_id=sid)
            if history:
                conversations.append({
                    "userId": uid,
                    "sessionId": sid,
                    "messageCount": len(history),
                    "lastMessage": history[-1],
                })
    return {"conversations": conversations}


@router.get("/conversations/{user_id}", dependencies=[Depends(require_admin)])
async def get_conversation(user_id: str, sessionId: str = Query("default")):
    history = await memory.get_history(user_id, session_id=sessionId)
    return {"userId": user_id, "sessionId": sessionId, "messages": history}


@router.delete("/conversations/{user_id}", dependencies=[Depends(require_admin)])
async def delete_conversation(user_id: str, sessionId: str = Query("default")):
    await memory.clear_history(user_id, session_id=sessionId)
    return {"ok": True}


# ─── Stats ────────────────────────────────────────────────────────────────────

@router.get("/stats", dependencies=[Depends(require_admin)])
async def get_stats(days: int = Query(30)):
    stats = await memory.get_usage_stats(days)
    cost_stats = await get_global_cost_stats(days)

    # Merge cost into daily stats
    cost_by_date = {d["date"]: d["cost_usd"] for d in cost_stats}
    for day in stats:
        day["cost_usd"] = cost_by_date.get(day["date"], 0.0)

    totals = {
        "requests": sum(d["requests"] for d in stats),
        "input_tokens": sum(d["input_tokens"] for d in stats),
        "output_tokens": sum(d["output_tokens"] for d in stats),
        "cost_usd": round(sum(d["cost_usd"] for d in stats), 4),
    }
    return {"daily": stats, "totals": totals}


@router.get("/stats/cost/{user_id}", dependencies=[Depends(require_admin)])
async def get_user_cost_stats(user_id: str, days: int = Query(30)):
    daily = await get_user_cost(user_id, days)
    total = round(sum(d["cost_usd"] for d in daily), 4)
    return {"userId": user_id, "daily": daily, "total_cost_usd": total}


# ─── Feedback ─────────────────────────────────────────────────────────────────

@router.get("/feedback", dependencies=[Depends(require_admin)])
async def list_all_feedback():
    return {"feedback": await memory.get_all_feedback()}


@router.get("/feedback/{user_id}", dependencies=[Depends(require_admin)])
async def get_user_feedback(user_id: str, sessionId: str = Query("default")):
    return {
        "userId": user_id,
        "sessionId": sessionId,
        "feedback": await memory.get_feedback(user_id, sessionId),
    }
