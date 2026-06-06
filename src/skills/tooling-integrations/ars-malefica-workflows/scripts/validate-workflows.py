#!/usr/bin/env python3
"""Validate core workflow surfaces in the vault."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


REQUIRED_FILES = [
    Path("Home.md"),
    Path("003 Resources/QuickAdd/QuickAdd Workflow.md"),
    Path("003 Resources/Media Notes.md"),
    Path("003 Resources/Systems/Capture Workflow.md"),
    Path("003 Resources/Systems/Workspace Guide.md"),
    Path("003 Resources/Systems/Obsidian Automation API.md"),
    Path("001 Projects/Threads/Threads Index.md"),
    Path("001 Projects/Works/Works Index.md"),
]

REQUIRED_PLUGINS = {
    "dataview",
    "periodic-notes",
    "quickadd",
    "templater-obsidian",
    "obsidian-local-rest-api",
    "tray",
}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    problems: list[str] = []

    for rel in REQUIRED_FILES:
        if not (root / rel).exists():
            problems.append(f"missing file: {rel}")

    community_plugins = root / ".obsidian/community-plugins.json"
    if community_plugins.exists():
        try:
            plugins = set(json.loads(community_plugins.read_text(encoding="utf-8")))
        except Exception as exc:  # noqa: BLE001
            problems.append(f"community-plugins.json invalid JSON ({exc})")
        else:
            missing = sorted(REQUIRED_PLUGINS - plugins)
            if missing:
                problems.append("missing plugins: " + ", ".join(missing))
    else:
        problems.append("missing file: .obsidian/community-plugins.json")

    home = root / "Home.md"
    if home.exists():
        text = home.read_text(encoding="utf-8")
        for needle in ["QuickAdd", "Threads Index", "Works Index", "Periodic Notes", "Vault Map"]:
            if needle not in text:
                problems.append(f"Home.md missing mention: {needle}")

    if problems:
        for problem in problems:
            print(problem)
        return 1

    print("workflow validation ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
