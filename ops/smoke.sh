#!/usr/bin/env bash
set -euo pipefail
API=${API:-http://localhost:8000/api/v1}
tok(){ curl -s -X POST "$API/auth/token" -d "username=$1&password=${1}pass" | jq -r .access_token; }
T=$(tok analyst)
HDR=(-H "Authorization: Bearer $T" -H "Content-Type: application/json")
# health
curl -s "$API/healthz" | jq
# ai local
curl -s -X POST "${HDR[@]}" "$API/ai/rules/generate" -d '{"signals":{"logs_example":[{"process.command_line":"powershell -EncodedCommand AA=="}],"techniques":["T1059.001"]}}' | jq
echo "OK"
