#!/usr/bin/env python3
"""Find literal leftovers for a migration pattern."""

from __future__ import annotations

import sys
from pathlib import Path


def iter_files(root: Path):
    if root.is_file():
        yield root
        return
    for path in root.rglob("*"):
        if path.is_file() and ".git" not in path.parts and "node_modules" not in path.parts:
            yield path


def main() -> int:
    if len(sys.argv) < 3:
        print("Usage: find_leftovers.py <literal-pattern> <path> [<path> ...]")
        return 2
    needle = sys.argv[1]
    found = 0
    for root in map(Path, sys.argv[2:]):
        for path in iter_files(root):
            try:
                text = path.read_text(errors="ignore")
            except OSError:
                continue
            for line_no, line in enumerate(text.splitlines(), 1):
                if needle in line:
                    found += 1
                    print(f"{path}:{line_no}: {line}")
    return 1 if found else 0


if __name__ == "__main__":
    raise SystemExit(main())
