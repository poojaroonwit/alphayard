from tools import financial, social, profile

TOOL_MODULES = [
    {"id": "financial", "label": "Financial", "description": "Net worth, categories, and records", "module": financial},
    {"id": "social",    "label": "Social",    "description": "Circles and notifications",         "module": social},
    {"id": "profile",   "label": "Profile",   "description": "User profile information",          "module": profile},
]

# Map tool name → module
_TOOL_TO_MODULE: dict = {}
for _m in TOOL_MODULES:
    for _t in _m["module"].TOOL_DEFS:
        _TOOL_TO_MODULE[_t["name"]] = _m["module"]


def get_enabled_tools(enabled_modules: list[str]) -> list[dict]:
    tools = []
    for m in TOOL_MODULES:
        if m["id"] in enabled_modules:
            tools.extend(m["module"].TOOL_DEFS)
    return tools


async def execute_tool(name: str, inp: dict, user_jwt: str, app_id: str) -> dict:
    module = _TOOL_TO_MODULE.get(name)
    if module is None:
        raise ValueError(f"Unknown tool: {name}")
    return await module.execute(name, inp, user_jwt, app_id)
