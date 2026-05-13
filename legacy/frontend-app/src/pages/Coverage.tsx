import React,{useEffect,useState} from "react";
import { withAuth } from "../lib/api";
export default function Coverage(){
  const token=localStorage.getItem("catchattack.token")||""; const api=withAuth(token);
  const [rows,setRows]=useState<any[]>([]);
  useEffect(()=>{ api.coverage().then(setRows); },[]);
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">ATT&CK Coverage</h2>
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b"><th>Technique</th><th>Rules</th><th>Validated</th></tr></thead>
        <tbody>
        {rows.map(r=>(
          <tr key={r.technique_id} className="border-b">
            <td>{r.technique_id}</td><td>{r.rules_count}</td><td>{r.validated_count}</td>
          </tr>
        ))}
        </tbody>
      </table>
    </div>
  );
}
