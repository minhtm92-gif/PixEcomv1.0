import Link from 'next/link';
import { getJson } from '@/lib/api';

export default async function Products() {
  const rows = await getJson('/products');
  return (
    <div>
      <h2 className="page-title mb-3">Products</h2>
      <div className="grid gap-2">
        {rows.map((r: any) => (
          <Link key={r.id} className="card p-3 hover:bg-[var(--bg-muted)]" href={`/products/${r.id}/ad-content`}>
            <span className="text-[12px]">{r.code} - {r.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
