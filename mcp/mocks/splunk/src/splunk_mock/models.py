"""Pydantic models for the mock Splunk MCP surface.

Field shapes mirror Splunk REST API responses where applicable so a future
flip from mock to real (CiscoDevNet/Splunk-MCP-Server-official) doesn't
require Conductor changes.

References:
- /services/search/jobs:
  https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTsearch#search.2Fjobs
- /servicesNS/{user}/{app}/saved/searches:
  https://docs.splunk.com/Documentation/Splunk/latest/RESTREF/RESTknowledge#saved.2Fsearches
"""

from __future__ import annotations

from pydantic import BaseModel, ConfigDict, Field


class SearchSample(BaseModel):
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    # Aliased to `_time` to match Splunk's REST response shape; pydantic
    # forbids attribute names with leading underscores.
    time: str = Field(alias="_time", description="ISO8601 timestamp.")
    host: str
    user: str | None = None
    source: str
    sourcetype: str
    raw: str = Field(description="Raw event text (truncated to 500 chars).")


class SearchSummary(BaseModel):
    """Aggregated rollup, not the firehose.

    The brief explicitly forbids returning the raw stream — LLMs work on the
    summary, then drill down via subsequent searches if needed.
    """

    model_config = ConfigDict(extra="forbid")

    spl: str
    earliest: str
    latest: str
    count: int
    top_hosts: list[tuple[str, int]] = Field(default_factory=list)
    top_users: list[tuple[str, int]] = Field(default_factory=list)
    top_sources: list[tuple[str, int]] = Field(default_factory=list)
    samples: list[SearchSample] = Field(
        default_factory=list,
        description="Up to 10 sample events. Sampled, not the firehose.",
    )
    truncated: bool = Field(description="True iff count > len(samples).")


class SavedSearch(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str
    app: str
    owner: str
    search: str = Field(description="The SPL string.")
    schedule: str | None = Field(default=None, description="cron expression, e.g. '*/15 * * * *'")
    index_target: str | None = None
    disabled: bool = False


class SavedSearchList(BaseModel):
    model_config = ConfigDict(extra="forbid")

    app: str | None
    items: list[SavedSearch]


class DeployResult(BaseModel):
    """Result of a `deploy_rule` call.

    dry_run=true returns the rendered savedsearch.conf stanza without posting.
    dry_run=false (only allowed when the proxy supplies the approval token AND
    the index_target is in the lab allowlist) posts to the mock store and
    echoes back the persisted SavedSearch.
    """

    model_config = ConfigDict(extra="forbid")

    name: str
    dry_run: bool
    rendered_stanza: str = Field(description="Contents that would land in savedsearch.conf.")
    deployed: bool
    saved_search: SavedSearch | None = None


class FPBucket(BaseModel):
    model_config = ConfigDict(extra="forbid")

    date: str = Field(description="ISO date, e.g. '2026-05-10'.")
    hits: int


class FPReport(BaseModel):
    """Estimate of false-positive volume.

    Computed from the synthetic historical event store: count rows that match
    the SPL over the last `lookback_days` days.
    """

    model_config = ConfigDict(extra="forbid")

    spl: str
    lookback_days: int
    total_hits: int
    hits_per_day: list[FPBucket]
    unique_hosts: int
    p95_hits_per_day: int
    verdict: str = Field(description="'low' (< 5/day), 'medium' (< 50/day), 'high' (>= 50/day).")
