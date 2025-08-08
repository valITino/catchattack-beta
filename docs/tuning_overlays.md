# Tuning Overlays API

## Example usage (curl)

Create a base rule (from earlier chunks), then:

```
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/token -d "username=analyst&password=analystpass" | jq -r .access_token)
HDR="-H Authorization: Bearer $TOKEN"

# List existing overlays
curl -s $HDR "http://localhost:8000/api/v1/rules/$RULE_ID/tuning" | jq

# Add an overlay to exclude a noisy host and adjust condition
curl -s -X POST $HDR -H "Content-Type: application/json" \
  "http://localhost:8000/api/v1/rules/$RULE_ID/tuning" \
  -d '{
    "owner": "secops",
    "notes": "Exclude scanner hosts and add condition",
    "overlays": [
      {"op":"add","path":"/detection/fp/host.name|endswith","value":".scanner.lan"},
      {"op":"add","path":"/detection/condition","value":"sel and not fp"}
    ]
  }' | jq

# Compile effective Sigma for Elastic with all overlays applied
curl -s -X POST $HDR "http://localhost:8000/api/v1/rules/$RULE_ID/effective?target=elastic" | jq

# Compile effective Sigma for Sentinel using only a specific customization
curl -s -X POST $HDR "http://localhost:8000/api/v1/rules/$RULE_ID/effective?target=sentinel&customization_id=$CUSTOM_ID" | jq
```

### Notes on patch paths

- Paths address the YAML-as-JSON tree (e.g., `/detection/sel/process.command_line|contains`).
- You can add new selections (e.g., `/detection/fp/...`) and then change condition to `sel and not fp`.
- To remove a noisy field:
  ```json
  {"op":"remove","path":"/detection/sel/some.field|contains"}
  ```
