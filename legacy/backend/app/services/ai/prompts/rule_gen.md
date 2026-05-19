You are an expert detection engineer. Produce a Sigma v2 rule modeling the signals and constraints below.

REQUIREMENTS:
- Output ONLY JSON with keys: sigma_yaml, rationale, test_events.
- sigma_yaml MUST be valid YAML Sigma v2 with: title, id (uuid4), logsource, detection (selections + condition), fields, falsepositives, level.
- Prefer concise, broadly portable logic.
- Include 2-4 synthetic test_events (JSON) that would match the rule.

INPUT:
{{INPUT_JSON}}
