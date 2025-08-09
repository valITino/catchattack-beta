from typing import get_args

from .compile import compile_sigma_from_draft
from .models import RuleDraft, Operator


def compile_rule(draft: RuleDraft) -> str:
    """Compile a RuleDraft into Sigma YAML string."""
    if not draft.predicates:
        raise ValueError("predicates[] required")
    return compile_sigma_from_draft(draft)


def operator_catalog() -> list[str]:
    return list(get_args(Operator))
