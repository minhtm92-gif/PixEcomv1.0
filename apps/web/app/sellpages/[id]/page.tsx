import { getJson } from '@/lib/api';

const fmt = (c: number) => `$${(c / 100).toFixed(2)}`;

export default async function SellpageDetails({ params }: { params: { id: string } }) {
  const m = await getJson(`/sellpages/${params.id}/metrics`);
  const creatives = await getJson('/creatives?type=ADPOST');

  return (
    <div className="space-y-3">
      <h2 className="page-title">Sellpage Details</h2>

      <div className="grid grid-cols-6 gap-2">
        {[
          ['Revenue', fmt(m.revenueCents)],
          ['Cost', fmt(m.spendCents)],
          ['You take', fmt(m.revenueCents - m.spendCents)],
          ['Hold', '$120.00'],
          ['Unhold', '$80.00'],
          ['Cash to balance', '$42.00']
        ].map(([k, v]) => (
          <div key={k} className="kpi-card">
            <div className="muted text-[11px]">{k}</div>
            <div className="text-[15px] mt-1">{v}</div>
          </div>
        ))}
      </div>

      <div className="card p-3">
        <h3 className="section-title mb-2">Source breakdown</h3>
        <table className="table-compact min-w-full">
          <tbody>
            {['Facebook', 'Pinterest', 'Google', 'Applovin'].map((s) => (
              <tr key={s}>
                <td>{s}</td>
                <td>{fmt(23000)}</td>
                <td>2.1</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card p-3">
        <div className="flex justify-between items-center mb-2">
          <h3 className="section-title">Facebook Ad Creative Performance</h3>
          <div className="space-x-1">
            <button className="btn">See all</button>
            <button className="btn btn-primary">Create New Ad</button>
          </div>
        </div>
        {creatives.map((c: any) => (
          <div key={c.id} className="h-[38px] border-t border-[var(--border-subtle)] flex justify-between items-center text-[11px]">
            <div>{c.version}</div>
            <div className="subtle">Spent {fmt(c.spentCents)} | ROAS {c.roas}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
