#!/usr/bin/env python3
"""Audit active almaz Markdown docs for frontmatter, metadata, and stale claims."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path


DEFAULT_ROOT = Path("/home/onnwee/docs/almaz")

STALE_PATTERNS = {
    "old OS/kernel baseline": re.compile(r"Ubuntu 25\.10|Questing|6\.17\.0-19", re.IGNORECASE),
    "old desktop stack as current": re.compile(
        r"KDE Plasma 6\.4\.5 on Wayland, Polonium tiling, tmux \+ WezTerm|\| Desktop \| KDE Plasma|\| Terminal \| WezTerm",
        re.IGNORECASE,
    ),
    "old display manager as current": re.compile(r"\| Login manager \| SDDM|sddm\.service.*active", re.IGNORECASE),
    "router backup still scaffold only": re.compile(
        r"Created but not enabled until credentials exist|Enable timer only after a successful manual run",
        re.IGNORECASE,
    ),
    "active stale languagetool bug wording": re.compile(
        r"Caddyfile has a stale languagetool entry causing|Stale `languagetool` route \(active bug\)",
        re.IGNORECASE,
    ),
    "old wg-easy client date": re.compile(r"0 clients configured as of 2026-04-08", re.IGNORECASE),
    "cloudflared all-routes-to-caddy wording": re.compile(
        r"All public hostnames funnel into Caddy|Single tunnel routes 4 domains to Caddy",
        re.IGNORECASE,
    ),
}

HISTORICAL_DIRS = {"journal", "proposals", "reviews"}


@dataclass(frozen=True)
class Issue:
    severity: str
    path: str
    check: str
    detail: str


def rel(path: Path, root: Path) -> str:
    try:
        return str(path.relative_to(root))
    except ValueError:
        return str(path)


def iter_markdown(root: Path, include_historical: bool) -> list[Path]:
    files: list[Path] = []
    for path in sorted(root.rglob("*.md")):
        relative_parts = path.relative_to(root).parts
        if not include_historical and relative_parts and relative_parts[0] in HISTORICAL_DIRS:
            continue
        files.append(path)
    return files


def extract_frontmatter(text: str) -> str | None:
    if not text.startswith("---\n"):
        return None
    match = re.match(r"^---\n(.*?)\n---(?:\n|$)", text, re.DOTALL)
    return match.group(1) if match else None


def has_key(frontmatter: str, key: str) -> bool:
    return re.search(rf"(?m)^\s*{re.escape(key)}\s*:", frontmatter) is not None


def audit_file(path: Path, root: Path, stale_patterns: dict[str, re.Pattern[str]], require_frontmatter: bool) -> list[Issue]:
    issues: list[Issue] = []
    text = path.read_text(encoding="utf-8", errors="replace")
    relative = rel(path, root)
    frontmatter = extract_frontmatter(text)

    if require_frontmatter:
        if frontmatter is None:
            issues.append(Issue("warning", relative, "frontmatter", "missing YAML frontmatter"))
        else:
            has_created = has_key(frontmatter, "created")
            has_updated = has_key(frontmatter, "updated") or has_key(frontmatter, "last_reviewed")
            if not has_created and not has_updated:
                issues.append(Issue("warning", relative, "metadata", "missing created/updated/last_reviewed metadata"))

    for label, pattern in stale_patterns.items():
        for match in pattern.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            snippet = " ".join(text[match.start() : match.end()].split())
            issues.append(Issue("warning", relative, "stale-claim", f"{label} at line {line}: {snippet}"))

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default=str(DEFAULT_ROOT), help="almaz docs root")
    parser.add_argument("--include-historical", action="store_true", help="include journal/proposals/reviews")
    parser.add_argument("--json", action="store_true", help="emit JSON instead of text")
    parser.add_argument("--no-fail", action="store_true", help="exit 0 even when issues are found")
    parser.add_argument("--require-frontmatter", action="store_true", help="warn when docs lack YAML frontmatter")
    parser.add_argument("--stale-pattern", action="append", default=[], metavar="REGEX", help="additional stale regex")
    args = parser.parse_args()

    root = Path(args.root).expanduser().resolve()
    if not root.exists():
        print(f"docs root does not exist: {root}", file=sys.stderr)
        return 2

    stale_patterns = dict(STALE_PATTERNS)
    for index, raw in enumerate(args.stale_pattern, start=1):
        try:
            stale_patterns[f"custom stale pattern {index}"] = re.compile(raw, re.IGNORECASE)
        except re.error as exc:
            print(f"invalid --stale-pattern {raw!r}: {exc}", file=sys.stderr)
            return 2

    files = iter_markdown(root, args.include_historical)
    issues: list[Issue] = []
    for path in files:
        issues.extend(audit_file(path, root, stale_patterns, args.require_frontmatter))

    summary = {
        "root": str(root),
        "include_historical": args.include_historical,
        "markdown_files": len(files),
        "issues": len(issues),
        "warnings": sum(1 for issue in issues if issue.severity == "warning"),
        "errors": sum(1 for issue in issues if issue.severity == "error"),
    }

    if args.json:
        print(json.dumps({"summary": summary, "issues": [asdict(issue) for issue in issues]}, indent=2))
    else:
        print(
            "almaz_doc_audit: "
            f"files={summary['markdown_files']} errors={summary['errors']} warnings={summary['warnings']}"
        )
        for issue in issues:
            print(f"[{issue.severity}] {issue.path}: {issue.check}: {issue.detail}")

    return 0 if args.no_fail or not issues else 1


if __name__ == "__main__":
    raise SystemExit(main())
