export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
export async function ping() {
  const r = await fetch(`${API_BASE}/api/v1/healthz`);
  return r.json();
}
