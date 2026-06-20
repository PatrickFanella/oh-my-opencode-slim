#!/usr/bin/env python3
"""Small stdlib Edda API helper for play-edda loops.

Authentication:
  export EDDA_BASE_URL=https://edda.subcult.tv
  export EDDA_TOKEN=<jwt>                       # preferred after login
  # or run: edda_api.py login --email ... --password ...
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
from typing import Any


DEFAULT_BASE_URL = "https://edda.subcult.tv"


def base_url() -> str:
    return os.environ.get("EDDA_BASE_URL", DEFAULT_BASE_URL).rstrip("/")


def token() -> str | None:
    return os.environ.get("EDDA_TOKEN")


def request(method: str, path: str, body: Any | None = None, *, require_auth: bool = True) -> Any:
    url = base_url() + path
    data = None
    headers = {"Accept": "application/json"}
    if body is not None:
        data = json.dumps(body).encode("utf-8")
        headers["Content-Type"] = "application/json"
    if require_auth:
        auth_token = token()
        if not auth_token:
            raise SystemExit("EDDA_TOKEN is required. Run login first and export the returned token.")
        headers["Authorization"] = f"Bearer {auth_token}"

    req = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=60) as resp:
            raw = resp.read().decode("utf-8")
            if not raw:
                return None
            return json.loads(raw)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", errors="replace")
        raise SystemExit(f"HTTP {exc.code} {method} {url}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise SystemExit(f"Request failed {method} {url}: {exc.reason}") from exc


def dump(value: Any) -> None:
    print(json.dumps(value, indent=2, sort_keys=True))


def login(args: argparse.Namespace) -> None:
    email = args.email or os.environ.get("EDDA_EMAIL")
    password = args.password or os.environ.get("EDDA_PASSWORD")
    if not email or not password:
        raise SystemExit("login requires --email/--password or EDDA_EMAIL/EDDA_PASSWORD")
    result = request("POST", "/api/v1/auth/login", {"email": email, "password": password}, require_auth=False)
    if args.export:
        print(f"export EDDA_TOKEN={shell_quote(result['token'])}")
    else:
        dump(result)


def shell_quote(value: str) -> str:
    return "'" + value.replace("'", "'\\''") + "'"


def me(_: argparse.Namespace) -> None:
    dump(request("GET", "/api/v1/auth/me"))


def campaigns(_: argparse.Namespace) -> None:
    dump(request("GET", "/api/v1/campaigns/"))


def campaign(args: argparse.Namespace) -> None:
    dump(request("GET", f"/api/v1/campaigns/{urllib.parse.quote(args.campaign_id)}/"))


def history(args: argparse.Namespace) -> None:
    dump(request("GET", f"/api/v1/campaigns/{urllib.parse.quote(args.campaign_id)}/history"))


def action(args: argparse.Namespace) -> None:
    dump(request("POST", f"/api/v1/campaigns/{urllib.parse.quote(args.campaign_id)}/action", {"input": args.input}))


def resource(args: argparse.Namespace) -> None:
    cid = urllib.parse.quote(args.campaign_id)
    routes = {
        "character": f"/api/v1/campaigns/{cid}/character",
        "inventory": f"/api/v1/campaigns/{cid}/character/inventory",
        "quests": f"/api/v1/campaigns/{cid}/quests",
        "locations": f"/api/v1/campaigns/{cid}/locations",
        "npcs": f"/api/v1/campaigns/{cid}/npcs/encountered",
        "facts": f"/api/v1/campaigns/{cid}/facts",
        "map": f"/api/v1/campaigns/{cid}/map",
        "time": f"/api/v1/campaigns/{cid}/time",
    }
    dump(request("GET", routes[args.name]))


def turn_context(args: argparse.Namespace) -> None:
    cid = urllib.parse.quote(args.campaign_id)
    parts: dict[str, Any] = {}
    for name, path in {
        "campaign": f"/api/v1/campaigns/{cid}/",
        "history": f"/api/v1/campaigns/{cid}/history",
        "character": f"/api/v1/campaigns/{cid}/character",
        "quests": f"/api/v1/campaigns/{cid}/quests",
        "locations": f"/api/v1/campaigns/{cid}/locations",
        "npcs": f"/api/v1/campaigns/{cid}/npcs/encountered",
        "facts": f"/api/v1/campaigns/{cid}/facts",
        "time": f"/api/v1/campaigns/{cid}/time",
    }.items():
        try:
            parts[name] = request("GET", path)
        except SystemExit as exc:
            parts[name] = {"error": str(exc)}
    dump(parts)


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(description="Edda API helper for play-edda")
    sub = p.add_subparsers(required=True)

    login_p = sub.add_parser("login", help="Log in and print auth response or export command")
    login_p.add_argument("--email")
    login_p.add_argument("--password")
    login_p.add_argument("--export", action="store_true", help="print shell export for EDDA_TOKEN")
    login_p.set_defaults(func=login)

    sub.add_parser("me", help="Fetch current user").set_defaults(func=me)
    sub.add_parser("campaigns", help="List campaigns").set_defaults(func=campaigns)

    campaign_p = sub.add_parser("campaign", help="Fetch campaign record")
    campaign_p.add_argument("campaign_id")
    campaign_p.set_defaults(func=campaign)

    history_p = sub.add_parser("history", help="Fetch session history")
    history_p.add_argument("campaign_id")
    history_p.set_defaults(func=history)

    action_p = sub.add_parser("action", help="Submit one player action")
    action_p.add_argument("campaign_id")
    action_p.add_argument("input")
    action_p.set_defaults(func=action)

    resource_p = sub.add_parser("get", help="Fetch one play-state resource")
    resource_p.add_argument("campaign_id")
    resource_p.add_argument("name", choices=["character", "inventory", "quests", "locations", "npcs", "facts", "map", "time"])
    resource_p.set_defaults(func=resource)

    ctx_p = sub.add_parser("turn-context", help="Fetch a compact multi-resource turn context")
    ctx_p.add_argument("campaign_id")
    ctx_p.set_defaults(func=turn_context)

    return p


def main() -> None:
    args = build_parser().parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
