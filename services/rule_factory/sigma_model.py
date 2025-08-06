from __future__ import annotations

from typing import Tuple


def sigma_from_logs(logs: str) -> Tuple[str, float]:
    """Generate Sigma rule from logs.

    TODO: replace with LLM inference using ctransformers or another library.
    """
    dummy_yaml = "title: Dummy Sigma Rule\ndescription: TODO"  # minimal placeholder
    return dummy_yaml, 0.5
