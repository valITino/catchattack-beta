import React,{useEffect,useState} from "react";
import { withAuth } from "../lib/api";
export default function Deploy(){
  const token=localStorage.getItem("catchattack.token")||""; const api=withAuth(token);
  const [rules,setRules]=useState<any[]>([]); const [job,setJob]=useState<any>(null);
  useEffect(()=>{ api.listRules().then(setRules); },[]);
  async function deploy(target:"elastic"|"splunk"|"sentinel"){
    const payload={ rules: rules.slice(0,3).map(r=>({rule_id:r.id})) };
    const j=await api.deploy(target, payload); setJob(j);
  }
  return (
    <div className="p-6 space-y-3">
      <h2 className="text-xl font-semibold">Deploy</h2>
      <div className="space-x-2">
        <button className="px-2 py-1 border rounded" onClick={()=>deploy("elastic")}>Deploy → Elastic</button>
        <button className="px-2 py-1 border rounded" onClick={()=>deploy("splunk")}>Stub → Splunk</button>
        <button className="px-2 py-1 border rounded" onClick={()=>deploy("sentinel")}>Stub → Sentinel</button>
      </div>
      {job && <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(job,null,2)}</pre>}
    </div>
  );
}
