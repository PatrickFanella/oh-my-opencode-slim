#!/usr/bin/env python3
"""Render a Markdown template containing {{placeholders}}."""

from __future__ import annotations

import argparse
import re
from pathlib import Path

PLACEHOLDER_RE = re.compile(r"{{\s*([a-zA-Z0-9_\-]+)\s*}}")


def parse_vars(items: list[str]) -> dict[str, str]:
    values: dict[str, str] = {}
    for item in items:
        if "=" not in item:
            raise SystemExit(f"Invalid --var {item!r}; expected key=value")
        key, value = item.split("=", 1)
        values[key.strip()] = value
    return values


def render(text: str, values: dict[str, str], keep_missing: bool) -> str:
    def replace(match: re.Match[str]) -> str:
        key = match.group(1)
        if key in values:
            return values[key]
        return match.group(0) if keep_missing else ""

    return PLACEHOLDER_RE.sub(replace, text)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("template", type=Path, help="Template Markdown file")
    parser.add_argument("--var", action="append", default=[], help="Template variable as key=value")
    parser.add_argument("--output", type=Path, help="Optional output path")
    parser.add_argument("--keep-missing", action="store_true", help="Leave unknown placeholders intact")
    args = parser.parse_args()

    text = args.template.read_text(encoding="utf-8")
    output = render(text, parse_vars(args.var), args.keep_missing)
    if args.output:
        args.output.write_text(output, encoding="utf-8")
    else:
        print(output, end="")


if __name__ == "__main__":
    main()
