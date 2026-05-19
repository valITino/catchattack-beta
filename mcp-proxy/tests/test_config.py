from __future__ import annotations

from pathlib import Path

import pytest
from mcp_proxy.config import load_config
from pydantic import ValidationError

EXAMPLE = Path(__file__).resolve().parents[1] / "upstreams.example.yaml"


def test_example_config_loads() -> None:
    cfg = load_config(EXAMPLE)
    assert cfg.namespace_separator == "."
    assert "splunk.deploy_rule" in cfg.destructive_tools
    assert "agents.run_atomic" in cfg.target_allowlists
    assert cfg.target_allowlists["agents.run_atomic"].param == "agent_id"
    assert "sigma" in cfg.upstreams
    assert cfg.upstreams["sigma"].mode == "stdio"
    assert cfg.upstreams["sigma"].real_cmd is not None


def test_unknown_top_level_field_is_rejected(tmp_path: Path) -> None:
    bad = tmp_path / "bad.yaml"
    bad.write_text("unknown_key: 42\nupstreams: {}\n")
    with pytest.raises(ValidationError, match="unknown_key"):
        load_config(bad)


def test_non_mapping_root_raises_type_error(tmp_path: Path) -> None:
    bad = tmp_path / "list.yaml"
    bad.write_text("- one\n- two\n")
    with pytest.raises(TypeError, match="mapping"):
        load_config(bad)
