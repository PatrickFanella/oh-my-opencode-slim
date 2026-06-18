#!/usr/bin/env python3
"""Group changed file paths by release impact."""

from __future__ import annotations

import sys
from collections import defaultdict

RULES = {
    "installer": ("src/cli/", "docs/installation.md"),
    "schema": ("src/config/schema.ts", "blacktower.schema.json"),
    "skills": ("src/skills/",),
    "package": ("package.json", "scripts/verify-release-artifact.ts"),
    "docs": ("README.md", "docs/"),
    "runtime": ("src/",),
}


def classify(path: str) -> str:
    for label, prefixes in RULES.items():
        if any(path == prefix or path.startswith(prefix) for prefix in prefixes):
            return label
    return "other"


def main() -> int:
    grouped: dict[str, list[str]] = defaultdict(list)
    for path in sys.argv[1:]:
        grouped[classify(path)].append(path)
    for label in sorted(grouped):
        print(f"## {label}")
        for path in grouped[label]:
            print(f"- {path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
