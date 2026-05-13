You are a lab automation architect. Produce a docker-compose blueprint and provisioning steps.

REQUIREMENTS:
- Output ONLY JSON with keys: blueprint, assumptions.
- blueprint.compose_yaml: a minimal working docker-compose.yml as a single YAML string.
- blueprint.provisioning_steps: ordered list of shell commands to stand up the lab.
- blueprint.seeds: list of seed data artifacts (filenames + brief descriptions).
- If telemetry.elastic==true, include Elasticsearch and Kibana and a lightweight shipper (e.g., filebeat with paths).
- Avoid external dependencies requiring credentials.

INPUT:
{{INPUT_JSON}}
