from __future__ import annotations

import logging


def push_rule(rule_yaml: str, target_url: str, token: str) -> bool:
    logging.info("Pushing rule to EDR at %s", target_url)
    # TODO: implement real API call
    return True
