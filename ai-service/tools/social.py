import httpx

from config.env import config

TOOL_DEFS = [
    {
        "name": "get_circles",
        "description": "Get the user's social circles (groups/communities they belong to).",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_notifications",
        "description": "Get the user's recent notifications.",
        "input_schema": {
            "type": "object",
            "properties": {
                "limit": {"type": "integer", "description": "Max number of notifications to return (default 10)"}
            },
        },
    },
]


async def execute(name: str, inp: dict, user_jwt: str, app_id: str) -> dict:
    headers = {
        "Authorization": f"Bearer {user_jwt}",
        "X-App-ID": app_id,
    }
    base = config.BONDARY_BACKEND_URL

    async with httpx.AsyncClient(timeout=15) as client:
        if name == "get_circles":
            r = await client.get(f"{base}/api/v1/mobile/circles", headers=headers)
            return r.json()

        if name == "get_notifications":
            limit = inp.get("limit", 10)
            r = await client.get(f"{base}/api/v1/mobile/notifications?limit={limit}", headers=headers)
            return r.json()

    raise ValueError(f"Unknown social tool: {name}")
