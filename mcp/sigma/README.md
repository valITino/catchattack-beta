# mcp/sigma — Sigma operations MCP server

CatchAttack's in-house MCP server for parsing, linting, converting, and
de-duplicating [Sigma](https://github.com/SigmaHQ/sigma) detection rules.

This is the one MCP server **every** workflow touches, so its surface is kept
intentionally small: four tools, one resource, one prompt.

## Tools

| Tool | Purpose | Side effects |
|---|---|---|
| `parse_sigma(yaml_text)` | Parse a Sigma rule. Returns title, id, level, tags, ATT&CK techniques extracted from `attack.tNNNN[.NNN]` tags, logsource, detection keys, condition. | none |
| `lint_sigma(yaml_text)` | Schema validity (via pySigma) + style checks. Returns `LintReport` with `errors`/`warnings`/`info`. | none |
| `convert_sigma(yaml_text, target, pipeline?)` | Convert to a target query language. Targets: `splunk` (SPL), `sentinel` (KQL), `chronicle` (Google SecOps UDM-search), `elastic` (Lucene), `falcon` (CrowdStrike LogScale). | none |
| `dedupe_against_corpus(yaml_text, corpus_path?, threshold=0.85)` | Score candidate against existing rules under `corpus_path` (defaults to `$SIGMA_MCP_CORPUS_PATH` or `./detections`). Returns top-K matches with AST-overlap and embedding-similarity. | reads filesystem only |

All tool inputs are strict (`additionalProperties: false`). All tools return
JSON; validation failures return a `ServerError` dict rather than raising.

## Resources

- `sigma://corpus/{rule_id}` — fetch a rule from the local corpus by its
  Sigma UUID. Read-only.

## Prompts

- `sigma_review(yaml_text)` — opens a structured review of the candidate rule.

## Transports

```bash
# stdio (Claude Desktop & MCP-Inspector)
sigma-mcp

# streamable-http (proxy / web hosts)
sigma-mcp --transport http --port 7110
```

## Run

From the repo root:

```bash
uv sync --all-packages --extra dev
uv run sigma-mcp --version
```

Tests:

```bash
cd mcp/sigma
uv run pytest -q
```

## Claude Desktop config

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`
(macOS) / `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

```json
{
  "mcpServers": {
    "catchattack-sigma": {
      "command": "uv",
      "args": [
        "--directory",
        "/absolute/path/to/catchattack-beta",
        "run",
        "sigma-mcp"
      ],
      "env": {
        "SIGMA_MCP_CORPUS_PATH": "/absolute/path/to/catchattack-beta/detections"
      }
    }
  }
}
```

Then in Claude Desktop ask something like:

> Convert the Sigma rule at `sigma://corpus/7c5a6f04-2b27-4f0c-9d7a-7a8f3f6e8b21`
> to Splunk SPL, then to Sentinel KQL. Show me the pipeline trace for each.

## Embedder

`dedupe_against_corpus` uses a pluggable text embedder:

- **Default** (production): `sentence-transformers/all-MiniLM-L6-v2`.
  Install with `uv sync --all-packages --extra embeddings`. First run
  downloads ~90 MB to the local cache.
- **Fallback** (zero-dep): a deterministic blake2s hashing-trick embedder
  used automatically when transformers are unavailable. Good enough to
  separate clearly-different rules; less semantic than MiniLM. The chosen
  embedder identifies itself in `DedupeReport.embedder`.

Tests inject the hash embedder explicitly so they run offline.

## Files

```
mcp/sigma/
├── pyproject.toml
├── src/sigma_mcp/
│   ├── __init__.py
│   ├── server.py       # FastMCP wiring (tools, resource, prompt)
│   ├── parse.py        # parse_sigma
│   ├── lint.py         # lint_sigma
│   ├── convert.py      # convert_sigma (5 backends)
│   ├── dedupe.py       # dedupe_against_corpus
│   ├── embed.py        # Pluggable text embedder (HashEmbedder + MiniLM)
│   └── models.py       # Pydantic I/O models, strict schemas
└── tests/
    ├── conftest.py     # Inline rule fixtures
    ├── test_parse.py
    ├── test_lint.py
    ├── test_convert.py
    ├── test_dedupe.py
    ├── test_embed.py
    └── test_server.py  # End-to-end via fastmcp in-memory client
```
