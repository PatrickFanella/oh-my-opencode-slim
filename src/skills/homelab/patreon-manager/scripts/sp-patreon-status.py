#!/usr/bin/env python3
"""Query Super Productivity for Patreon project/task status via sp-mcp."""

from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path

DEFAULT_MCP = Path("/home/onnwee/.local/bin/sp-mcp")
PROJECT_ID = "uEBxuO0M0uYSSkS0Ho6Ix"
PROJECT_TITLE = "Patreon Growth + Promotion"


def rpc_call(tool: str, arguments: dict, mcp: Path) -> dict:
    payloads = [
        {"jsonrpc": "2.0", "id": 1, "method": "initialize", "params": {"protocolVersion": "2024-11-05", "capabilities": {}, "clientInfo": {"name": "patreon-manager", "version": "1.0"}}},
        {"jsonrpc": "2.0", "id": 2, "method": "tools/call", "params": {"name": tool, "arguments": arguments}},
    ]
    proc = subprocess.run(
        [str(mcp)],
        input="\n".join(json.dumps(p) for p in payloads) + "\n",
        text=True,
        capture_output=True,
        timeout=20,
        check=False,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or f"sp-mcp exited {proc.returncode}")
    responses = [json.loads(line) for line in proc.stdout.splitlines() if line.strip().startswith("{")]
    for response in responses:
        if response.get("id") == 2:
            if "error" in response:
                raise RuntimeError(json.dumps(response["error"], ensure_ascii=False))
            return response.get("result", {})
    raise RuntimeError("No tools/call response from sp-mcp")


def extract_json_content(result: dict) -> object:
    content = result.get("content", [])
    if not content:
        return result
    text = content[0].get("text", "") if isinstance(content[0], dict) else str(content[0])
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        return text


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--mcp", type=Path, default=DEFAULT_MCP)
    parser.add_argument("--project-id", default=PROJECT_ID)
    parser.add_argument("--summary", action="store_true", help="Print concise summary")
    args = parser.parse_args()

    if not args.mcp.exists():
        raise SystemExit(f"sp-mcp not found: {args.mcp}")

    result = extract_json_content(rpc_call("get_tasks", {"projectId": args.project_id}, args.mcp))
    tasks = result.get("tasks", result) if isinstance(result, dict) else result
    if not isinstance(tasks, list):
        print(json.dumps(result, indent=2, ensure_ascii=False))
        return

    active = [t for t in tasks if not t.get("isDone") and not t.get("doneOn")]
    recurrence_fields = ("repeatCfg", "recurrence", "repeat", "repeatConfig", "reminderId")
    recurring = [t for t in tasks if any(t.get(field) for field in recurrence_fields)]
    recurrence_visible = any(any(field in t for field in recurrence_fields) for t in tasks)
    summary = {
        "project": PROJECT_TITLE,
        "project_id": args.project_id,
        "task_count": len(tasks),
        "active_count": len(active),
        "recurring_count_visible": len(recurring) if recurrence_visible else None,
        "documented_recurring_count": 17,
        "note": "get_tasks may omit recurrence metadata; documented count comes from Super Productivity Promotion Tasks.md",
    }
    if args.summary:
        print(json.dumps(summary, indent=2, ensure_ascii=False))
    else:
        print(json.dumps({"summary": summary, "tasks": tasks}, indent=2, ensure_ascii=False))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"error: {exc}", file=sys.stderr)
        sys.exit(1)
