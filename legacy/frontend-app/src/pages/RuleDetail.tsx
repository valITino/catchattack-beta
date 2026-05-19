import React,{useEffect,useState} from "react";
import { withAuth } from "../lib/api";

export default function RuleDetail({id}:{id:string}){
  const token=localStorage.getItem("catchattack.token")||""; const api=withAuth(token);
  const [overlays,setOverlays]=useState<any[]>([]); const [eff,setEff]=useState<any>(null);
  useEffect(()=>{ api.listTuning(id).then(setOverlays); },[id]);
  async function addOverlay(){
    const body={ owner:"ui", notes:"demo exclude host", overlays:[
      {"op":"add","path":"/detection/fp/host.name|endswith","value":".scanner.local"},
      {"op":"add","path":"/detection/condition","value":"sel and not fp"}
    ]};
    await api.addTuning(id, body); const o=await api.listTuning(id); setOverlays(o);
  }
  async function effective(target:string){ const r=await api.effective(id,target); setEff(r); }
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Rule Detail</h2>
      <div><button className="px-2 py-1 border rounded" onClick={addOverlay}>Add Overlay</button>
           <button className="px-2 py-1 border rounded ml-2" onClick={()=>effective("elastic")}>Effective→Elastic</button></div>
      <h3 className="font-medium">Overlays</h3>
      <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(overlays,null,2)}</pre>
      {eff && <>
        <h3 className="font-medium">Effective YAML</h3>
        <pre className="text-xs bg-gray-50 p-2 rounded">{eff.effective_yaml}</pre>
        <h3 className="font-medium">Queries</h3>
        <pre className="text-xs bg-gray-50 p-2 rounded">{JSON.stringify(eff.queries,null,2)}</pre>
      </>}
    </div>
  );
}
