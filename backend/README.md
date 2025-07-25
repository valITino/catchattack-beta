# CatchAttack Backend

This backend is built with **FastAPI** and provides REST APIs for the CatchAttack platform. It exposes endpoints for adversary emulation, MITRE ATT&CK data retrieval, Sigma rule management, SIEM deployment stubs, and YAML generation for virtual machines.

## Requirements
- Python 3.11+
- The packages listed in `requirements.txt`

Install dependencies with:
```bash
pip install -r requirements.txt
```

### Environment Variables

The emulator service requires the following variables:

```
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=<your-key>
```

Add these variables to a `.env` file. An example template is provided in
`.env.example`.

## Running the Server
```bash
uvicorn backend.main:app --reload
```
Visit `http://localhost:8000/docs` for interactive API documentation.

## Directory Overview
```
backend/
├─ main.py           # FastAPI application
├─ database.py       # Database setup using SQLAlchemy
├─ schemas.py        # Pydantic models
├─ services/         # Service modules
│  ├─ __init__.py
│  ├─ mitre.py       # MITRE ATT&CK/TAXII integration
│  ├─ emulator.py    # Emulation stubs
│  ├─ sigma.py       # Sigma rule stubs
│  └─ yaml_generator.py # VM YAML generation
└─ requirements.txt  # Python dependencies
```

## VM Requirements
To use the `/vm/start` endpoint you need [Vagrant](https://www.vagrantup.com/) and [VirtualBox](https://www.virtualbox.org/) installed.

### Installation
**Windows**
1. Download and install [VirtualBox](https://www.virtualbox.org/wiki/Downloads).
2. Download and install [Vagrant](https://developer.hashicorp.com/vagrant/installers).

**macOS**
1. `brew install --cask virtualbox`
2. `brew install --cask vagrant`

**Linux**
```bash
sudo apt-get install virtualbox vagrant
```

## Using `/vm/start`
Send a POST request with the VM configuration:
```bash
curl -X POST http://localhost:8000/vm/start \
  -H 'Content-Type: application/json' \
  -d '{"image":"ubuntu/bionic64","version":"latest","cpu":1,"ram":2048}'
```
The response includes a `console_cmd` field to SSH into the VM if it started successfully.

## Error Format
All unhandled errors return JSON like:
```json
{"error": "internal_server_error", "id": "<uuid>"}
```
