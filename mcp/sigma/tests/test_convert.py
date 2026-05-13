from __future__ import annotations

import pytest
from sigma_mcp.convert import convert_sigma
from sigma_mcp.models import ConvertResult, ConvertTarget, ServerError


@pytest.mark.parametrize(
    "target",
    [
        ConvertTarget.SPLUNK,
        ConvertTarget.SENTINEL,
        ConvertTarget.CHRONICLE,
        ConvertTarget.ELASTIC,
        ConvertTarget.FALCON,
    ],
)
def test_convert_returns_non_empty_query_for_each_backend(
    psh_encoded: str, target: ConvertTarget
) -> None:
    result = convert_sigma(psh_encoded, target)
    assert isinstance(result, ConvertResult)
    assert result.queries, f"empty queries for {target.value}"
    assert all(isinstance(q, str) and q for q in result.queries)


def test_convert_splunk_includes_encoded_command_token(psh_encoded: str) -> None:
    result = convert_sigma(psh_encoded, ConvertTarget.SPLUNK)
    assert isinstance(result, ConvertResult)
    joined = " | ".join(result.queries).lower()
    assert "encodedcommand" in joined or "-enc" in joined


def test_convert_invalid_yaml_returns_server_error(malformed_yaml: str) -> None:
    result = convert_sigma(malformed_yaml, ConvertTarget.SPLUNK)
    assert isinstance(result, ServerError)
    assert result.error in {"invalid_yaml", "invalid_sigma"}


def test_convert_pipeline_trace_records_backend_name(psh_encoded: str) -> None:
    result = convert_sigma(psh_encoded, ConvertTarget.SENTINEL)
    assert isinstance(result, ConvertResult)
    assert any("KustoBackend" in step for step in result.pipeline_trace)
    assert result.backend == "KustoBackend"


def test_convert_empty_input_returns_server_error() -> None:
    result = convert_sigma("", ConvertTarget.SPLUNK)
    assert isinstance(result, ServerError)
    assert result.error == "empty_input"
