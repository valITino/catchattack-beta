# ADR-0003: Pluggable embedder for Sigma dedupe

- **Status:** Accepted (Phase 1)
- **Date:** 2026-05-13

## Context

`BUILD_BRIEF.md` Phase 1 specifies `dedupe_against_corpus` should use
`sentence-transformers/all-MiniLM-L6-v2` for embedding similarity, combined
with AST overlap. MiniLM pulls in torch (~2 GB) and downloads its weights
(~90 MB) on first use — too heavy for fast unit tests and CI.

We also want the closed-loop workflow (Phase 4) to score similarity
deterministically in tests, regardless of network access.

## Decision

Introduce a `Embedder` Protocol with two implementations:

- `SentenceTransformersEmbedder` — the production default. Wraps MiniLM,
  lazy-imports `sentence_transformers` so the module loads without torch
  installed.
- `HashEmbedder` — a deterministic blake2s hashing-trick embedder over
  word 1- and 2-grams. Zero dependencies, ~50 LoC. Used as a fallback
  whenever transformers fail to import or load, and injected explicitly
  by tests for offline determinism.

`make_embedder()` chooses at runtime; `dedupe_against_corpus` exposes the
embedder as a parameter so tests and the Conductor can override. The chosen
embedder's identity (`name` property) is recorded in `DedupeReport.embedder`
so operators always know which signal produced the similarity score.

The combined similarity score is `max(AST overlap, embedding similarity)` —
per the brief's intent that structural OR semantic overlap is enough to
warrant flagging.

## Consequences

Positive:
- Tests run in <2 s on any machine; no network or torch required.
- The MiniLM dependency is opt-in via `--extra embeddings`. Reviewers and CI
  can validate logic without the heavyweight model.
- The DedupeReport explicitly names the embedder used, so a Conductor that
  is running offline (fallback) won't silently produce scores incomparable
  to MiniLM-based ones.

Negative:
- Two embedders means two similarity scales. We mitigate with the
  `embedder` field in the report; the Phase 4 Conductor uses a per-embedder
  threshold rather than a single fixed 0.85.
- A hash embedder is more sensitive to vocabulary than MiniLM. The
  threshold for `is_duplicate` may need to be tuned per embedder.

## Rejected alternatives

- *Always require sentence-transformers.* Inflates CI by ~5 minutes and
  ~2 GB; blocks tests on machines without GPU drivers or with no network.
- *Use TF-IDF instead of embeddings.* Departs from the brief's explicit
  MiniLM directive without adding capability; we keep both signals.
- *Mock the embedder in tests with `unittest.mock`.* Hides the data-flow
  and produces fake scores that don't reflect a real distance. The hash
  embedder is a real-but-cheap signal instead.
