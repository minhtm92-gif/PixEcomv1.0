import Link from 'next/link';
import { getJson } from '@/lib/api';
export default async function Sellpages(){const rows=await getJson('/sellpages');return <div><h2 className="text-xl mb-4">Sellpages</h2><div className="card p-3"><table className="w-full text-sm"><thead><tr className="text-slate-400"><th>Slug</th><th>Domain</th><th>Product</th></tr></thead><tbody>{rows.map((r:any)=><tr key={r.id} className="border-t border-slate-800"><td><Link href={`/sellpages/${r.id}`}>{r.slug}</Link></td><td>{r.domain}</td><td>{r.product?.name}</td></tr>)}</tbody></table></div></div>}
