"""Inline Sigma rule fixtures used across tests."""

from __future__ import annotations

import pytest

PSH_ENCODED = """\
title: Suspicious PowerShell EncodedCommand Execution
id: 7c5a6f04-2b27-4f0c-9d7a-7a8f3f6e8b21
status: experimental
description: Detects PowerShell -EncodedCommand abuse.
tags:
  - attack.execution
  - attack.t1059.001
logsource:
  category: process_creation
  product: windows
detection:
  selection_image:
    Image|endswith:
      - '\\\\powershell.exe'
      - '\\\\pwsh.exe'
  selection_args:
    CommandLine|contains:
      - ' -EncodedCommand '
      - ' -enc '
  condition: selection_image and selection_args
falsepositives:
  - SCCM scripts.
level: high
"""

PSH_ENCODED_NEAR_DUPE = """\
title: PowerShell Encoded Command Use
id: 9b1f2c98-1111-4f0c-9d7a-aaaaaaaaaaaa
status: experimental
description: PowerShell with encoded args.
tags:
  - attack.execution
  - attack.t1059.001
logsource:
  category: process_creation
  product: windows
detection:
  proc:
    Image|endswith:
      - '\\\\powershell.exe'
      - '\\\\pwsh.exe'
  flags:
    CommandLine|contains:
      - ' -EncodedCommand '
      - ' -enc '
  condition: proc and flags
level: high
"""

UNRELATED_RULE = """\
title: Linux Reverse Shell via Bash TCP
id: 6cccc111-0000-4f0c-9d7a-bbbbbbbbbbbb
status: experimental
description: Detects /dev/tcp socket usage from bash.
tags:
  - attack.execution
  - attack.t1059.004
logsource:
  category: process_creation
  product: linux
detection:
  bash:
    Image|endswith: '/bash'
    CommandLine|contains: '/dev/tcp/'
  condition: bash
level: high
"""

MALFORMED_YAML = """\
title: Broken
detection:
  selection
    foo: bar
  condition: selection
"""

MISSING_DETECTION = """\
title: No detection block here
id: 00000000-0000-0000-0000-000000000099
logsource:
  category: process_creation
  product: windows
"""

BAD_LEVEL = """\
title: Bad level
id: 00000000-0000-0000-0000-000000000100
logsource:
  category: process_creation
  product: windows
detection:
  selection:
    Image|endswith: '\\\\notepad.exe'
  condition: selection
level: super-duper-high
"""


@pytest.fixture
def psh_encoded() -> str:
    return PSH_ENCODED


@pytest.fixture
def psh_encoded_near_dupe() -> str:
    return PSH_ENCODED_NEAR_DUPE


@pytest.fixture
def unrelated_rule() -> str:
    return UNRELATED_RULE


@pytest.fixture
def malformed_yaml() -> str:
    return MALFORMED_YAML


@pytest.fixture
def missing_detection() -> str:
    return MISSING_DETECTION


@pytest.fixture
def bad_level_rule() -> str:
    return BAD_LEVEL
