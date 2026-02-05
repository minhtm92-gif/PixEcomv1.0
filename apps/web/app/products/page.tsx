import Link from 'next/link';import { getJson } from '@/lib/api';
export default async function Products(){const rows=await getJson('/products');return <div><h2 className="text-xl mb-4">Products</h2><div className="card p-3 grid gap-2">{rows.map((r:any)=><Link key={r.id} className="border border-slate-800 rounded p-3" href={`/products/${r.id}/ad-content`}>{r.code} - {r.name}</Link>)}</div></div>}
