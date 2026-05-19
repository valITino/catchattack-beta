
# CatchAttack-Beta Backend Architecture

This document provides an overview of the backend architecture for the CatchAttack-Beta platform.

## Overview

CatchAttack-Beta is a Detection as Code platform that automates adversary emulation, generates Sigma rules, and deploys them to various SIEM platforms. The backend is implemented using Supabase for authentication, database, and serverless functions.

## Core Components

### 1. Database Schema

The database consists of the following tables:

- **tenants**: Stores information about each tenant (organization)
  - id, name, description, createdAt

- **users_tenants**: Links users to tenants with specific roles
  - userId, tenantId, role (admin, analyst, viewer)

- **emulation_results**: Stores the results of adversary emulations
  - id, status, techniques, timestamp, logs, telemetry, tenant_id

- **sigma_rules**: Stores generated Sigma rules
  - id, title, description, status, author, techniqueId, rule, dateCreated, dateUpdated, deployedTo, severity, source, isDuplicate, duplicateOf, tenant_id

- **siem_platforms**: Stores information about SIEM platforms
  - id, name, description, connected, lastSync, rulesDeployed, status, credentials, tenant_id

- **deploy_results**: Stores the results of rule deployments
  - success, platformId, deployedRules, timestamp, tenant_id

- **schedules**: Stores scheduled emulation tasks
  - id, name, description, emulation, status, lastRun, nextRun, createdAt, updatedAt, userId, tenant_id

### 2. Edge Functions (Serverless API)

The backend API is implemented using Supabase Edge Functions:

- **emulate**: Triggers adversary emulation
  - Input: EmulationRequest, tenantId
  - Output: EmulationResult

- **create-rule**: Creates or updates Sigma rules
  - Input: Partial<SigmaRule>, tenant_id
  - Output: SigmaRule

- **deploy**: Deploys Sigma rules to SIEM platforms
  - Input: DeployRequest, tenantId
  - Output: DeployResult

- **status**: Gets system status
  - Input: tenantId
  - Output: Status summary

### 3. Authentication & Authorization

Supabase Auth is used for user authentication. Access to resources is controlled by:
- Row-level security (RLS) policies based on user and tenant
- Role-based access control (admin, analyst, viewer)

### 4. Multi-tenancy

The platform supports multi-tenancy through:
- Tenant-specific data isolation in the database
- Tenant selection in the UI
- Tenant context for all API calls

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| /emulate | POST | Trigger adversary emulation |
| /rules | GET | Fetch Sigma rules |
| /rules | POST | Create Sigma rules |
| /deploy | POST | Deploy rules to SIEM platforms |
| /schedule | POST | Create or update schedule |
| /schedules | GET | List schedules |
| /status | GET | Get system status |

## Database Migration

Initial database tables can be created using the Supabase web interface or through SQL migrations:

```sql
-- Example for creating the tenants table
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Example row-level security policy
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_policy ON tenants 
  USING (id IN (
    SELECT tenant_id FROM users_tenants WHERE user_id = auth.uid()
  ));
```

## Development and Deployment

### Local Development

1. Use the provided mock functions for development
2. Connect to Supabase for full backend functionality

### Production Deployment

1. Deploy Edge Functions to Supabase
2. Set up database tables and RLS policies
3. Configure authentication settings

## Security Considerations

1. All sensitive data should be encrypted
2. API keys for SIEM platforms should be stored securely in Supabase Vault
3. Row-level security ensures proper data isolation between tenants
4. API endpoints should validate all inputs
5. Rate limiting should be implemented to prevent abuse

