#!/usr/bin/env python3
"""Render Almaz skill Markdown templates with {{placeholders}}."""

from __future__ import annotations

import argparse
import re
import sys
from datetime import date
from pathlib import Path


SKILL_ROOT = Path(__file__).resolve().parents[1]
TEMPLATES_DIR = SKILL_ROOT / "assets" / "templates"
PLACEHOLDER = re.compile(r"\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}")


def parse_vars(raw_vars: list[str]) -> dict[str, str]:
    values = {"date": date.today().isoformat()}
    for raw in raw_vars:
        if "=" not in raw:
            raise ValueError(f"expected key=value, got {raw!r}")
        key, value = raw.split("=", 1)
        key = key.strip()
        if not key:
            raise ValueError(f"empty key in {raw!r}")
        values[key] = value
    return values


def render(text: str, values: dict[str, str], strict: bool) -> str:
    missing: set[str] = set()

    def replace(match: re.Match[str]) -> str:
        key = match.group(1)
        if key in values:
            return values[key]
        missing.add(key)
        return match.group(0)

    output = PLACEHOLDER.sub(replace, text)
    if strict and missing:
        raise KeyError(", ".join(sorted(missing)))
    return output


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("template", nargs="?", help="template filename under assets/templates")
    parser.add_argument("--var", action="append", default=[], metavar="KEY=VALUE", help="template value")
    parser.add_argument("--output", "-o", help="write rendered output to this file")
    parser.add_argument("--list", action="store_true", help="list available templates")
    parser.add_argument("--strict", action="store_true", help="fail if placeholders remain unresolved")
    args = parser.parse_args()

    if args.list:
        for path in sorted(TEMPLATES_DIR.glob("*.md")):
            print(path.name)
        return 0

    if not args.template:
        parser.error("template is required unless --list is used")

    template_path = TEMPLATES_DIR / args.template
    if not template_path.exists():
        print(f"template not found: {template_path}", file=sys.stderr)
        return 2

    try:
        values = parse_vars(args.var)
        output = render(template_path.read_text(encoding="utf-8"), values, args.strict)
    except (ValueError, KeyError) as exc:
        print(f"render error: {exc}", file=sys.stderr)
        return 2

    if args.output:
        Path(args.output).write_text(output, encoding="utf-8")
    else:
        print(output, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
