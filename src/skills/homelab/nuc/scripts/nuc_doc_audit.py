#!/usr/bin/env python3
"""Audit active .nuc Markdown docs for frontmatter, metadata, and stale claims."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from pathlib import Path


DEFAULT_ROOT = Path("/home/onnwee/.nuc")

STALE_PATTERNS = {
    "historical wildcard Docker exposure wording": re.compile(
        r"Docker publishes many ports|Many Docker services publish|0\.0\.0\.0/\[::\]",
        re.IGNORECASE,
    ),
    "historical firewall persistence uncertainty": re.compile(
        r"may not be persisted|Firewall persistence incomplete|DOCKER-USER\s+may\s+not\s+persist",
        re.IGNORECASE,
    ),
    "re-opened n8n host decision": re.compile(
        r"Decide whether n8n lives|n8n lives on almaz permanently or migrates to nuc",
        re.IGNORECASE,
    ),
    "remediated dash inline secret wording": re.compile(
        r"Inline DATABASE_URL value exists|migrate to env/secret reference",
        re.IGNORECASE,
    ),
    "old route/count wording": re.compile(r"\b49 total\b|\b56 Caddy\b", re.IGNORECASE),
}


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


def iter_markdown(root: Path, include_archive: bool) -> list[Path]:
    files: list[Path] = []
    for path in sorted(root.rglob("*.md")):
        if not include_archive and "90-archive" in path.parts:
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


def audit_file(
    path: Path,
    root: Path,
    stale_patterns: dict[str, re.Pattern[str]],
    require_created_updated: bool,
) -> list[Issue]:
    issues: list[Issue] = []
    text = path.read_text(encoding="utf-8", errors="replace")
    relative = rel(path, root)
    frontmatter = extract_frontmatter(text)

    if frontmatter is None:
        issues.append(Issue("error", relative, "frontmatter", "missing YAML frontmatter"))
    else:
        has_created = has_key(frontmatter, "created")
        has_updated = has_key(frontmatter, "updated")
        if not has_created and not has_updated:
            issues.append(Issue("error", relative, "metadata", "missing both `created:` and `updated:`"))
        elif require_created_updated:
            for key, present in (("created", has_created), ("updated", has_updated)):
                if not present:
                    issues.append(Issue("warning", relative, "metadata", f"missing `{key}:` in frontmatter"))

    for label, pattern in stale_patterns.items():
        for match in pattern.finditer(text):
            line = text.count("\n", 0, match.start()) + 1
            snippet = " ".join(text[match.start() : match.end()].split())
            issues.append(Issue("warning", relative, "stale-claim", f"{label} at line {line}: {snippet}"))

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("root", nargs="?", default=str(DEFAULT_ROOT), help=".nuc docs root")
    parser.add_argument("--include-archive", action="store_true", help="include 90-archive docs")
    parser.add_argument("--json", action="store_true", help="emit JSON instead of text")
    parser.add_argument("--no-fail", action="store_true", help="exit 0 even when issues are found")
    parser.add_argument(
        "--require-created-updated",
        action="store_true",
        help="warn when a doc has only one of created/updated instead of both",
    )
    parser.add_argument(
        "--stale-pattern",
        action="append",
        default=[],
        metavar="REGEX",
        help="additional stale-claim regex to scan for",
    )
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

    files = iter_markdown(root, args.include_archive)
    issues: list[Issue] = []
    for path in files:
        issues.extend(audit_file(path, root, stale_patterns, args.require_created_updated))

    summary = {
        "root": str(root),
        "include_archive": args.include_archive,
        "markdown_files": len(files),
        "issues": len(issues),
        "errors": sum(1 for issue in issues if issue.severity == "error"),
        "warnings": sum(1 for issue in issues if issue.severity == "warning"),
    }

    if args.json:
        print(json.dumps({"summary": summary, "issues": [asdict(issue) for issue in issues]}, indent=2))
    else:
        print(
            "nuc_doc_audit: "
            f"files={summary['markdown_files']} errors={summary['errors']} warnings={summary['warnings']}"
        )
        for issue in issues:
            print(f"[{issue.severity}] {issue.path}: {issue.check}: {issue.detail}")

    return 0 if args.no_fail or not issues else 1


if __name__ == "__main__":
    raise SystemExit(main())
