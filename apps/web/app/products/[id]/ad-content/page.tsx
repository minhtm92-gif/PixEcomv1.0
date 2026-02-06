import { getJson } from '@/lib/api';

const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

export default async function AdContent({ params }: { params: { id: string } }) {
  const list = await getJson(`/creatives?productId=${params.id}`);
  return (
    <div className="space-y-3">
      <h2 className="page-title">Product Ad Content</h2>
      <div className="flex gap-1">
        <button className="btn">Product Pages</button>
        <button className="btn btn-primary">Ad Content</button>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {list.map((c: any) => (
          <div key={c.id} className="card p-3">
            <div className="muted text-[11px]">{c.type}</div>
            <div className="text-[13px] font-medium">Version {c.version}</div>
            <div className="subtle text-[11px] mt-1">Spent {fmt(c.spentCents)} | ROAS {c.roas}</div>
            <a className="text-[#9fb8ff] text-[11px] mt-2 inline-block" href="#">Details</a>
          </div>
        ))}
      </div>
    </div>
  );
}
