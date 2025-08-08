export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function login(username: string, password: string) {
  const form = new URLSearchParams();
  form.set("username", username);
  form.set("password", password);
  const res = await fetch(`${API_BASE}/api/v1/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: form,
  });
  return j<{ access_token: string; role: string }>(res);
}

export function withAuth(token: string) {
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
  return {
    listRules(technique?: string) {
      const url = new URL(`${API_BASE}/api/v1/rules`);
      if (technique) url.searchParams.set("technique", technique);
      return fetch(url.toString(), { headers }).then(j);
    },
    createRule(body: any) {
      return fetch(`${API_BASE}/api/v1/rules`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }).then(j);
    },
    lintRule(id: string) {
      return fetch(`${API_BASE}/api/v1/rules/${id}/lint`, {
        method: "POST",
        headers,
      }).then(j);
    },
    compileRule(id: string, target: string) {
      return fetch(`${API_BASE}/api/v1/rules/${id}/compile?target=${target}`, {
        method: "POST",
        headers,
      }).then(j);
    },
    listTuning(id: string) {
      return fetch(`${API_BASE}/api/v1/rules/${id}/tuning`, { headers }).then(j);
    },
    addTuning(id: string, body: any) {
      return fetch(`${API_BASE}/api/v1/rules/${id}/tuning`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }).then(j);
    },
    effective(id: string, target: string, customizationId?: string) {
      const url = new URL(`${API_BASE}/api/v1/rules/${id}/effective`);
      url.searchParams.set("target", target);
      if (customizationId) url.searchParams.set("customization_id", customizationId);
      return fetch(url.toString(), { method: "POST", headers }).then(j);
    },
    createRun(name: string, source: "local" | "atomic" | "caldera") {
      const form = new FormData();
      form.set("name", name);
      form.set("source", source);
      return fetch(`${API_BASE}/api/v1/runs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }).then(j);
    },
    startRun(rid: string) {
      return fetch(`${API_BASE}/api/v1/runs/${rid}/start`, {
        method: "POST",
        headers,
      }).then(j);
    },
    ingestRun(rid: string, file: File, autoIndex: boolean) {
      const form = new FormData();
      form.set("file", file);
      return fetch(`${API_BASE}/api/v1/runs/${rid}/ingest?auto_index=${autoIndex}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      }).then(j);
    },
    evaluateRun(rid: string, engine: "local" | "elastic") {
      return fetch(`${API_BASE}/api/v1/runs/${rid}/evaluate?engine=${engine}`, {
        method: "POST",
        headers,
      }).then(j);
    },
    getRun(rid: string) {
      return fetch(`${API_BASE}/api/v1/runs/${rid}`, { headers }).then(j);
    },
    getResults(rid: string) {
      return fetch(`${API_BASE}/api/v1/runs/${rid}/results`, { headers }).then(j);
    },
    coverage() {
      return fetch(`${API_BASE}/api/v1/coverage`, { headers }).then(j);
    },
    priorities(org?: string) {
      const url = new URL(`${API_BASE}/api/v1/priorities`);
      if (org) url.searchParams.set("organization", org);
      return fetch(url.toString(), { headers }).then(j);
    },
    deploy(target: "elastic" | "splunk" | "sentinel", payload: any) {
      return fetch(`${API_BASE}/api/v1/deploy/${target}`, {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      }).then(j);
    },
    job(jid: string) {
      return fetch(`${API_BASE}/api/v1/deploy/${jid}`, { headers }).then(j);
    },
    aiRule(body: any) {
      return fetch(`${API_BASE}/api/v1/ai/rules/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }).then(j);
    },
    aiAttack(body: any) {
      return fetch(`${API_BASE}/api/v1/ai/attacks/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }).then(j);
    },
    aiInfra(body: any) {
      return fetch(`${API_BASE}/api/v1/ai/infra/generate`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      }).then(j);
    },
  };
}
