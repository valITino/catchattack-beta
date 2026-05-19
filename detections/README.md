# detections/

Detection-as-code. One Sigma YAML per file. CODEOWNERS gates merges.

Layout (addendum §C):

```
detections/
├── _meta/coverage.json            # Auto-generated MITRE Navigator layer
├── enterprise/
│   ├── windows/
│   ├── linux/
│   └── macos/
└── cloud/
    ├── aws/
    └── azure/
```

## Rules

1. Every file is valid Sigma YAML, parseable by `mcp/sigma`'s `lint_sigma`.
2. The pre-commit hook calls `lint_sigma`; commits with lint errors are rejected.
3. CI runs `dedupe_against_corpus`; PRs with >0.85 similarity to an existing rule
   fail.
4. Conductor-opened PRs include: rule file, capture bundle reference,
   FP-estimate report, validation proof, ATT&CK Navigator layer delta.
5. Conductor-opened PRs cannot self-approve regardless of confidence —
   human merge mandatory.

Populated starting Phase 2.
