from typing import List
from .base import DeployConnector, DeployResult


class SentinelConnector(DeployConnector):
    target_name = "sentinel"

    def __init__(self):
        pass

    def dry_run(self, rule_name: str, queries: List[str]) -> DeployResult:
        return DeployResult(ok=True, status="success", extra={"queries":queries, "note":"stub"})

    def upsert_rule(self, rule_name: str, queries: List[str]) -> DeployResult:
        return DeployResult(ok=True, status="success", target_ref=f"sentinel:analyticsRules/{rule_name}:v1")

    def rollback(self, target_ref: str, prev_ref: str | None) -> DeployResult:
        return DeployResult(ok=True, status="rolled_back", target_ref=target_ref, prev_ref=prev_ref)
