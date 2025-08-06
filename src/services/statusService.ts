// Fetches status metrics from the backend.  Uses API_CONFIG.baseUrl.
// Interfaces for the response
export interface AuditEvent {
  id: number;
  type: string;
  title: string;
  description: string;
  timestamp: string;
}
export interface StatusSummary {
  emulations: number;
  rules_generated: number;
  rules_deployed: number;
  anomalies_detected: number;
  last_5_events: AuditEvent[];
}

import { API_CONFIG } from '@/config/config';

export async function fetchStatus(): Promise<StatusSummary> {
  const base = API_CONFIG.baseUrl.replace(/\/$/, '');
  const res = await fetch(`${base}/status`);
  if (!res.ok) {
    throw new Error(`Status request failed: ${res.status}`);
  }
  return res.json();
}

export const statusService = { fetchStatus };
