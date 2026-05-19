"""Conductor entry point.

Wires production clients (FastMCP against the proxy + Anthropic LLM + PR
opener) and launches uvicorn. Tests import `create_app` / `WorkflowDeps`
directly and inject fakes.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path

import uvicorn

from .api import create_app
from .clients.llm import AnthropicLLM, load_system_prompt
from .clients.mcp import FastMCPClient
from .clients.pr import GitHubMCPPROpener, LocalBranchPROpener
from .livekit import MarkerHub
from .runs import RunRegistry
from .workflows import WorkflowDeps


def _build_deps(args: argparse.Namespace) -> WorkflowDeps:
    mcp_client = FastMCPClient(transport=args.proxy_url)
    llm = AnthropicLLM(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    repo = Path(args.repo).resolve()
    pr_opener = (
        GitHubMCPPROpener(
            mcp=mcp_client,
            repo=repo,
            owner=args.github_owner,
            repo_name=args.github_repo,
        )
        if args.github_owner and args.github_repo
        else LocalBranchPROpener(repo=repo)
    )
    return WorkflowDeps(
        mcp=mcp_client,
        llm=llm,
        pr=pr_opener,
        system_prompt=load_system_prompt(),
        marker_hub=MarkerHub(),
    )


def main() -> None:
    parser = argparse.ArgumentParser(prog="conductor")
    parser.add_argument(
        "--proxy-url",
        default=os.environ.get("CATCHATTACK_PROXY_URL", "http://localhost:7100/mcp/"),
        help="MCP proxy streamable-HTTP endpoint.",
    )
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=7200)
    parser.add_argument("--repo", default=".", help="Path to the detections monorepo.")
    parser.add_argument(
        "--github-owner",
        default=os.environ.get("GITHUB_OWNER"),
        help="GitHub owner for PR opener (omit for local-branch mode).",
    )
    parser.add_argument(
        "--github-repo",
        default=os.environ.get("GITHUB_REPO"),
        help="GitHub repo name for PR opener.",
    )
    args = parser.parse_args()

    deps = _build_deps(args)
    app = create_app(RunRegistry(), deps)
    uvicorn.run(app, host=args.host, port=args.port)


if __name__ == "__main__":
    main()
