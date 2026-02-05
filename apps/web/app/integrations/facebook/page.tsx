'use client';
import { useEffect, useState } from 'react';
import { getJson, postJson } from '@/lib/api';

export default function IntegrationsFacebook(){
  const [rows,setRows]=useState<any[]>([]);
  const [msg,setMsg]=useState('');
  useEffect(()=>{getJson('/integrations/facebook/ad-accounts').then(setRows)},[]);
  return <div className="space-y-3"><h2 className="text-xl">Facebook Integration</h2><button className="btn" onClick={async()=>setMsg((await postJson('/integrations/facebook/sync',{})).message)}>Run Mock Sync</button><div>{msg}</div><div className="card p-3">{rows.map(r=><div key={r.id} className="border-t border-slate-800 py-2">{r.name} ({r.platformId}) {r.currency} {r.timezone}</div>)}</div></div>
}
