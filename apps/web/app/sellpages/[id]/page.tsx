import { getJson } from '@/lib/api';
const fmt=(c:number)=>`$${(c/100).toFixed(2)}`;
export default async function SellpageDetails({params}:{params:{id:string}}){
  const m=await getJson(`/sellpages/${params.id}/metrics`);
  const creatives=await getJson('/creatives?type=ADPOST');
  return <div className="space-y-4"><h2 className="text-xl">Sellpage Details</h2>
    <div className="grid grid-cols-6 gap-3">{[['Revenue',fmt(m.revenueCents)],['Cost',fmt(m.spendCents)],['You take',fmt(m.revenueCents-m.spendCents)],['Hold','$120.00'],['Unhold','$80.00'],['Cash to balance','$42.00']].map(([k,v])=><div key={k} className="card p-3"><div className="text-xs text-slate-400">{k}</div><div className="text-lg">{v}</div></div>)}</div>
    <div className="card p-3"><h3 className="mb-2">Source breakdown</h3><table className="w-full text-sm"><tbody>{['Facebook','Pinterest','Google','Applovin'].map(s=><tr key={s} className="border-t border-slate-800"><td>{s}</td><td>{fmt(23000)}</td><td>2.1</td></tr>)}</tbody></table></div>
    <div className="card p-3"><div className="flex justify-between"><h3>Facebook Ad Creative Performance</h3><div className="space-x-2"><button className="btn">See all</button><button className="btn">Create New Ad</button></div></div>
    {creatives.map((c:any)=><div key={c.id} className="border-t border-slate-800 py-2 flex justify-between"><div>{c.version}</div><div>Spent {fmt(c.spentCents)} | ROAS {c.roas}</div></div>)}</div></div>
}
