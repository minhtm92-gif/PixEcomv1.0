'use client';
import { useEffect, useState } from 'react';
import { getJson, postJson } from '@/lib/api';

export default function IntegrationsFacebook() {
  const [rows, setRows] = useState<any[]>([]);
  const [msg, setMsg] = useState('');

  useEffect(() => {
    getJson('/integrations/facebook/ad-accounts').then(setRows);
  }, []);

  return (
    <div className="space-y-3">
      <h2 className="page-title">Facebook Integration</h2>
      <button className="btn btn-primary" onClick={async () => setMsg((await postJson('/integrations/facebook/sync', {})).message)}>
        Run Mock Sync
      </button>
      {msg && <div className="badge badge-success">{msg}</div>}
      <div className="card p-3">
        {rows.map((r) => (
          <div key={r.id} className="h-[38px] border-t border-[var(--border-subtle)] py-2 text-[11px] flex items-center">
            {r.name} ({r.platformId}) {r.currency} {r.timezone}
          </div>
        ))}
      </div>
    </div>
  );
}
