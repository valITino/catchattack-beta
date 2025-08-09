import React,{useEffect,useState} from "react";
import { API_BASE,withAuth } from "../lib/api";
type HealthMap=Record<string,number|undefined>;
export default function Rules(){
  const token=localStorage.getItem("catchattack.token")||""; const api=withAuth(token);
  const [rows,setRows]=useState<any[]>([]); const [msg,setMsg]=useState<string>("");
  const [health,setHealth]=useState<HealthMap>({});
  useEffect(()=>{
    api.listRules().then(async (rs:any[])=>{
      setRows(rs);
      const entries=await Promise.all(rs.map(async r=>{
        try{
          const h=await fetch(`${API_BASE}/api/v1/rules/${r.id}/health`,{headers:{Authorization:`Bearer ${token}`}}).then(x=>x.json());
          return [r.id,h.confidence] as const;
        }catch{ return [r.id,undefined] as const; }
      }));
      setHealth(Object.fromEntries(entries));
    });
  },[]);
  async function lint(id:string){ const r=await api.lintRule(id); setMsg(`Lint: ${r.ok}`); }
  async function compile(id:string, target:string){ const r=await api.compileRule(id,target); setMsg(`Compile ${target}: ${r.ok}`); }
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Rules</h2>
      {msg && <div className="text-xs text-gray-600">{msg}</div>}
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b"><th>Name</th><th>Techniques</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
        {rows.map(r=>(
          <tr key={r.id} className="border-b">
            <td>{r.name}</td><td>{(r.attack_techniques||[]).join(", ")}</td><td>{r.status}<span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{background:(health[r.id]??0)>=0.75?"#DCFCE7":(health[r.id]??0)>=0.4?"#FEF9C3":"#FEE2E2"}}>{health[r.id]==null?"conf —":`conf ${(health[r.id]||0).toFixed(2)}`}</span></td>
            <td className="space-x-2">
              <button className="px-2 py-1 border rounded" onClick={()=>lint(r.id)}>Lint</button>
              <button className="px-2 py-1 border rounded" onClick={()=>compile(r.id,"elastic")}>Elastic</button>
              <button className="px-2 py-1 border rounded" onClick={()=>compile(r.id,"sentinel")}>Sentinel</button>
              <a className="px-2 py-1 underline" href={`#/rule/${r.id}`}>Detail</a>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
}
