from pathlib import Path
from typing import Any, Dict
import yaml


def generate_vm_yaml(config: Dict[str, Any], path: Path) -> None:
    """Generate a YAML file with the VM configuration."""
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        yaml.safe_dump(config, f, sort_keys=False)
