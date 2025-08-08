from typing import List
from .base import DeployConnector, DeployResult


class SplunkConnector(DeployConnector):
    target_name = "splunk"

    def __init__(self):
        pass

    def dry_run(self, rule_name: str, queries: List[str]) -> DeployResult:
        return DeployResult(ok=True, status="success", extra={"queries":queries, "note":"stub"})

    def upsert_rule(self, rule_name: str, queries: List[str]) -> DeployResult:
        # pretend to create saved search and return fake id
        return DeployResult(ok=True, status="success", target_ref=f"splunk:savedsearch:{rule_name}:v1")

    def rollback(self, target_ref: str, prev_ref: str | None) -> DeployResult:
        return DeployResult(ok=True, status="rolled_back", target_ref=target_ref, prev_ref=prev_ref)
