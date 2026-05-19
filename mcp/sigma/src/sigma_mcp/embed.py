"""Pluggable text embedder for the Sigma dedupe path.

Two implementations:

- `HashEmbedder` — deterministic, dependency-free fallback used in tests and
  when the heavyweight model is not available. Produces a fixed-dimension
  vector from token n-grams. Good enough to separate clearly-different rules
  but not as semantically aware as a transformer.
- `SentenceTransformersEmbedder` — wraps `sentence-transformers` with
  `all-MiniLM-L6-v2`, as specified in BUILD_BRIEF.md §Phase 1. Lazily imported
  so the package can run without torch installed.

Pick at runtime via `make_embedder()`; can be overridden by tests via
constructor injection.
"""

from __future__ import annotations

import hashlib
import math
from dataclasses import dataclass
from itertools import pairwise
from typing import Protocol


class Embedder(Protocol):
    """Anything that maps a string to a vector and exposes its identity."""

    @property
    def name(self) -> str: ...

    def embed(self, text: str) -> list[float]: ...


def cosine(a: list[float], b: list[float]) -> float:
    """Cosine similarity, clamped to [0, 1]. Length mismatch returns 0.0."""
    if not a or not b or len(a) != len(b):
        return 0.0
    dot = 0.0
    na = 0.0
    nb = 0.0
    for x, y in zip(a, b, strict=False):
        dot += x * y
        na += x * x
        nb += y * y
    if na == 0.0 or nb == 0.0:
        return 0.0
    sim = dot / (math.sqrt(na) * math.sqrt(nb))
    # Signed-hash vectors can yield a negative cosine for anti-correlated
    # rules; clamp to [0, 1] since dedupe treats anti-correlation as "not
    # similar" rather than as a meaningful signal.
    return max(0.0, min(1.0, sim))


# ---------------------------------------------------------------------------
# Hash embedder
# ---------------------------------------------------------------------------


@dataclass(frozen=True, slots=True)
class HashEmbedder:
    """Hashing-trick embedder over word-level 1- and 2-grams.

    Deterministic across runs and Python versions (uses hashlib, not the
    built-in `hash()`).
    """

    dim: int = 256

    @property
    def name(self) -> str:
        return f"hash-{self.dim}"

    @staticmethod
    def _tokens(text: str) -> list[str]:
        # Simple normalisation: lowercase, split on non-alnum.
        out: list[str] = []
        buf: list[str] = []
        for ch in text.lower():
            if ch.isalnum() or ch == "_":
                buf.append(ch)
            elif buf:
                out.append("".join(buf))
                buf.clear()
        if buf:
            out.append("".join(buf))
        return out

    def embed(self, text: str) -> list[float]:
        vec = [0.0] * self.dim
        tokens = self._tokens(text)
        if not tokens:
            return vec
        for token in tokens:
            self._add(vec, token)
        for prev, cur in pairwise(tokens):
            self._add(vec, f"{prev}{cur}")
        # L2 normalise so cosine = dot for downstream callers.
        norm = math.sqrt(sum(v * v for v in vec))
        if norm > 0:
            vec = [v / norm for v in vec]
        return vec

    def _add(self, vec: list[float], token: str) -> None:
        # Signed hashing trick: the sign bit halves systematic collision bias.
        h = hashlib.blake2s(token.encode("utf-8"), digest_size=8).digest()
        idx = int.from_bytes(h[:4], "big") % self.dim
        sign = 1.0 if (h[4] & 1) else -1.0
        vec[idx] += sign


# ---------------------------------------------------------------------------
# Sentence-transformers embedder
# ---------------------------------------------------------------------------


class SentenceTransformersEmbedder:
    """Wraps `sentence-transformers` MiniLM (all-MiniLM-L6-v2)."""

    MODEL_NAME = "sentence-transformers/all-MiniLM-L6-v2"

    def __init__(self) -> None:
        # Lazy import keeps torch/transformers out of the import graph when
        # the embeddings extra is not installed. The PLC0415 noqa is intentional.
        from sentence_transformers import SentenceTransformer  # noqa: PLC0415

        self._model = SentenceTransformer(self.MODEL_NAME)

    @property
    def name(self) -> str:
        return self.MODEL_NAME

    def embed(self, text: str) -> list[float]:
        vec = self._model.encode([text], normalize_embeddings=True)[0]
        return [float(x) for x in vec]


def make_embedder(prefer_transformers: bool = True) -> Embedder:
    """Best-effort embedder factory.

    When `prefer_transformers` is True we try to load the MiniLM model; on
    failure (missing torch, no network for the first download, etc.) we fall
    back to the deterministic hash embedder. The chosen embedder identifies
    itself via `.name`, which the DedupeReport surfaces to the operator.
    """
    if prefer_transformers:
        try:
            return SentenceTransformersEmbedder()
        except (ImportError, RuntimeError, OSError):
            pass
    return HashEmbedder()
