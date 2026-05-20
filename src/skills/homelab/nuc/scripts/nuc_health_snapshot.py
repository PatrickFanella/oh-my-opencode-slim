#!/usr/bin/env python3
"""Collect a read-only NUC host/Docker/firewall snapshot without printing secrets."""

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
    ("kernel", ["uname", "-a"]),
    ("uptime", ["uptime"]),
    ("memory", ["free", "-h"]),
    ("filesystems", ["df", "-h", "/", "/srv", "/sys/firmware/efi/efivars"]),
    ("addresses", ["ip", "-brief", "addr"]),
    ("routes", ["ip", "route"]),
    ("docker-version", ["docker", "version", "--format", "{{json .}}"]),
    ("docker-info", ["docker", "info", "--format", "{{json .}}"]),
    ("docker-containers", ["docker", "ps", "--format", "{{.Names}}\t{{.Image}}\t{{.Ports}}\t{{.Status}}"]),
    ("docker-networks", ["docker", "network", "ls", "--format", "{{.Name}}\t{{.Driver}}\t{{.Scope}}"]),
    ("compose-projects", ["docker", "compose", "ls", "--format", "json"]),
    ("ufw-status", ["ufw", "status", "verbose"]),
    ("docker-guard-service-active", ["systemctl", "is-active", "nuc-docker-user-policy.service"]),
    ("docker-guard-service-enabled", ["systemctl", "is-enabled", "nuc-docker-user-policy.service"]),
    ("resource-baseline-timer-active", ["systemctl", "is-active", "nuc-resource-baseline.timer"]),
    ("resource-baseline-timer-enabled", ["systemctl", "is-enabled", "nuc-resource-baseline.timer"]),
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
        return CommandResult(
            name="",
            command=command,
            returncode=proc.returncode,
            stdout=proc.stdout.strip(),
            stderr=proc.stderr.strip(),
        )
    except FileNotFoundError as exc:
        return CommandResult("", command, 127, "", str(exc))
    except subprocess.TimeoutExpired as exc:
        stdout = ensure_text(exc.stdout).strip()
        stderr = ensure_text(exc.stderr).strip() or f"timeout after {timeout}s"
        return CommandResult("", command, 124, stdout, stderr)


def with_name(name: str, result: CommandResult) -> CommandResult:
    return CommandResult(name, result.command, result.returncode, result.stdout, result.stderr)


def summarize_publish_state(results: list[CommandResult]) -> dict[str, int]:
    docker_ps = next((result for result in results if result.name == "docker-containers"), None)
    if docker_ps is None or docker_ps.returncode != 0:
        return {"containers": 0, "host_publish_entries": 0, "wildcard_publish_entries": 0}

    containers = 0
    host_publish_entries = 0
    wildcard_publish_entries = 0
    for line in docker_ps.stdout.splitlines():
        if not line.strip():
            continue
        containers += 1
        ports = line.split("\t")[2] if len(line.split("\t")) >= 3 else ""
        entries = [entry.strip() for entry in ports.split(",") if "->" in entry]
        host_publish_entries += len(entries)
        wildcard_publish_entries += sum(
            1 for entry in entries if entry.startswith("0.0.0.0:") or entry.startswith("[::]:")
        )
    return {
        "containers": containers,
        "host_publish_entries": host_publish_entries,
        "wildcard_publish_entries": wildcard_publish_entries,
    }


def render_markdown(timestamp: str, results: list[CommandResult]) -> str:
    lines = [f"# NUC health snapshot", "", f"Collected: `{timestamp}`", ""]
    lines.append("## Docker publish summary")
    lines.append("")
    for key, value in summarize_publish_state(results).items():
        lines.append(f"- `{key}`: `{value}`")
    lines.append("")

    for result in results:
        cmd = " ".join(shlex.quote(part) for part in result.command)
        lines.extend([f"## {result.name}", "", f"Command: `{cmd}`", f"Return code: `{result.returncode}`", ""])
        if result.stdout:
            lines.extend(["```text", result.stdout, "```", ""])
        if result.stderr:
            lines.extend(["stderr:", "```text", result.stderr, "```", ""])
    return "\n".join(lines).rstrip() + "\n"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--json", action="store_true", help="emit JSON instead of Markdown")
    parser.add_argument("--timeout", type=int, default=12, help="per-command timeout in seconds")
    args = parser.parse_args()

    timestamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    results = [with_name(name, run(command, args.timeout)) for name, command in COMMANDS]

    if args.json:
        print(
            json.dumps(
                {
                    "collected_at": timestamp,
                    "publish_summary": summarize_publish_state(results),
                    "commands": [asdict(result) for result in results],
                },
                indent=2,
            )
        )
    else:
        print(render_markdown(timestamp, results), end="")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
