from __future__ import annotations

from pathlib import Path

import pytest
from sigma_mcp.dedupe import dedupe_against_corpus
from sigma_mcp.embed import HashEmbedder
from sigma_mcp.models import DedupeReport, ServerError


@pytest.fixture
def corpus_with_powershell_rule(tmp_path: Path, psh_encoded: str, unrelated_rule: str) -> Path:
    root = tmp_path / "detections"
    sub = root / "enterprise" / "windows" / "execution"
    sub.mkdir(parents=True)
    (sub / "win_psh_encoded.yml").write_text(psh_encoded, encoding="utf-8")
    (sub / "linux_revshell.yml").write_text(unrelated_rule, encoding="utf-8")
    return root


def test_dedupe_identifies_near_duplicate(
    corpus_with_powershell_rule: Path, psh_encoded_near_dupe: str
) -> None:
    report = dedupe_against_corpus(
        psh_encoded_near_dupe,
        str(corpus_with_powershell_rule),
        embedder=HashEmbedder(),
    )
    assert isinstance(report, DedupeReport)
    assert report.matches, "expected the near-duplicate to surface a match"
    top = report.matches[0]
    assert "PowerShell" in top.title
    assert top.score > 0.4


def test_dedupe_flags_near_duplicate_above_lowered_threshold(
    corpus_with_powershell_rule: Path, psh_encoded_near_dupe: str
) -> None:
    report = dedupe_against_corpus(
        psh_encoded_near_dupe,
        str(corpus_with_powershell_rule),
        threshold=0.4,
        embedder=HashEmbedder(),
    )
    assert isinstance(report, DedupeReport)
    assert report.is_duplicate
    assert report.max_score >= 0.4


def test_dedupe_does_not_flag_unrelated_rule(
    corpus_with_powershell_rule: Path, unrelated_rule: str
) -> None:
    report = dedupe_against_corpus(
        unrelated_rule,
        str(corpus_with_powershell_rule),
        threshold=0.85,
        embedder=HashEmbedder(),
    )
    assert isinstance(report, DedupeReport)
    if report.matches:
        assert report.matches[0].score < 0.85
    assert not report.is_duplicate


def test_dedupe_missing_corpus_path_returns_server_error(tmp_path: Path, psh_encoded: str) -> None:
    result = dedupe_against_corpus(
        psh_encoded,
        str(tmp_path / "does_not_exist"),
    )
    assert isinstance(result, ServerError)
    assert result.error == "corpus_not_found"


def test_dedupe_records_embedder_identity(
    corpus_with_powershell_rule: Path, psh_encoded_near_dupe: str
) -> None:
    report = dedupe_against_corpus(
        psh_encoded_near_dupe,
        str(corpus_with_powershell_rule),
        embedder=HashEmbedder(dim=128),
    )
    assert isinstance(report, DedupeReport)
    assert report.embedder == "hash-128"
