import Link from 'next/link';
import { getJson } from '@/lib/api';

export default async function Sellpages() {
  const rows = await getJson('/sellpages');
  return (
    <div>
      <h2 className="page-title mb-3">Sellpages</h2>
      <div className="table-wrap">
        <table className="table-compact min-w-full">
          <thead>
            <tr>
              <th>Slug</th>
              <th>Domain</th>
              <th>Product</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r: any) => (
              <tr key={r.id}>
                <td><Link href={`/sellpages/${r.id}`} className="text-[#9fb8ff]">{r.slug}</Link></td>
                <td className="subtle">{r.domain}</td>
                <td>{r.product?.name}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
