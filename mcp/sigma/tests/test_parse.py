from __future__ import annotations

from sigma_mcp.models import ParsedRule, ServerError
from sigma_mcp.parse import parse_sigma


def test_parses_basic_powershell_rule(psh_encoded: str) -> None:
    result = parse_sigma(psh_encoded)
    assert isinstance(result, ParsedRule)
    assert result.title == "Suspicious PowerShell EncodedCommand Execution"
    assert result.id == "7c5a6f04-2b27-4f0c-9d7a-7a8f3f6e8b21"
    assert result.level == "high"
    assert result.status == "experimental"
    assert result.logsource.product == "windows"
    assert result.logsource.category == "process_creation"


def test_extracts_attack_techniques_uppercased_and_deduped(psh_encoded: str) -> None:
    result = parse_sigma(psh_encoded)
    assert isinstance(result, ParsedRule)
    assert result.attack_techniques == ["T1059.001"]
    assert "attack.execution" in result.tags
    assert "attack.t1059.001" in result.tags


def test_detection_keys_and_condition_returned(psh_encoded: str) -> None:
    result = parse_sigma(psh_encoded)
    assert isinstance(result, ParsedRule)
    assert "selection_image" in result.detection_keys
    assert "selection_args" in result.detection_keys
    assert result.condition == "selection_image and selection_args"


def test_malformed_yaml_returns_server_error_not_exception(malformed_yaml: str) -> None:
    result = parse_sigma(malformed_yaml)
    assert isinstance(result, ServerError)
    assert result.error == "invalid_yaml"


def test_missing_detection_block_returns_server_error(missing_detection: str) -> None:
    result = parse_sigma(missing_detection)
    assert isinstance(result, ServerError)
    assert result.error == "missing_detection"


def test_empty_input_returns_server_error() -> None:
    result = parse_sigma("   \n\n")
    assert isinstance(result, ServerError)
    assert result.error == "empty_input"
