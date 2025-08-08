from dataclasses import dataclass
from typing import Optional, Dict, Any, List


@dataclass
class DeployResult:
    ok: bool
    target_ref: Optional[str] = None  # e.g., saved object ID/version
    prev_ref: Optional[str] = None
    status: str = "success"  # success|error
    error: Optional[str] = None
    extra: Optional[Dict[str, Any]] = None


class DeployConnector:
    target_name: str

    def dry_run(self, rule_name: str, queries: List[str]) -> DeployResult:
        raise NotImplementedError

    def upsert_rule(self, rule_name: str, queries: List[str]) -> DeployResult:
        """Create or update detection/search in target; return reference and previous version if any."""
        raise NotImplementedError

    def rollback(self, target_ref: str, prev_ref: Optional[str]) -> DeployResult:
        """Rollback if we have previous version info; otherwise no-op."""
        raise NotImplementedError
