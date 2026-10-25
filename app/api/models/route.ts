import { NextResponse } from 'next/server';
import { PROVIDERS } from '@/lib/providers';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  let providerId: string;
  let apiKey: string;
  let baseURL: string;
  try {
    const body = await req.json();
    providerId = body.providerId;
    apiKey = body.apiKey;
    baseURL = typeof body.baseURL === 'string' ? body.baseURL.trim() : '';
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const p = PROVIDERS[providerId];
  if (!p) return NextResponse.json({ error: 'Unknown provider' }, { status: 400 });
  if (!apiKey?.trim()) return NextResponse.json({ error: 'API key required' }, { status: 400 });

  const base = baseURL || p.baseURL;
  if (!base) return NextResponse.json({ error: 'Base URL required' }, { status: 400 });

  try {
    const res = await fetch(`${base.replace(/\/$/, '')}/models`, {
      method: 'GET',
      headers:
        p.api === 'anthropic' && !baseURL
          ? { 'x-api-key': apiKey.trim(), 'anthropic-version': '2023-06-01' }
          : { Authorization: `Bearer ${apiKey.trim()}` },
      signal: AbortSignal.timeout(15000),
      cache: 'no-store',
    });

    const text = await res.text();
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);

    let json: any;
    try { json = JSON.parse(text); } catch { throw new Error('Provider returned invalid JSON'); }

    const raw: unknown[] = Array.isArray(json) ? json : Array.isArray(json.data) ? json.data : [];
    const ids = raw
      .map((item: any) => (typeof item === 'string' ? item : item?.id))
      .filter((id: any) => id && typeof id === 'string')
      .map((id: string) => id.replace(/^models\//, ''))
      .filter((id: string) => !/(embed|tts|image|dall|audio|whisper)/i.test(id));

    return NextResponse.json({ models: [...new Set(ids)].sort() });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Network error' }, { status: 502 });
  }
}