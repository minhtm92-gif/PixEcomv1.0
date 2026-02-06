import AdWizard from '@/components/AdWizard';
import { getJson } from '@/lib/api';

const fmt=(c:number)=>`$${(c/100).toFixed(2)}`;
export default async function AdsManager(){
  const campaigns=await getJson('/ads-manager/campaigns');
  return <div className="space-y-3"><h2 className="text-xl">Facebook Real-time Ads Manager</h2>
    <div className="flex justify-between"><div className="space-x-2">{['Today','Yesterday','This Week','This Month'].map(t=><button key={t} className="btn">{t}</button>)}</div><input className="input" defaultValue="2025-01-01 to 2025-01-31"/></div>
    <div className="card p-2 flex flex-wrap gap-2">{['Media','Adtext','Thumbnail','Sellpage','Ad Post','Ad Account','Campaign','Campaign Status','Ad Sets','Ads'].map(f=><select key={f} className="input"><option>{f}</option></select>)}</div>
    <div className="flex items-center justify-between"><div className="space-x-2"><button className="btn bg-slate-700">Campaigns</button><button className="btn">Ad Sets</button><button className="btn">Ads</button></div><div className="space-x-2"><label className="text-sm">AI Ad Assistant <input type="checkbox"/></label><button className="btn">Bulk Update</button><AdWizard/></div></div>
    <div className="card overflow-auto max-h-[60vh]"><table className="min-w-[1800px] text-xs"><thead className="sticky top-0 bg-slate-900"><tr className="text-slate-400"><th className="sticky left-0 bg-slate-900 p-2">Campaign & Status</th><th className="sticky left-[200px] bg-slate-900 p-2">Delivery Status</th>{['Start Date','Budget','Spent','ROAS','Results','CPM','CTR','Link Clicks','CPC','Content Views','CPV','ATC','Checkout Initiated','Purchases','Cost per Purchase','Purchase conversion value','CR','CR1','CR2'].map(c=><th key={c} className="p-2 text-left">{c}</th>)}</tr></thead>
    <tbody>{campaigns.map((c:any)=><tr key={c.id} className="border-t border-slate-800"><td className="sticky left-0 bg-slate-950 p-2">{c.name}<div className="text-slate-400">{c.configuredStatus}</div></td><td className="sticky left-[200px] bg-slate-950 p-2">{c.deliveryStatus} / {c.effectiveStatus}</td><td>{new Date(c.startDate).toLocaleDateString()}</td><td>{fmt(c.dailyBudgetCents)}</td><td>{fmt(c.spendCents)}</td><td>2.1</td><td>12</td><td>9.1</td><td>2.3%</td><td>125</td><td>{fmt(120)}</td><td>1290</td><td>{fmt(15)}</td><td>82</td><td>36</td><td>13</td><td>{fmt(2000)}</td><td>{fmt(30200)}</td><td>1.9%</td><td>2.2%</td><td>3.2%</td></tr>)}</tbody></table></div>
  </div>
}
