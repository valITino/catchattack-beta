import React, { useEffect, useMemo, useState } from "react";
import { API_BASE, withAuth } from "../lib/api";

type FieldRow = { field:string; types:string[]; examples?:any[]; suggested_ops?:string[]; elem_types?:string[] };
type Predicate = { field:string; op:string; value:any };
type LogSource = { product?:string; service?:string; category?:string };

function Step({n, title, active}:{n:number; title:string; active:boolean}){
  return <div className={`px-3 py-1 rounded-full text-sm ${active?"bg-black text-white":"bg-gray-200"}`}>{n}. {title}</div>;
}

export default function Builder(){
  const token = localStorage.getItem("catchattack.token") || "";
  const api = withAuth(token);

  // Step state
  const [step, setStep] = useState<number>(1);

  // Source
  const [dataset, setDataset] = useState<string>("file:///app/backend/ops/seeds/telemetry/windows.ndjson");
  const [schema, setSchema] = useState<FieldRow[]>([]);
  const [operators, setOperators] = useState<{op:string;types:string[]}[]>([]);
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [schemaMsg, setSchemaMsg] = useState("");

  // Draft
  const [title, setTitle] = useState("New Detection (Builder)");
  const [description, setDescription] = useState("");
  const [techniques, setTechniques] = useState<string>("T1059.001");
  const [logsource, setLogsource] = useState<LogSource>({ product:"windows" });
  const [combine, setCombine] = useState<"any"|"all">("any");
  const [level, setLevel] = useState<"low"|"medium"|"high"|"critical">("medium");
  const [falsepositives, setFP] = useState<string>("");
  const [fields, setFields] = useState<string>("host.name,process.command_line");
  const [preds, setPreds] = useState<Predicate[]>([
    { field:"process.command_line", op:"contains", value:"-EncodedCommand" }
  ]);

  // Preview
  const [preview, setPreview] = useState<{sigma_yaml?:string; hits?:number; samples?:any[]}>({});
  const [previewMsg, setPreviewMsg] = useState("");

  useEffect(() => {
    // load operator catalog once
    api.builderOperators().then(setOperators).catch(() => {});
  }, [api]);

  async function loadSchema(){
    setLoadingSchema(true); setSchemaMsg("Loading schema…");
    try{
      const res = await api.builderSchema(dataset, 100, 4);
      setSchema(res.fields || []); setSchemaMsg(`Loaded ${res.fields?.length||0} fields`);
      if(step===1) setStep(2);
    }catch(e:any){ setSchemaMsg(`Error: ${e?.message||"failed"}`); }
    setLoadingSchema(false);
  }
  function addPred(){
    setPreds(p=>[...p, { field:"", op:"equals", value:"" }]);
  }
  function updPred(i:number, patch:Partial<Predicate>){
    setPreds(p => p.map((row,idx)=> idx===i ? { ...row, ...patch } : row ));
  }
  function delPred(i:number){
    setPreds(p => p.filter((_,idx)=> idx!==i));
  }

  const draft = useMemo(()=>({
    title, description,
    logsource,
    technique_ids: techniques.split(",").map(s=>s.trim()).filter(Boolean),
    predicates: preds,
    combine,
    level,
    falsepositives: falsepositives ? falsepositives.split(",").map(s=>s.trim()) : [],
    fields: fields.split(",").map(s=>s.trim()).filter(Boolean)
  }), [title, description, logsource, techniques, preds, combine, level, falsepositives, fields]);

  async function doPreview(){
    setPreviewMsg("Preview running…");
    try{
      const res = await api.builderPreview(draft, dataset, 5);
      setPreview(res);
      setPreviewMsg(`Hits: ${res.hits}`);
      if(step===3) setStep(4);
    }catch(e:any){
      setPreview({}); setPreviewMsg(`Error: ${e?.message||"failed"}`);
    }
  }

  async function doSave(){
    if(!preview?.sigma_yaml){ setPreviewMsg("Compile first via Preview."); return; }
    const body = {
      name: title,
      description: description || "Created via Builder",
      attack_techniques: draft.technique_ids,
      sigma_yaml: preview.sigma_yaml,
      status: "draft"
    };
    try{
      const r = await api.saveRule(body);
      setPreviewMsg(`Saved rule ${r.id}`);
    }catch(e:any){
      setPreviewMsg(`Save failed: ${e?.message||"failed"}`);
    }
  }

  const typeOps = (row:FieldRow) => {
    if(row?.suggested_ops?.length) return row.suggested_ops;
    return operators.map(o=>o.op);
  };

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-xl font-semibold">Detection Builder</h2>

      <div className="flex gap-2">
        <Step n={1} title="Source" active={step>=1}/>
        <Step n={2} title="Logic" active={step>=2}/>
        <Step n={3} title="Test" active={step>=3}/>
        <Step n={4} title="Save" active={step>=4}/>
      </div>

      {/* Step 1: Source */}
      <div className="space-y-2 border rounded-xl p-4">
        <div className="font-medium">1) Select dataset</div>
        <div className="flex gap-2 items-center">
          <input className="border px-2 py-1 rounded w-[560px]" value={dataset} onChange={e=>setDataset(e.target.value)} />
          <button className="px-2 py-1 border rounded" onClick={loadSchema} disabled={loadingSchema}>Load Schema</button>
          <span className="text-xs text-gray-600">{schemaMsg}</span>
        </div>
        {schema.length>0 && <div className="text-xs text-gray-600">Fields detected: {schema.length}</div>}
      </div>

      {/* Step 2: Logic */}
      <div className="space-y-3 border rounded-xl p-4">
        <div className="font-medium">2) Define rule logic</div>

        <div className="grid grid-cols-3 gap-3">
          <label className="text-sm">Title
            <input className="border px-2 py-1 rounded w-full" value={title} onChange={e=>setTitle(e.target.value)}/>
          </label>
          <label className="text-sm">Techniques (comma)
            <input className="border px-2 py-1 rounded w-full" value={techniques} onChange={e=>setTechniques(e.target.value)}/>
          </label>
          <label className="text-sm">Logsource
            <div className="flex gap-2">
              <input placeholder="product" className="border px-2 py-1 rounded w-full" value={logsource.product||""} onChange={e=>setLogsource({...logsource, product:e.target.value||undefined})}/>
              <input placeholder="service" className="border px-2 py-1 rounded w-full" value={logsource.service||""} onChange={e=>setLogsource({...logsource, service:e.target.value||undefined})}/>
              <input placeholder="category" className="border px-2 py-1 rounded w-full" value={logsource.category||""} onChange={e=>setLogsource({...logsource, category:e.target.value||undefined})}/>
            </div>
          </label>
        </div>

        <div className="flex gap-3 items-center">
          <label className="text-sm">Combine
            <select className="border px-2 py-1 rounded ml-2" value={combine} onChange={e=>setCombine(e.target.value as any)}>
              <option value="any">ANY (OR)</option>
              <option value="all">ALL (AND)</option>
            </select>
          </label>
          <label className="text-sm">Level
            <select className="border px-2 py-1 rounded ml-2" value={level} onChange={e=>setLevel(e.target.value as any)}>
              <option>low</option><option>medium</option><option>high</option><option>critical</option>
            </select>
          </label>
          <label className="text-sm">False positives (comma)
            <input className="border px-2 py-1 rounded ml-2 w-[360px]" value={falsepositives} onChange={e=>setFP(e.target.value)}/>
          </label>
          <label className="text-sm">Fields (comma)
            <input className="border px-2 py-1 rounded ml-2 w-[360px]" value={fields} onChange={e=>setFields(e.target.value)}/>
          </label>
        </div>

        <div className="space-y-2">
          <div className="font-medium">Predicates</div>
          {preds.map((p,i)=>(
            <div key={i} className="grid grid-cols-12 gap-2 items-center">
              <select className="border px-2 py-1 rounded col-span-5" value={p.field} onChange={e=>updPred(i,{field:e.target.value})}>
                <option value="">— choose field —</option>
                {schema.map(f => <option key={f.field} value={f.field}>{f.field}</option>)}
              </select>
              <select className="border px-2 py-1 rounded col-span-2" value={p.op} onChange={e=>updPred(i,{op:e.target.value})}>
                {schema.find(f=>f.field===p.field)?.suggested_ops?.map(op => <option key={op} value={op}>{op}</option>) ||
                 operators.map(o=> <option key={o.op} value={o.op}>{o.op}</option>)}
              </select>
              <input className="border px-2 py-1 rounded col-span-4" value={p.value} onChange={e=>updPred(i,{value:e.target.value})} placeholder="value" />
              <button className="col-span-1 px-2 py-1 border rounded" onClick={()=>delPred(i)}>Del</button>
              {schema.find(f=>f.field===p.field)?.examples?.length ? (
                <div className="col-span-12 text-xs text-gray-500 pl-2">Examples: {schema.find(f=>f.field===p.field)?.examples?.slice(0,3).map((x:any)=>JSON.stringify(x)).join(", ")}</div>
              ) : null}
            </div>
          ))}
          <button className="px-2 py-1 border rounded" onClick={addPred}>+ Add Predicate</button>
        </div>
      </div>
      {/* Step 3: Test */}
      <div className="space-y-2 border rounded-xl p-4">
        <div className="font-medium">3) Test on dataset</div>
        <button className="px-2 py-1 border rounded" onClick={doPreview}>Preview</button>
        <span className="text-xs text-gray-600 ml-2">{previewMsg}</span>
        {preview?.sigma_yaml && (
          <>
            <div className="mt-3 text-sm font-medium">Sigma YAML</div>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-64">{preview.sigma_yaml}</pre>
          </>
        )}
        {preview?.samples?.length ? (
          <>
            <div className="mt-3 text-sm font-medium">Sample matches</div>
            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto max-h-64">{JSON.stringify(preview.samples,null,2)}</pre>
          </>
        ) : null}
      </div>

      {/* Step 4: Save */}
      <div className="space-y-2 border rounded-xl p-4">
        <div className="font-medium">4) Save as draft rule</div>
        <button className="px-2 py-1 border rounded" onClick={doSave} disabled={!preview?.sigma_yaml}>Save Rule</button>
      </div>
    </div>
  );
}
