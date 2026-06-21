#!/usr/bin/env python3
"""Monthly ars-malefica vault maintenance report.

Reports metadata gaps and maintenance queues without printing secrets.
"""

from __future__ import annotations

import argparse
import json
import subprocess
from datetime import date, datetime, timedelta
from pathlib import Path

try:
    import yaml  # type: ignore
except Exception:  # pragma: no cover - fallback path
    yaml = None

EXCLUDE_PREFIXES = ("004 Archives/", ".obsidian/", ".trash/", ".superpowers/", ".smart-env/")


def read_frontmatter(text: str):
    if not text.startswith("---\n"):
        return None, text
    end = text.find("\n---\n", 4)
    if end == -1:
        return "INVALID", text
    raw = text[4:end]
    body = text[end + 5 :]
    if yaml is not None:
        try:
            data = yaml.safe_load(raw) or {}
            if not isinstance(data, dict):
                return "INVALID", body
            return data, body
        except Exception:
            return "INVALID", body
    data = {}
    current = None
    for line in raw.splitlines():
        if not line.strip():
            continue
        stripped = line.strip()
        if stripped.startswith("-") and current:
            data.setdefault(current, []).append(line[1:].strip().strip('"\''))
            continue
        if ":" not in line:
            return "INVALID", body
        key, value = line.split(":", 1)
        current = key.strip()
        value = value.strip().strip('"\'')
        data[current] = [] if value == "" else value
    return data, body


def included(path: Path) -> bool:
    s = path.as_posix()
    return path.suffix.lower() == ".md" and not any(s.startswith(prefix) for prefix in EXCLUDE_PREFIXES)


def git_check_ignore(root: Path, rel: str) -> bool:
    try:
        result = subprocess.run(
            ["/usr/bin/git", "check-ignore", "-q", rel],
            cwd=root,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            check=False,
        )
        return result.returncode == 0
    except FileNotFoundError:
        return False


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("root", nargs="?", default=".")
    parser.add_argument("--json", action="store_true")
    args = parser.parse_args()

    root = Path(args.root).resolve()
    cutoff = date.today() - timedelta(days=90)
    rows = []
    for path in sorted(root.rglob("*.md")):
        rel = path.relative_to(root)
        if not included(rel):
            continue
        text = path.read_text(errors="replace")
        fm, body = read_frontmatter(text)
        updated = fm.get("updated") if isinstance(fm, dict) else None
        stale = False
        if isinstance(updated, str):
            try:
                stale = datetime.fromisoformat(updated.strip("'\"")).date() < cutoff
            except ValueError:
                stale = True
        rows.append(
            {
                "path": rel.as_posix(),
                "has_frontmatter": isinstance(fm, dict),
                "invalid_frontmatter": fm == "INVALID",
                "type": fm.get("type") if isinstance(fm, dict) else None,
                "status": fm.get("status") if isinstance(fm, dict) else None,
                "updated": updated,
                "stale_updated": stale,
                "has_outgoing_links": "[[" in body,
                "is_workbench": isinstance(fm, dict) and fm.get("type") == "workbench",
            }
        )

    report = {
        "root": str(root),
        "non_archive_markdown": len(rows),
        "missing_frontmatter": sum(not r["has_frontmatter"] for r in rows),
        "invalid_frontmatter": sum(r["invalid_frontmatter"] for r in rows),
        "missing_type": sum(r["has_frontmatter"] and not r["type"] for r in rows),
        "missing_status": sum(r["has_frontmatter"] and not r["status"] for r in rows),
        "stale_updated": sum(r["stale_updated"] for r in rows),
        "no_outgoing_links": sum(not r["has_outgoing_links"] for r in rows),
        "stale_workbenches": [r["path"] for r in rows if r["is_workbench"] and r["stale_updated"]],
        "inbox_markdown": [r["path"] for r in rows if r["path"].startswith("000 Inbox/")],
        "remotely_save_data_ignored": git_check_ignore(root, ".obsidian/plugins/remotely-save/data.json"),
    }

    if args.json:
        print(json.dumps(report, indent=2, sort_keys=True))
    else:
        print("# Vault Monthly Check")
        for key, value in report.items():
            if isinstance(value, list):
                print(f"{key}: {len(value)}")
                for item in value[:20]:
                    print(f"- {item}")
                if len(value) > 20:
                    print(f"- ... {len(value) - 20} more")
            else:
                print(f"{key}: {value}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
