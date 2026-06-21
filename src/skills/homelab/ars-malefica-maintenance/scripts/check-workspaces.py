#!/usr/bin/env python3
"""Validate saved Obsidian workspaces."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path


EXPECTED = {
    "Creative Desk.json",
    "Journal Review.json",
    "Media Lab.json",
    "Thread Synthesis.json",
    "Works Pipeline.json",
    "Documentation.json",
}


def extract_refs(node, refs: set[str]) -> None:
    if isinstance(node, dict):
        for key, value in node.items():
            if key == "file" and isinstance(value, str):
                refs.add(value)
            else:
                extract_refs(value, refs)
    elif isinstance(node, list):
        for item in node:
            extract_refs(item, refs)


def resolve(root: Path, value: str) -> Path | None:
    candidates = [root / value]
    if not value.endswith(".md"):
        candidates.append(root / f"{value}.md")
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", default=".")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    ws_dir = root / ".obsidian/workspaces"
    problems: list[str] = []

    found = {p.name for p in ws_dir.glob("*.json")}
    missing = sorted(EXPECTED - found)
    extra = sorted(found - EXPECTED)
    if missing:
        problems.append("missing workspaces: " + ", ".join(missing))
    if extra:
        problems.append("unexpected workspaces: " + ", ".join(extra))

    for path in sorted(ws_dir.glob("*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:  # noqa: BLE001
            problems.append(f"{path.name}: invalid JSON ({exc})")
            continue

        refs: set[str] = set()
        extract_refs(data, refs)
        missing_refs = [ref for ref in sorted(refs) if resolve(root, ref) is None]
        if missing_refs:
            problems.append(f"{path.name}: missing refs: {', '.join(missing_refs)}")

    if problems:
        for problem in problems:
            print(problem)
        return 1

    print(f"workspaces ok ({len(found)} files)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
