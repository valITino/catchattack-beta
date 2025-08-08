import React,{useEffect,useState} from "react";
import { withAuth } from "../lib/api";
export default function Rules(){
  const token=localStorage.getItem("catchattack.token")||""; const api=withAuth(token);
  const [rows,setRows]=useState<any[]>([]); const [msg,setMsg]=useState<string>("");
  useEffect(()=>{ api.listRules().then(setRows); },[]);
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
            <td>{r.name}</td><td>{(r.attack_techniques||[]).join(", ")}</td><td>{r.status}</td>
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
