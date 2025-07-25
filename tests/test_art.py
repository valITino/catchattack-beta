import sys
from pathlib import Path
import requests_mock

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.services import art


def test_fetch_atomic_tests():
    yaml_data = """
attack_technique: T1234
atomic_tests:
- name: Example Test
  executor:
    name: sh
    command: echo hi
"""
    with requests_mock.Mocker() as m:
        m.get(
            "https://raw.githubusercontent.com/redcanaryco/atomic-red-team/master/atomics/T1234/T1234.yaml",
            text=yaml_data,
        )
        tests = art.get_atomic_tests("T1234")
    assert len(tests) == 1
    assert tests[0]["name"] == "Example Test"
