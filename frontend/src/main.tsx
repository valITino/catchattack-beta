import React from "react";
import {createRoot} from "react-dom/client";
import Dashboard from "./pages/Dashboard";
import Coverage from "./pages/Coverage";
import Rules from "./pages/Rules";
import RuleDetail from "./pages/RuleDetail";
import Runs from "./pages/Runs";
import Deploy from "./pages/Deploy";
import AIWorkbench from "./pages/AIWorkbench";

function Router(){
  const hash = window.location.hash.slice(2); // e.g. /rules or /rule/<id>
  if(hash.startsWith("coverage")) return <Coverage/>;
  if(hash.startsWith("rules")) return <Rules/>;
  if(hash.startsWith("rule/")) return <RuleDetail id={hash.split("/")[1]}/>;
  if(hash.startsWith("runs")) return <Runs/>;
  if(hash.startsWith("deploy")) return <Deploy/>;
  if(hash.startsWith("ai")) return <AIWorkbench/>;
  return <Dashboard/>;
}

function App(){
  const [tok,setTok]=React.useState(localStorage.getItem("catchattack.token")||"");
  async function doLogin(role:"admin"|"analyst"|"viewer"){
    const r = await fetch((import.meta as any).env.VITE_API_BASE+"/api/v1/auth/token",{
      method:"POST", headers:{ "Content-Type":"application/x-www-form-urlencoded" },
      body:`username=${role}&password=${role}pass`
    }); const j = await r.json(); localStorage.setItem("catchattack.token", j.access_token); setTok(j.access_token);
  }
  return (
    <div>
      <nav className="p-3 flex gap-3 bg-gray-100">
        <a href="#/">Dashboard</a><a href="#/coverage">Coverage</a><a href="#/rules">Rules</a>
        <a href="#/runs">Runs</a><a href="#/deploy">Deploy</a><a href="#/ai">AI</a>
        <span className="ml-auto">
          <button className="px-2 py-1 border rounded" onClick={()=>doLogin("analyst")}>Login Analyst</button>
          <button className="px-2 py-1 border rounded ml-2" onClick={()=>doLogin("admin")}>Login Admin</button>
        </span>
      </nav>
      <Router/>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<App/>);
