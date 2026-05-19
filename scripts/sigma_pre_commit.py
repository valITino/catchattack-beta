"""Pre-commit hook: lint Sigma rules under detections/ via mcp/sigma.

Called by .pre-commit-config.yaml. Receives a list of changed files, runs
each through `sigma_mcp.lint.lint_sigma`, and reports any errors. Style
warnings and info are surfaced but do not block the commit.
"""

from __future__ import annotations

import sys
from pathlib import Path

from sigma_mcp.lint import lint_sigma


def main(argv: list[str]) -> int:
    if not argv:
        return 0
    failed = 0
    for arg in argv:
        path = Path(arg)
        if not path.exists():
            continue
        text = path.read_text(encoding="utf-8")
        report = lint_sigma(text)
        if not report.ok:
            failed += 1
            print(f"\033[31m[sigma-lint] {path}\033[0m")
            for issue in report.errors:
                where = f" ({issue.path})" if issue.path else ""
                print(f"  error  {issue.code}{where}: {issue.message}")
        if report.warnings:
            print(f"\033[33m[sigma-lint] {path}\033[0m")
            for issue in report.warnings:
                where = f" ({issue.path})" if issue.path else ""
                print(f"  warning {issue.code}{where}: {issue.message}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
