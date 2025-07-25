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
