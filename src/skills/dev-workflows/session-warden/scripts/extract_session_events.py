#!/usr/bin/env python3
"""Extract session/task lifecycle lines from a log file."""

from __future__ import annotations

import re
import sys
from pathlib import Path

PATTERN = re.compile(r"(session\.|task|cancel_task|background job|multiplexer|tmux|zellij)", re.I)


def main() -> int:
    if len(sys.argv) != 2:
        print("Usage: extract_session_events.py <log-file>")
        return 2
    path = Path(sys.argv[1])
    for number, line in enumerate(path.read_text(errors="replace").splitlines(), 1):
        if PATTERN.search(line):
            print(f"{number}: {line}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
