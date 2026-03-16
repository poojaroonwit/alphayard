import httpx

from config.env import config

TOOL_DEFS = [
    {
        "name": "get_user_profile",
        "description": "Get the current user's profile information including name, bio, and settings.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
]


async def execute(name: str, inp: dict, user_jwt: str, app_id: str) -> dict:
    headers = {
        "Authorization": f"Bearer {user_jwt}",
        "X-App-ID": app_id,
    }
    base = config.BONDARY_BACKEND_URL

    async with httpx.AsyncClient(timeout=15) as client:
        if name == "get_user_profile":
            r = await client.get(f"{base}/api/v1/mobile/auth/me", headers=headers)
            return r.json()

    raise ValueError(f"Unknown profile tool: {name}")
