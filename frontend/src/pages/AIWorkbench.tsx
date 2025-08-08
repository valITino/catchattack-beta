import React,{useState} from "react";
import { withAuth } from "../lib/api";
export default function AIWorkbench(){
  const token=localStorage.getItem("catchattack.token")||""; const api=withAuth(token);
  const [rule,setRule]=useState<any>(null);
  const [attack,setAttack]=useState<any>(null);
  const [infra,setInfra]=useState<any>(null);
  async function genRule(){
    const r = await api.aiRule({ signals:{ logs_example:[{ "process.command_line":"powershell -EncodedCommand AA==" }], techniques:["T1059.001"], platform:"windows", siem:"elastic" }, constraints:{ must_explain:true } });
    setRule(r);
  }
  async function genAttack(){ setAttack(await api.aiAttack({ goals:["quiet discovery"], style:"powershell" })); }
  async function genInfra(){ setInfra(await api.aiInfra({ topology:{ hosts:2, roles:["es","gen"] }, telemetry:{ elastic:true } })); }
  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">AI Workbench</h2>
      <div className="space-x-2">
        <button className="px-2 py-1 border rounded" onClick={genRule}>Generate Sigma</button>
        <button className="px-2 py-1 border rounded" onClick={genAttack}>Generate Attack (safe)</button>
        <button className="px-2 py-1 border rounded" onClick={genInfra}>Generate Infra</button>
      </div>
      {rule && <><h3 className="font-medium">Sigma</h3><pre className="text-xs bg-gray-50 p-2 rounded">{rule.sigma_yaml}</pre></>}
      {attack && <><h3 className="font-medium">Attack Script</h3><pre className="text-xs bg-gray-50 p-2 rounded">{attack.script}</pre></>}
      {infra && <><h3 className="font-medium">Compose</h3><pre className="text-xs bg-gray-50 p-2 rounded">{infra.blueprint.compose_yaml}</pre></>}
    </div>
  );
}
