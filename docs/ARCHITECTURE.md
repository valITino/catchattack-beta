# Architecture

## Control Plane
The control plane consists of several FastAPI and async services connected by
Kafka. `mgmt_api` provides the REST interface and database. `edge_agent`
collects asset data and publishes it to Kafka. `infra_builder` provisions lab
infrastructure from those events. `rt_script_gen` prepares Atomic Red Team
scripts, while `rule_factory` converts lab findings into draft Sigma rules.
`deployer` validates and pushes rules to external platforms. Kafka brokers all
messages between these services.

## Execution Plane
The execution plane represents the virtual lab created for each asset. A
monitoring agent runs inside the lab to capture findings and send them back over
Kafka.

## Kafka Topics
| Topic        | Producers                                      | Consumers        |
|--------------|-----------------------------------------------|------------------|
| `asset.events` | `edge_agent`                                  | `infra_builder`  |
| `lab.findings` | Monitoring agent in lab                      | `rule_factory`   |
| `rules.draft`  | `rule_factory`                               | `deployer`       |
| `audit.events` | `edge_agent`, `infra_builder`, `rt_script_gen`, `rule_factory`, `deployer` | `mgmt_api` |

## Integration Points and Configuration

| Component | Notes | Key Environment Variables |
|-----------|-------|--------------------------|
| **Edge Agent** | Periodic discovery task. Polls EDR/XDR (`EDR_API_URL`/`EDR_API_TOKEN`) or Nessus (`NESSUS_API_URL`/`NESSUS_API_TOKEN`) when configured; falls back to local discovery when `EDGE_SELF_DISCOVERY` is `true`. Interval controlled by `DISCOVERY_INTERVAL_SECONDS` and events tagged with `EDGE_TENANT_ID`. | `EDGE_SELF_DISCOVERY`, `DISCOVERY_INTERVAL_SECONDS`, `EDGE_TENANT_ID`, `EDR_API_URL`, `EDR_API_TOKEN`, `NESSUS_API_URL`, `NESSUS_API_TOKEN` |
| **Infra Builder** | Replace the sample Terraform with custom templates and install a monitoring agent within each VM. | – |
| **RT Script Generator / Rule Factory** | Connect these services to an LLM for real script and rule generation. | – |
| **Deployer** | Implement real API calls to your EDR/XDR and vulnerability scanners. Configure with `EDR_URL`, `EDR_TOKEN`, `NESSUS_URL`, `NESSUS_TOKEN`. | `EDR_URL`, `EDR_TOKEN`, `NESSUS_URL`, `NESSUS_TOKEN` |

## Production Considerations
Use a production-grade database such as Postgres instead of SQLite. Secure Kafka
with TLS/SASL and point `KAFKA_BOOTSTRAP` to your managed brokers.
