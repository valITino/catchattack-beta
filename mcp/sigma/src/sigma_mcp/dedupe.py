"""Dedupe a candidate Sigma rule against a local corpus.

Combines two signals:

- **AST overlap.** Pure structural similarity computed from the parsed rule's
  detection block: a Jaccard score over the set of `(field, modifier, value)`
  triples plus condition tokens. Robust to whitespace and comment differences.
- **Embedding similarity.** Text-level cosine via a pluggable `Embedder`. By
  default `make_embedder()` tries `sentence-transformers/all-MiniLM-L6-v2`
  and falls back to a deterministic hash embedder when transformers are
  unavailable. The embedder identifies itself so the report shows which
  signal produced the score.

Combined score = max(AST overlap, embedding similarity), per the brief's
intent that either *structural* or *semantic* overlap is enough to flag a
near-duplicate.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any

import yaml

from .embed import Embedder, cosine, make_embedder
from .models import DedupeMatch, DedupeReport, ServerError

_DEFAULT_THRESHOLD = 0.85
_TOP_K = 5


def _flatten_detection(detection: Any) -> set[str]:
    """Reduce a Sigma detection block to a set of comparable string tokens.

    Each selection becomes a set of `field|modifier=value` strings; the
    union across selections plus the condition's tokens makes up the signature.
    """
    if not isinstance(detection, dict):
        return set()
    tokens: set[str] = set()
    for key, value in detection.items():
        if key == "condition":
            if isinstance(value, str):
                for tok in value.replace("(", " ").replace(")", " ").split():
                    tokens.add(f"cond:{tok.lower()}")
            elif isinstance(value, list):
                for item in value:
                    if isinstance(item, str):
                        for tok in item.replace("(", " ").replace(")", " ").split():
                            tokens.add(f"cond:{tok.lower()}")
            continue
        tokens.update(_flatten_selection(value))
    return tokens


def _flatten_selection(node: Any, prefix: str = "") -> set[str]:
    out: set[str] = set()
    if isinstance(node, dict):
        for k, v in node.items():
            child_prefix = f"{prefix}.{k}" if prefix else str(k)
            out.update(_flatten_selection(v, child_prefix))
    elif isinstance(node, list):
        for item in node:
            if isinstance(item, dict):
                out.update(_flatten_selection(item, prefix))
            else:
                out.add(f"{prefix}={item!s}")
    else:
        out.add(f"{prefix}={node!s}")
    return out


def _ast_jaccard(a: set[str], b: set[str]) -> float:
    if not a and not b:
        return 0.0
    if not a or not b:
        return 0.0
    inter = len(a & b)
    union = len(a | b)
    return inter / union if union else 0.0


def _rule_text_for_embedding(doc: dict[str, Any]) -> str:
    """Build a stable text representation for embedding comparison."""
    parts: list[str] = []
    for key in ("title", "description"):
        v = doc.get(key)
        if isinstance(v, str):
            parts.append(v)
    tags = doc.get("tags")
    if isinstance(tags, list):
        parts.extend(str(t) for t in tags)
    parts.append(yaml.safe_dump(doc.get("detection") or {}, sort_keys=True))
    return "\n".join(parts)


def _iter_corpus(corpus_path: Path) -> list[tuple[Path, dict[str, Any]]]:
    """Yield (path, parsed_doc) for every .yml/.yaml file under corpus_path."""
    results: list[tuple[Path, dict[str, Any]]] = []
    for path in sorted(corpus_path.rglob("*.yml")):
        results.extend(_load_one(path))
    for path in sorted(corpus_path.rglob("*.yaml")):
        results.extend(_load_one(path))
    return results


def _load_one(path: Path) -> list[tuple[Path, dict[str, Any]]]:
    try:
        doc = yaml.safe_load(path.read_text(encoding="utf-8"))
    except (yaml.YAMLError, OSError):
        return []
    if isinstance(doc, dict) and "title" in doc:
        return [(path, doc)]
    return []


def dedupe_against_corpus(
    yaml_text: str,
    corpus_path: str,
    threshold: float = _DEFAULT_THRESHOLD,
    embedder: Embedder | None = None,
    top_k: int = _TOP_K,
) -> DedupeReport | ServerError:
    """Find rules in `corpus_path` that resemble the candidate.

    Returns a DedupeReport. The `is_duplicate` flag is True iff any matched
    rule scores ≥ threshold.
    """
    if not yaml_text or not yaml_text.strip():
        return ServerError(error="empty_input", detail="yaml_text is empty.")

    try:
        candidate = yaml.safe_load(yaml_text)
    except yaml.YAMLError as exc:
        return ServerError(error="invalid_yaml", detail=str(exc))
    if not isinstance(candidate, dict):
        return ServerError(error="invalid_structure", detail="Rule must be a YAML mapping.")

    corpus_root = Path(corpus_path)
    if not corpus_root.exists():
        return ServerError(
            error="corpus_not_found",
            detail=f"Corpus path does not exist: {corpus_path}",
        )

    embedder = embedder or make_embedder()
    candidate_tokens = _flatten_detection(candidate.get("detection") or {})
    candidate_vec = embedder.embed(_rule_text_for_embedding(candidate))

    matches: list[DedupeMatch] = []
    for path, doc in _iter_corpus(corpus_root):
        # Skip self if the corpus rule has the same id.
        if doc.get("id") and doc.get("id") == candidate.get("id"):
            continue
        other_tokens = _flatten_detection(doc.get("detection") or {})
        ast = _ast_jaccard(candidate_tokens, other_tokens)
        emb = cosine(candidate_vec, embedder.embed(_rule_text_for_embedding(doc)))
        score = max(ast, emb)
        if score <= 0.0:
            continue
        matches.append(
            DedupeMatch(
                rule_id=str(doc.get("id") or ""),
                rule_path=str(path),
                title=str(doc.get("title") or path.name),
                ast_overlap=ast,
                embedding_similarity=emb,
                score=score,
            )
        )

    matches.sort(key=lambda m: m.score, reverse=True)
    top = matches[:top_k]
    max_score = top[0].score if top else 0.0

    return DedupeReport(
        corpus_path=str(corpus_root),
        corpus_size=sum(1 for _ in corpus_root.rglob("*.y*ml")),
        threshold=threshold,
        embedder=embedder.name,
        max_score=max_score,
        is_duplicate=max_score >= threshold,
        matches=top,
    )
