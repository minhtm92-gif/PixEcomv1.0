const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export async function getJson(path: string) { const res = await fetch(`${API}${path}`, { cache: 'no-store' }); return res.json(); }
export async function postJson(path: string, body: any) { const res = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }); return res.json(); }
