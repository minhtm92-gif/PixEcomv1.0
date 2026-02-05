'use client';
import { useState } from 'react';
import { postJson } from '@/lib/api';

export default function AdWizard() {
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(1);
  const [sourceType, setSourceType] = useState<'EXISTING_POST'|'CONTENT_SOURCE'>('CONTENT_SOURCE');
  const [result, setResult] = useState<any>();

  return <>
    <button className="btn" onClick={()=>setOpen(true)}>Create New Facebook Ad</button>
    {open && <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"><div className="w-[1100px] h-[85vh] card p-4 flex flex-col">
      <div className="pb-2 border-b border-slate-800 font-semibold sticky top-0 bg-slate-900">Create New Facebook Ad - Step {step}</div>
      <div className="overflow-y-auto flex-1 py-3 text-sm space-y-4">
        {step===1 ? <div className="grid grid-cols-3 gap-3">{['Strategy','Sellpage','Facebook Page','Ad Account','Pixel','Conversion','Campaigns #','Budget/campaign','Status','Audience','Location','Gender','Age','Attribution','Optimization Goal','AdSets #','Ads / AdSet'].map(f=><label key={f} className="space-y-1"><div>{f}</div><input className="input w-full" /></label>)}</div> : <div className="space-y-3"><div className="grid grid-cols-3 gap-2">{['Ad1','Ad2','Ad3'].map(a=><div key={a} className="border border-slate-700 rounded p-2">{a}</div>)}</div>
          <div><button className="btn mr-2" onClick={()=>setSourceType('EXISTING_POST')}>Existing Post</button><button className="btn" onClick={()=>setSourceType('CONTENT_SOURCE')}>Content Source</button></div>
          {sourceType==='EXISTING_POST' ? <div className="card p-3">No posts available. Please create a new ad post from Content Source.</div> : <div className="grid grid-cols-2 gap-2">{['Media','Thumbnails','Adtexts'].map(t=><div key={t} className="card p-2">{t} picker list by product code + version + spent/roas</div>)}</div>}
        </div>}
        {result && <pre>{JSON.stringify(result,null,2)}</pre>}
      </div>
      <div className="flex justify-end gap-2 border-t border-slate-800 pt-2"><button className="btn" onClick={()=>setOpen(false)}>Cancel</button>{step>1&&<button className="btn" onClick={()=>setStep(1)}>Back</button>}{step<2?<button className="btn" onClick={()=>setStep(2)}>Next</button>:<button className="btn" onClick={async()=>setResult(await postJson('/ad-wizard/submit',{sourceType}))}>Submit</button>}</div>
    </div></div>}
  </>;
}
