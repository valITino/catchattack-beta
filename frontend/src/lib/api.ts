export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";
export async function ping() {
  const r = await fetch(`${API_BASE}/api/v1/healthz`);
  return r.json();
}

export async function login(username: string, password: string) {
  const form = new URLSearchParams();
  form.set("username", username);
  form.set("password", password);
  const r = await fetch(`${API_BASE}/api/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  if (!r.ok) throw new Error("login failed");
  return r.json();
}
