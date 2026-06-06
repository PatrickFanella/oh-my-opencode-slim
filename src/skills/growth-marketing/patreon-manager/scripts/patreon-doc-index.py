#!/usr/bin/env python3
"""Audit Patreon vault Markdown notes for frontmatter and wiki links."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

WIKI_RE = re.compile(r"\[\[([^\]]+)\]\]")
REQUIRED_KEYS = {"title", "type", "status", "created", "updated", "tags"}


def parse_frontmatter(text: str) -> dict[str, str]:
    if not text.startswith("---\n"):
        return {}
    try:
        end = text.index("\n---", 4)
    except ValueError:
        return {}
    data: dict[str, str] = {}
    for line in text[4:end].splitlines():
        if ":" in line and not line.startswith(" "):
            key, value = line.split(":", 1)
            data[key.strip()] = value.strip()
    return data


def audit(root: Path) -> list[dict[str, object]]:
    rows = []
    for path in sorted(root.glob("*.md")):
        text = path.read_text(encoding="utf-8")
        fm = parse_frontmatter(text)
        links = sorted(set(WIKI_RE.findall(text)))
        rows.append(
            {
                "file": str(path),
                "title": fm.get("title", ""),
                "missing_frontmatter_keys": sorted(REQUIRED_KEYS - set(fm)),
                "wiki_link_count": len(links),
                "wiki_links": links,
            }
        )
    return rows


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default="/home/onnwee/Projects/patreon", type=Path)
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    rows = audit(args.root)
    if args.json:
        print(json.dumps(rows, indent=2, ensure_ascii=False))
        return

    for row in rows:
        missing = ", ".join(row["missing_frontmatter_keys"]) or "ok"
        print(f"{Path(row['file']).name}: frontmatter={missing}; wiki_links={row['wiki_link_count']}")


if __name__ == "__main__":
    main()
