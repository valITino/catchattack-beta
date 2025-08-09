import React,{useEffect,useState} from "react";
import { API_BASE } from "../lib/api";

export default function Library(){
  const token = localStorage.getItem("catchattack.token") || "";
  const H = { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" };
  const [q,setQ]=useState(""); const [rows,setRows]=useState<any[]>([]);
  const [folder,setFolder]=useState("/app/backend/ops/seeds/rules");
  const [msg,setMsg]=useState("");

  async function doSearch(){
    const r = await fetch(`${API_BASE}/api/v1/search/rules?q=${encodeURIComponent(q)}`, { headers: H });
    setRows(await r.json());
  }
  async function doImport(){
    setMsg("Importing...");
    const r = await fetch(`${API_BASE}/api/v1/imports/folder`, { method:"POST", headers:H, body: JSON.stringify({ folder }) });
    const j = await r.json(); setMsg(`Imported: ${j.inserted} (deduped ${j.deduped}, errors ${j.errors})`);
    await doSearch();
  }
  useEffect(()=>{ doSearch(); },[]);
  return (
    <div className="p-6 space-y-3">
      <h2 className="text-xl font-semibold">Library</h2>
      <div className="flex gap-2">
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search…" className="border px-2 py-1 rounded w-64"/>
        <button className="px-2 py-1 border rounded" onClick={doSearch}>Search</button>
      </div>
      <div className="flex gap-2 items-center">
        <input value={folder} onChange={e=>setFolder(e.target.value)} className="border px-2 py-1 rounded w-[480px]"/>
        <button className="px-2 py-1 border rounded" onClick={doImport}>Import Folder</button>
        <span className="text-xs text-gray-600">{msg}</span>
      </div>
      <table className="w-full text-sm">
        <thead><tr className="text-left border-b"><th>Name</th><th>Status</th><th>Techniques</th><th>Updated</th></tr></thead>
        <tbody>
          {rows.map(r=>(
            <tr key={r.id} className="border-b">
              <td><a className="underline" href={`#/rule/${r.id}`}>{r.name}</a></td>
              <td>{r.status}</td>
              <td>{(r.techniques||[]).join(", ")}</td>
              <td>{r.updated_at}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
