import subprocess
import tempfile
import os
import yaml
import shutil
import uuid
import logging
import json
import sys
from pathlib import Path
from typing import Dict, Any

DEFAULT_BOX = "ubuntu/bionic64"


def start_vm(config: Dict[str, Any]) -> Dict[str, str]:
    """Spin up a lightweight VM using HashiCorp Vagrant (pre-installed) or Docker."""
    vm_id = str(uuid.uuid4())[:8]
    workdir = Path(tempfile.gettempdir()) / f"catchattack_vm_{vm_id}"
    workdir.mkdir(exist_ok=True)
    vagrantfile = workdir / "Vagrantfile"

    try:
        vagrantfile.write_text(
            f'''
Vagrant.configure("2") do |config|
  config.vm.box = "{DEFAULT_BOX}"
  config.vm.hostname = "catchattack-{vm_id}"
  config.vm.provider "virtualbox" do |vb|
    vb.memory = {config.get("ram", 2048)}
    vb.cpus   = {config.get("cpu", 1)}
  end
end
'''
        )
        subprocess.check_call(["vagrant", "up"], cwd=workdir)
        return {
            "id": vm_id,
            "provider": "vagrant",
            "status": "running",
            "console_cmd": f"vagrant ssh --chdir {workdir}",
        }
    except Exception as exc:  # noqa: BLE001
        logging.exception("VM launch failed")
        return {"id": vm_id, "provider": "vagrant", "status": "error", "error": str(exc)}
