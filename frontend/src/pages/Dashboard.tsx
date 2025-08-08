import React, {useEffect,useState} from "react";
import { withAuth } from "../lib/api";
export default function Dashboard(){
  const [data,setData]=useState<any>({}); const token=localStorage.getItem("catchattack.token")||"";
  const api=withAuth(token);
  useEffect(()=>{ 
    Promise.all([api.coverage(), api.priorities("AcmeBank")]).then(([cov,pri])=>{
      setData({coverage: cov.length, top: pri.slice(0,3)});
    }).catch(()=>{});
  },[]);
  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">catchattack-beta</h1>
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 rounded-xl shadow">Coverage Techniques: <b>{data.coverage ?? 0}</b></div>
        <div className="p-4 rounded-xl shadow">Top Priorities: <pre className="text-xs">{JSON.stringify(data.top,null,2)}</pre></div>
        <div className="p-4 rounded-xl shadow">Quick Links: Rules, Runs, Deploy, AI</div>
      </div>
    </div>
  );
}
