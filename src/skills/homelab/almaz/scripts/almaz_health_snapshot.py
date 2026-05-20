#!/usr/bin/env python3
"""Collect a read-only Almaz host/Docker/storage/backup snapshot without printing secrets."""

from __future__ import annotations

import argparse
import json
import shlex
import subprocess
from dataclasses import asdict, dataclass
from datetime import datetime, timezone


@dataclass(frozen=True)
class CommandResult:
    name: str
    command: list[str]
    returncode: int
    stdout: str
    stderr: str


COMMANDS: list[tuple[str, list[str]]] = [
    ("hostnamectl", ["hostnamectl"]),
    ("release", ["lsb_release", "-a"]),
    ("kernel", ["uname", "-a"]),
    ("uptime", ["uptime"]),
    ("memory", ["free", "-h"]),
    ("filesystems", ["df", "-h", "/", "/mnt/spektr", "/mnt/arkhiv", "/mnt/rezerv"]),
    ("mounts", ["bash", "-lc", "for m in /mnt/arkhiv /mnt/spektr /mnt/rezerv /mnt/kamera1 /mnt/kamera2 /mnt/kamera3 /mnt/impuls; do findmnt -no TARGET,SOURCE,FSTYPE,OPTIONS --target \"$m\" || true; done"]),
    ("failed-units", ["systemctl", "--failed", "--no-pager"]),
    ("docker-version", ["docker", "version", "--format", "{{json .}}"]),
    ("docker-containers", ["docker", "ps", "--format", "{{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Label \"com.docker.compose.project.working_dir\"}}"]),
    ("docker-unhealthy", ["docker", "ps", "--filter", "health=unhealthy", "--format", "{{.Names}}\t{{.Status}}"]),
    ("docker-restarting", ["docker", "ps", "--filter", "status=restarting", "--format", "{{.Names}}\t{{.Status}}"]),
    ("nvidia", ["nvidia-smi", "--query-gpu=name,driver_version,temperature.gpu,memory.total", "--format=csv,noheader"]),
    ("snapraid-status", ["snapraid", "status"]),
    ("almaz-health-timer", ["systemctl", "is-enabled", "almaz-health-check.timer"]),
    ("almaz-backup-timer", ["systemctl", "is-enabled", "almaz-router-restic-backup.timer"]),
    ("timers", ["systemctl", "list-timers", "--all", "--no-pager"]),
]


def ensure_text(value: str | bytes | None) -> str:
    if value is None:
        return ""
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


def run(command: list[str], timeout: int) -> CommandResult:
    try:
        proc = subprocess.run(command, capture_output=True, text=True, timeout=timeout, check=False)
        return CommandResult("", command, proc.returncode, proc.stdout.strip(), proc.stderr.strip())
    except FileNotFoundError as exc:
        return CommandResult("", command, 127, "", str(exc))
    except subprocess.TimeoutExpired as exc:
        stdout = ensure_text(exc.stdout).strip()
        stderr = ensure_text(exc.stderr).strip() or f"timeout after {timeout}s"
        return CommandResult("", command, 124, stdout, stderr)


def with_name(name: str, result: CommandResult) -> CommandResult:
    return CommandResult(name, result.command, result.returncode, result.stdout, result.stderr)


def summarize_containers(results: list[CommandResult]) -> dict[str, int]:
    docker_ps = next((result for result in results if result.name == "docker-containers"), None)
    unhealthy = next((result for result in results if result.name == "docker-unhealthy"), None)
    restarting = next((result for result in results if result.name == "docker-restarting"), None)
    containers = 0 if docker_ps is None or not docker_ps.stdout else len([line for line in docker_ps.stdout.splitlines() if line.strip()])
    unhealthy_count = 0 if unhealthy is None or not unhealthy.stdout else len([line for line in unhealthy.stdout.splitlines() if line.strip()])
    restarting_count = 0 if restarting is None or not restarting.stdout else len([line for line in restarting.stdout.splitlines() if line.strip()])
    return {"containers": containers, "unhealthy": unhealthy_count, "restarting": restarting_count}


def render_markdown(timestamp: str, results: list[CommandResult]) -> str:
    lines = ["# Almaz health snapshot", "", f"Collected: `{timestamp}`", ""]
    lines.append("## Docker summary")
    lines.append("")
    for key, value in summarize_containers(results).items():
        lines.append(f"- `{key}`: `{value}`")
    lines.append("")

    for result in results:
        cmd = " ".join(shlex.quote(part) for part in result.command)
        lines.extend([f"## {result.name}", "", f"Command: `{cmd}`", f"Return code: `{result.returncode}`", ""])
        if result.stdout:
            stdout = result.stdout
            if result.name == "snapraid-status":
                stdout = "\n".join(
                    line for line in stdout.splitlines()
                    if any(token in line for token in ("No error detected", "not scrubbed", "oldest block", "No sync is in progress", "zero sub-second"))
                ) or stdout[-3000:]
            lines.extend(["```text", stdout, "```", ""])
        if result.stderr:
            lines.extend(["stderr:", "```text", result.stderr, "```", ""])
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="emit JSON instead of Markdown")
    parser.add_argument("--timeout", type=int, default=20, help="per-command timeout in seconds")
    args = parser.parse_args()

    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    results = [with_name(name, run(command, args.timeout)) for name, command in COMMANDS]

    if args.json:
        print(json.dumps({"collected_at": timestamp, "docker_summary": summarize_containers(results), "commands": [asdict(result) for result in results]}, indent=2))
    else:
        print(render_markdown(timestamp, results), end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
