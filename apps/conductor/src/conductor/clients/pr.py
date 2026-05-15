"""PR opener — pluggable.

`LocalBranchPROpener` writes the rule file to a branch in the local git repo
and returns a `PRResult` describing what *would* be opened. Used when the
GitHub MCP is not connected.

`GitHubMCPPROpener` calls `github.create_pull_request` via the MCP proxy.
Wired up when a GitHub PAT is available; defaults to the LocalBranch path
otherwise.
"""

from __future__ import annotations

import subprocess
from collections.abc import Iterable
from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from .mcp import MCPClient


@dataclass(frozen=True, slots=True)
class PRArtifacts:
    """Rendered artifacts the workflow attaches to the PR."""

    rule_path: str
    rule_yaml: str
    capture_id: str
    second_capture_id: str
    spl: str
    fp_report_md: str
    validation_hit_count: int
    reasoning_trace: str
    title: str
    body: str
    labels: tuple[str, ...]


@dataclass(frozen=True, slots=True)
class PRResult:
    backend: str  # "local_branch" | "github_mcp"
    pr_url: str | None  # populated by GitHub MCP path
    branch: str
    commit_sha: str | None
    rule_path: str


class PROpener(Protocol):
    async def open(self, artifacts: PRArtifacts) -> PRResult: ...


def _run_git(repo: Path, *args: str) -> str:
    # git is on $PATH; args are fully constructed in-process, never user-supplied.
    cmd: list[str] = ["git", *args]
    out = subprocess.run(  # noqa: S603
        cmd,
        cwd=repo,
        check=True,
        capture_output=True,
        text=True,
    )
    return out.stdout.strip()


class LocalBranchPROpener:
    """Writes the rule + report to a local branch.

    Branch naming: `conductor/<technique>-<short_capture_id>`. Reports are
    saved under `detections/_meta/conductor_runs/` so reviewers can find them.
    """

    def __init__(self, repo: Path | str, *, base_branch: str = "main") -> None:
        self._repo = Path(repo)
        self._base = base_branch

    async def open(self, artifacts: PRArtifacts) -> PRResult:
        repo = self._repo
        short = artifacts.capture_id[:8]
        branch = f"conductor/{_slug(artifacts.title)}-{short}"

        # Write rule.
        rule_path = repo / artifacts.rule_path
        rule_path.parent.mkdir(parents=True, exist_ok=True)
        rule_path.write_text(artifacts.rule_yaml, encoding="utf-8")

        # Write attachment report.
        report_dir = repo / "detections" / "_meta" / "conductor_runs" / short
        report_dir.mkdir(parents=True, exist_ok=True)
        (report_dir / "report.md").write_text(artifacts.body, encoding="utf-8")
        (report_dir / "spl.txt").write_text(artifacts.spl, encoding="utf-8")
        (report_dir / "fp_report.md").write_text(artifacts.fp_report_md, encoding="utf-8")
        (report_dir / "reasoning.md").write_text(artifacts.reasoning_trace, encoding="utf-8")

        if _is_git_repo(repo):
            _run_git(repo, "checkout", "-B", branch)
            paths_to_add: Iterable[str] = (
                str(rule_path.relative_to(repo)),
                str(report_dir.relative_to(repo)),
            )
            _run_git(repo, "add", *paths_to_add)
            try:
                _run_git(repo, "commit", "-m", artifacts.title)
                sha = _run_git(repo, "rev-parse", "HEAD")
            except subprocess.CalledProcessError:
                # Allow re-runs on top of existing artifacts.
                sha = _run_git(repo, "rev-parse", "HEAD")
        else:
            sha = None

        return PRResult(
            backend="local_branch",
            pr_url=None,
            branch=branch,
            commit_sha=sha,
            rule_path=str(rule_path.relative_to(repo)),
        )


class GitHubMCPPROpener:
    """Opens a PR via `github.create_pull_request` on the MCP proxy.

    Falls back to the LocalBranchPROpener when the call fails (offline or
    GitHub MCP not configured).
    """

    def __init__(
        self,
        mcp: MCPClient,
        repo: Path | str,
        *,
        owner: str,
        repo_name: str,
        base_branch: str = "main",
    ) -> None:
        self._mcp = mcp
        self._local = LocalBranchPROpener(repo, base_branch=base_branch)
        self._owner = owner
        self._repo = repo_name
        self._base = base_branch

    async def open(self, artifacts: PRArtifacts) -> PRResult:
        local = await self._local.open(artifacts)
        try:
            response = await self._mcp.call(
                "github.create_pull_request",
                {
                    "owner": self._owner,
                    "repo": self._repo,
                    "title": artifacts.title,
                    "head": local.branch,
                    "base": self._base,
                    "body": artifacts.body,
                    "labels": list(artifacts.labels),
                },
            )
        except Exception:
            return local
        pr_url = response.get("html_url") or response.get("url")
        return PRResult(
            backend="github_mcp",
            pr_url=pr_url,
            branch=local.branch,
            commit_sha=local.commit_sha,
            rule_path=local.rule_path,
        )


def _slug(s: str) -> str:
    return "".join(c.lower() if c.isalnum() else "-" for c in s).strip("-").replace("--", "-")[:60]


def _is_git_repo(path: Path) -> bool:
    cmd: list[str] = ["git", "rev-parse", "--git-dir"]
    try:
        subprocess.run(  # noqa: S603
            cmd,
            cwd=path,
            check=True,
            capture_output=True,
        )
    except (subprocess.CalledProcessError, FileNotFoundError):
        return False
    return True
