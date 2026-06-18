#!/usr/bin/env python3
"""Summarize Blacktower integration boundaries touched by file paths."""

from __future__ import annotations

import sys
from collections import defaultdict

BOUNDARIES = {
    "bootstrap": ("src/index.ts",),
    "config": ("src/config/", "blacktower.schema.json"),
    "agents": ("src/agents/",),
    "tools": ("src/tools/",),
    "hooks": ("src/hooks/",),
    "mcp": ("src/mcp/",),
    "skills": ("src/skills/",),
    "cli-install": ("src/cli/",),
    "docs": ("README.md", "docs/"),
    "release": ("package.json", "scripts/", "dist/"),
}


def classify(path: str) -> list[str]:
    return [
        name
        for name, prefixes in BOUNDARIES.items()
        if any(path == prefix or path.startswith(prefix) for prefix in prefixes)
    ] or ["other"]


def main() -> int:
    if len(sys.argv) < 2:
        print("Usage: list_plugin_touchpoints.py <path> [<path> ...]")
        return 2

    grouped: dict[str, list[str]] = defaultdict(list)
    for path in sys.argv[1:]:
        for boundary in classify(path):
            grouped[boundary].append(path)

    for boundary in sorted(grouped):
        print(f"## {boundary}")
        for path in grouped[boundary]:
            print(f"- {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
