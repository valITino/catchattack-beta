from .compile import compile_sigma_from_draft
from .models import RuleDraft
from .catalog import operator_catalog


def compile_rule(draft: RuleDraft) -> str:
    """Compile a RuleDraft into Sigma YAML string."""
    if not draft.predicates:
        raise ValueError("predicates[] required")
    return compile_sigma_from_draft(draft)
