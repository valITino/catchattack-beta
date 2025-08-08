export const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000";

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) throw new Error(await res.text());
  return res.json() as Promise<T>;
}

export async function login(username:string,password:string){
  const form = new URLSearchParams(); form.set("username",username); form.set("password",password);
  const r = await fetch(`${API_BASE}/api/v1/auth/token`, { method:"POST", headers:{ "Content-Type":"application/x-www-form-urlencoded" }, body: form });
  return j<{access_token:string,role:string}>(r);
}

export function withAuth(token:string){ 
  const h = { "Authorization":`Bearer ${token}", "Content-Type":"application/json" };
  return {
    listRules: (technique?:string)=> fetch(`${API_BASE}/api/v1/rules${technique?`?technique=${technique}`:''}`, {headers:h}).then(j),
    createRule: (body:any)=> fetch(`${API_BASE}/api/v1/rules`, {method:"POST",headers:h,body:JSON.stringify(body)}).then(j),
    lintRule: (id:string)=> fetch(`${API_BASE}/api/v1/rules/${id}/lint`, {method:"POST",headers:h}).then(j),
    compileRule: (id:string,target:string)=> fetch(`${API_BASE}/api/v1/rules/${id}/compile?target=${target}`, {method:"POST",headers:h}).then(j),
    listTuning: (id:string)=> fetch(`${API_BASE}/api/v1/rules/${id}/tuning`, {headers:h}).then(j),
    addTuning: (id:string, body:any)=> fetch(`${API_BASE}/api/v1/rules/${id}/tuning`, {method:"POST",headers:h,body:JSON.stringify(body)}).then(j),
    effective: (id:string,target:string, customization_id?:string)=> fetch(`${API_BASE}/api/v1/rules/${id}/effective?target=${target}${customization_id?`&customization_id=${customization_id}`:''}`, {method:"POST",headers:h}).then(j),
    createRun: (name:string, source:"local"|"atomic"|"caldera")=>{
      const f = new FormData(); f.set("name",name); f.set("source",source);
      return fetch(`${API_BASE}/api/v1/runs`, {method:"POST", headers:{ "Authorization":`Bearer ${token}` }, body:f}).then(j);
    },
    startRun: (rid:string)=> fetch(`${API_BASE}/api/v1/runs/${rid}/start`, {method:"POST",headers:h}).then(j),
    ingestRun: (rid:string, file:File, autoIndex:boolean)=> {
      const f = new FormData(); f.set("file", file);
      return fetch(`${API_BASE}/api/v1/runs/${rid}/ingest?auto_index=${autoIndex}`, {method:"POST", headers:{ "Authorization":`Bearer ${token}` }, body:f}).then(j);
    },
    evaluateRun: (rid:string, engine:"local"|"elastic")=> fetch(`${API_BASE}/api/v1/runs/${rid}/evaluate?engine=${engine}`, {method:"POST",headers:h}).then(j),
    getRun: (rid:string)=> fetch(`${API_BASE}/api/v1/runs/${rid}`, {headers:h}).then(j),
    getResults: (rid:string)=> fetch(`${API_BASE}/api/v1/runs/${rid}/results`, {headers:h}).then(j),
    coverage: ()=> fetch(`${API_BASE}/api/v1/coverage`, {headers:h}).then(j),
    priorities: (org?:string)=> fetch(`${API_BASE}/api/v1/priorities${org?`?organization=${org}`:''}`, {headers:h}).then(j),
    deploy: (target:"elastic"|"splunk"|"sentinel", payload:any)=> fetch(`${API_BASE}/api/v1/deploy/${target}`, {method:"POST",headers:h,body:JSON.stringify(payload)}).then(j),
    job: (jid:string)=> fetch(`${API_BASE}/api/v1/deploy/${jid}`, {headers:h}).then(j),
    aiRule: (body:any)=> fetch(`${API_BASE}/api/v1/ai/rules/generate`, {method:"POST",headers:h,body:JSON.stringify(body)}).then(j),
    aiAttack: (body:any)=> fetch(`${API_BASE}/api/v1/ai/attacks/generate`, {method:"POST",headers:h,body:JSON.stringify(body)}).then(j),
    aiInfra: (body:any)=> fetch(`${API_BASE}/api/v1/ai/infra/generate`, {method:"POST",headers:h,body:JSON.stringify(body)}).then(j)
  };
}
