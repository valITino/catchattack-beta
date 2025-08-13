from typing import List, Optional, Dict, Any

# The Elasticsearch client is optional.  Import errors are swallowed so that
# the module can still be imported on systems without the ``elasticsearch``
# package.  When unavailable, ``Elasticsearch`` will be set to ``None``
# and attempts to use this connector should raise a helpful error at
# runtime.
try:
    from elasticsearch import Elasticsearch  # type: ignore[import]
except Exception:
    Elasticsearch = None  # type: ignore[assignment]

from .base import DeployConnector, DeployResult

INDEX = ".catchattack-rules"   # local index to store KQL snippets as "deployed object" for demo


class ElasticConnector(DeployConnector):
    target_name = "elastic"

    def __init__(self, es: "Elasticsearch"):
        """Create a connector using an Elasticsearch client.

        If the ``elasticsearch`` library is not installed, instantiating
        ``ElasticConnector`` will raise a ``RuntimeError`` to indicate that
        deployments to Elastic are not possible in this environment.
        """
        if Elasticsearch is None:
            raise RuntimeError(
                "Elasticsearch client library is not available; install the 'elasticsearch' package to use Elastic deployment."
            )
        self.es = es
        # Ensure store index
        if not self.es.indices.exists(index=INDEX):
            self.es.indices.create(index=INDEX, mappings={"properties":{
                "name":{"type":"keyword"},
                "kql":{"type":"text"},
                "version":{"type":"integer"}
            }})

    def _get_existing(self, name: str) -> Optional[Dict[str,Any]]:
        resp = self.es.search(index=INDEX, query={"term":{"name":name}}, size=1)
        hits = resp.get("hits",{}).get("hits",[])
        return hits[0] if hits else None

    def dry_run(self, rule_name: str, queries: List[str]) -> DeployResult:
        # Try KQL against _search? For MVP, just validate index exists and query is non-empty.
        if not queries:
            return DeployResult(ok=False, status="error", error="No queries to deploy")
        return DeployResult(ok=True, status="success", extra={"queries":queries})

    def upsert_rule(self, rule_name: str, queries: List[str]) -> DeployResult:
        if not queries:
            return DeployResult(ok=False, status="error", error="No queries to deploy")
        existing = self._get_existing(rule_name)
        prev_ref = None
        next_version = 1
        if existing:
            prev_ref = existing["_id"] + f":v{existing['_source'].get('version',1)}"
            next_version = existing["_source"].get("version",1) + 1
        doc = {"name": rule_name, "kql": "\nOR\n".join(queries), "version": next_version}
        res = self.es.index(index=INDEX, id=existing["_id"] if existing else None, document=doc, refresh=True)
        target_ref = res["_id"] + f":v{next_version}"
        return DeployResult(ok=True, status="success", target_ref=target_ref, prev_ref=prev_ref)

    def rollback(self, target_ref: str, prev_ref: Optional[str]) -> DeployResult:
        # For demo rollback: if we have prev_ref with an ID, we decrement version content
        # by re-indexing previous source (we don't have it here).
        # Simpler demo: delete current doc id, which forces re-create later.
        try:
            doc_id = target_ref.split(":")[0]
            self.es.delete(index=INDEX, id=doc_id, ignore=[404], refresh=True)
            return DeployResult(ok=True, status="rolled_back", target_ref=target_ref, prev_ref=prev_ref)
        except Exception as e:
            return DeployResult(ok=False, status="error", error=str(e))
