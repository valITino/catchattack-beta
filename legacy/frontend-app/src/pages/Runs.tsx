import React,{useState} from "react";
import { withAuth } from "../lib/api";

export default function Runs(){
  const token=localStorage.getItem("catchattack.token")||""; const api=withAuth(token);
  const [rid,setRid]=useState<string>(""); const [res,setRes]=useState<any>(null);
  async function runAll(file?:File){
    const cr=await api.createRun("ui-run","local"); const id=cr.id; setRid(id);
    await api.startRun(id);
    if(file){ await api.ingestRun(id, file, true); }
    const ev=await api.evaluateRun(id,"local"); setRes(ev);
  }
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Runs</h2>
      <input type="file" onChange={(e)=>runAll(e.target.files?.[0]||undefined)} className="block"/>
      {rid && <div>Run ID: <b>{rid}</b></div>}
      {res && <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(res,null,2)}</pre>}
    </div>
  );
}
