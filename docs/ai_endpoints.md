# AI Endpoint Examples

Authenticate and prepare headers:

```bash
TOKEN=$(curl -s -X POST http://localhost:8000/api/v1/auth/token -d "username=analyst&password=analystpass" | jq -r .access_token)
HDR=(-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json")
```

## Rule generation
```bash
curl -s -X POST "${HDR[@]}" http://localhost:8000/api/v1/ai/rules/generate -d '{
  "signals": {
    "logs_example": [{"process.command_line":"powershell -EncodedCommand AA=="}],
    "techniques": ["T1059.001"],
    "platform":"windows","siem":"elastic","style":"sigma"
  },
  "constraints": {"must_explain": true, "fields_required": ["host.name","process.command_line"]}
}' | jq
```

## Attack generation (safe)
```bash
curl -s -X POST "${HDR[@]}" http://localhost:8000/api/v1/ai/attacks/generate -d '{
  "goals": ["credential access discovery without dumping"],
  "techniques": ["T1003"],
  "environment": {"os":"windows","priv":"user"},
  "style":"powershell",
  "safety":{"no-real-c2":true}
}' | jq
```

## Infra generation
```bash
curl -s -X POST "${HDR[@]}" http://localhost:8000/api/v1/ai/infra/generate -d '{
  "topology":{"hosts":3,"roles":["es","kibana","generator"]},
  "constraints":{"provisioner":"docker-compose"},
  "telemetry":{"elastic":true,"sysmon":true}
}' | jq
```
