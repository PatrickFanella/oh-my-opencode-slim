#!/usr/bin/env python3
"""Static, resumable audit helper for OMOC's bundled skill catalog."""

from __future__ import annotations

import argparse
import json
import re
import sys
from dataclasses import asdict, dataclass
from datetime import datetime, timezone
from pathlib import Path


RESOURCE_DIRS = ("references", "scripts", "assets", "templates", "examples")
OMOC_DIRECT_SKILLS = {"clonedeps", "codemap", "simplify"}


@dataclass
class SkillAudit:
    name: str
    path: str
    category: str
    score: int
    outcome: str
    findings: list[str]
    resources: dict[str, int]
    lines: int
    description_length: int


def split_frontmatter(text: str) -> tuple[dict[str, str] | None, str]:
    if not text.startswith("---\n"):
        return None, text
    parts = text.split("\n")
    try:
        end_index = parts[1:].index("---") + 1
    except ValueError:
        return None, text
    frontmatter: dict[str, str] = {}
    for line in parts[1:end_index]:
        if line.startswith((" ", "\t")) or ":" not in line:
            continue
        key, value = line.split(":", 1)
        frontmatter[key.strip()] = value.strip().strip('"\'')
    return frontmatter, "\n".join(parts[end_index + 1 :])


def iter_skill_dirs(root: Path, include_system: bool) -> list[Path]:
    skills_root = root / "src" / "skills"
    dirs = []
    for skill_file in sorted(skills_root.rglob("SKILL.md")):
        skill_dir = skill_file.parent
        rel_parts = skill_dir.relative_to(skills_root).parts
        if not include_system and any(part.startswith(".") for part in rel_parts):
            continue
        if len(rel_parts) == 1 and rel_parts[0] in OMOC_DIRECT_SKILLS:
            continue
        dirs.append(skill_dir)
    return dirs


def count_files(directory: Path) -> int:
    return sum(1 for path in directory.rglob("*") if path.is_file()) if directory.exists() else 0


def audit_skill(root: Path, skill_dir: Path) -> SkillAudit:
    skills_root = root / "src" / "skills"
    skill_file = skill_dir / "SKILL.md"
    rel_path = skill_file.relative_to(root)
    rel_parts = skill_dir.relative_to(skills_root).parts
    category = rel_parts[0] if len(rel_parts) > 1 else "domain"
    text = skill_file.read_text(encoding="utf-8", errors="ignore")
    frontmatter, body = split_frontmatter(text)
    findings: list[str] = []
    name = skill_dir.name
    description = ""
    if frontmatter is None:
        findings.append("missing YAML frontmatter")
    else:
        name = frontmatter.get("name", "") or skill_dir.name
        description = frontmatter.get("description", "")
        if not description:
            findings.append("missing description")
        if len(description) > 1024:
            findings.append("description exceeds 1024 chars")
    line_count = len(text.splitlines())
    if line_count > 300:
        findings.append(f"SKILL.md is large ({line_count} lines)")
    resources = {name: count_files(skill_dir / name) for name in RESOURCE_DIRS}
    if any(resources.values()) and "resource" not in body.lower():
        findings.append("resource dirs present but weak/missing resource map")
    for match in re.findall(r"\[[^\]]+\]\(([^)]+)\)", body):
        target = match.split("#", 1)[0].strip()
        if target and not target.startswith(("http://", "https://", "mailto:", "#", "/")):
            if not (skill_dir / target).exists():
                findings.append(f"broken local link: {target}")
                break
    score = max(0, 22 - len(findings) * 3)
    outcome = "clean" if not findings else ("minor-edit" if score >= 15 else "focused-repair")
    return SkillAudit(
        name=name,
        path=str(rel_path),
        category=category,
        score=score,
        outcome=outcome,
        findings=findings,
        resources=resources,
        lines=line_count,
        description_length=len(description),
    )


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--batch-size", type=int, default=0)
    parser.add_argument("--include-system", action="store_true")
    parser.add_argument("--resume", action="store_true")
    parser.add_argument("--until-complete", action="store_true")
    parser.add_argument("--max-batches", type=int, default=0)
    parser.add_argument("--report", action="store_true")
    args = parser.parse_args()

    root = Path(__file__).resolve().parent.parent
    audits = [audit_skill(root, skill_dir) for skill_dir in iter_skill_dirs(root, args.include_system)]
    audits.sort(key=lambda item: (item.outcome == "clean", item.score, item.path))
    selected = audits[: args.batch_size] if args.batch_size > 0 else audits
    payload = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "total": len(audits),
        "selected": len(selected),
        "audits": [asdict(audit) for audit in selected],
    }
    print(json.dumps(payload, indent=2))
    if args.report:
        out_dir = root / "src" / "skills" / "audits"
        out_dir.mkdir(parents=True, exist_ok=True)
        report = out_dir / f"skill-audit-{datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ')}.json"
        report.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    return 0


if __name__ == "__main__":
    sys.exit(main())
