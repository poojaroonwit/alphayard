from datetime import date as _date

import httpx

from config.env import config

TOOL_DEFS = [
    {
        "name": "get_net_worth",
        "description": "Get the user's current net worth: total assets, debts, net worth, income, expenses, and net cash flow.",
        "input_schema": {"type": "object", "properties": {}, "required": []},
    },
    {
        "name": "get_financial_categories",
        "description": "Get financial categories with their sub-categories and records. Filter by section.",
        "input_schema": {
            "type": "object",
            "properties": {
                "section": {
                    "type": "string",
                    "enum": ["assets", "debts", "cashflow"],
                    "description": "Optional section filter",
                }
            },
        },
    },
    {
        "name": "create_financial_record",
        "description": "Add a new financial record (transaction) to a sub-category.",
        "input_schema": {
            "type": "object",
            "properties": {
                "sub_category_id": {"type": "string", "description": "The sub-category ID to add the record to"},
                "name": {"type": "string", "description": "Description of the record"},
                "amount": {"type": "number", "description": "Amount in local currency"},
                "date": {"type": "string", "description": "Date in YYYY-MM-DD format, defaults to today"},
            },
            "required": ["sub_category_id", "name", "amount"],
        },
    },
]


async def execute(name: str, inp: dict, user_jwt: str, app_id: str) -> dict:
    headers = {
        "Authorization": f"Bearer {user_jwt}",
        "X-App-ID": app_id,
        "Content-Type": "application/json",
    }
    base = config.BONDARY_BACKEND_URL

    async with httpx.AsyncClient(timeout=15) as client:
        if name == "get_net_worth":
            r = await client.get(f"{base}/api/v1/mobile/finance/net-worth", headers=headers)
            return r.json()

        if name == "get_financial_categories":
            url = f"{base}/api/v1/mobile/finance/categories"
            if inp.get("section"):
                url += f"?section={inp['section']}"
            r = await client.get(url, headers=headers)
            return r.json()

        if name == "create_financial_record":
            payload = {
                "name": inp["name"],
                "amount": inp["amount"],
                "date": inp.get("date") or str(_date.today()),
            }
            r = await client.post(
                f"{base}/api/v1/mobile/finance/subcategories/{inp['sub_category_id']}/records",
                headers=headers,
                json=payload,
            )
            return r.json()

    raise ValueError(f"Unknown financial tool: {name}")
