from typing import List, Dict, Any, Optional
from uuid import UUID
from datetime import datetime
from ruamel.yaml import YAML
import jsonpatch
import io

from sigma.parser.collection import SigmaCollectionParser
from sigma.backends.elasticsearch import ElasticsearchBackend
from sigma.backends.splunk import SplunkBackend
from sigma.backends.sentinel import SentinelBackend
from sigma.exceptions import SigmaError

yaml = YAML()
yaml.preserve_quotes = True
yaml.indent(mapping=2, sequence=2, offset=2)

def yaml_to_obj(yaml_text: str) -> Any:
    bio = io.StringIO(yaml_text)
    return yaml.load(bio)

def obj_to_yaml(obj: Any) -> str:
    bio = io.StringIO()
    yaml.dump(obj, bio)
    return bio.getvalue()

def apply_json_patches(base_obj: Any, patches: List[Dict[str, Any]]) -> Any:
    """
    Apply RFC6902 patches sequentially. Each patch is a list of ops or a dict with 'op'.
    Accept both: [ {op, path, value} ... ] or { "patch":[...] } in overlays (we normalize).
    """
    # Normalize to a single flat list of ops
    ops: List[Dict[str, Any]] = []
    for p in patches:
        if isinstance(p, dict) and "op" in p:
            ops.append(p)  # it's a single operation object
        elif isinstance(p, list):
            ops.extend(p)
        elif isinstance(p, dict) and "patch" in p and isinstance(p["patch"], list):
            ops.extend(p["patch"])
        else:
            raise ValueError("Overlay must be an RFC6902 operation or list of operations")
    # jsonpatch needs pure-JSON — ruamel nodes are fine, but convert via plain dict
    patched = jsonpatch.JsonPatch(ops).apply(base_obj, in_place=False)
    return patched

def compile_sigma(yaml_text: str, target: str) -> Dict[str, Any]:
    sc = SigmaCollectionParser(yaml_text).generate()
    if target == "elastic":
        backend = ElasticsearchBackend()
    elif target == "splunk":
        backend = SplunkBackend()
    elif target == "sentinel":
        backend = SentinelBackend()
    else:
        raise ValueError("Unsupported target")
    queries = backend.convert(sc)
    return {"queries": queries}

def effective_compile(base_yaml: str, overlays: List[Dict[str, Any]], target: str) -> Dict[str, Any]:
    base_obj = yaml_to_obj(base_yaml)
    if overlays:
        base_obj = apply_json_patches(base_obj, overlays)
    eff_yaml = obj_to_yaml(base_obj)
    compiled = compile_sigma(eff_yaml, target)
    return {"effective_yaml": eff_yaml, **compiled}
