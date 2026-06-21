#!/usr/bin/env python3
"""Validate core Ars Malefica vault surfaces."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


CORE_FILES = [
    Path("Home.md"),
    Path("001 Projects/Threads/Threads Index.md"),
    Path("001 Projects/Works/Works Index.md"),
    Path("003 Resources/QuickAdd/QuickAdd Workflow.md"),
    Path("003 Resources/Media Notes.md"),
    Path("003 Resources/Systems/Workspace Guide.md"),
    Path("003 Resources/Systems/Obsidian Automation API.md"),
    Path("004 Archives/Redirects.md"),
    Path("004 Archives/Deletion Candidates.md"),
    Path(".obsidian/community-plugins.json"),
    Path(".obsidian/workspace.json"),
]

CORE_DIRS = [
    Path("000 Inbox"),
    Path("001 Projects/Threads"),
    Path("001 Projects/Works"),
    Path("003 Resources/Media"),
    Path("003 Resources/Documentation"),
    Path("003 Resources/QuickAdd"),
    Path("003 Resources/Periodic Notes"),
    Path("004 Archives/Planning Systems"),
    Path(".obsidian/workspaces"),
]


def resolve(root: Path, value: str) -> Path | None:
    candidates = [root / value]
    if not value.endswith(".md"):
        candidates.append(root / f"{value}.md")
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def extract_workspace_refs(node, refs: set[str]) -> None:
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "file" and isinstance(value, str):
                refs.add(value)
            else:
                extract_workspace_refs(value, refs)
    elif isinstance(node, list):
        for item in node:
            extract_workspace_refs(item, refs)


def check_json(path: Path) -> str | None:
    try:
        json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        return f"{path}: invalid JSON ({exc})"
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    problems: list[str] = []

    for rel in CORE_DIRS:
        if not (root / rel).exists():
            problems.append(f"missing dir: {rel}")

    for rel in CORE_FILES:
        path = root / rel
        if not path.exists():
            problems.append(f"missing file: {rel}")

    for rel in [Path(".obsidian/community-plugins.json"), Path(".obsidian/workspace.json")]:
        path = root / rel
        if path.exists():
            err = check_json(path)
            if err:
                problems.append(err)

    for path in sorted((root / ".obsidian/workspaces").glob("*.json")):
        err = check_json(path)
        if err:
            problems.append(err)
            continue
        data = json.loads(path.read_text(encoding="utf-8"))
        refs: set[str] = set()
        extract_workspace_refs(data, refs)
        for ref in sorted(refs):
            resolved = resolve(root, ref)
            if resolved is None:
                problems.append(f"{path.relative_to(root)}: missing workspace ref {ref}")

    if problems:
        for problem in problems:
            print(problem)
        return 1

    print("vault validation ok")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
