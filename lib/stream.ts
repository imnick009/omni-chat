import { parseSSE } from './sse';

export interface StreamChunk {
  content: string;
  reasoning: string;
}

export interface StreamOptions {
  providerId: string;
  model: string;
  apiKey: string;
  messages: { role: string; content: unknown }[];
  baseURL?: string;
  signal?: AbortSignal;
}

function toText(v: any): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    return v.map((p) => (typeof p === 'string' ? p : typeof p?.text === 'string' ? p.text : '')).join('');
  }
  if (v && typeof v === 'object' && typeof v.text === 'string') return v.text;
  return '';
}

export async function* streamChat(opts: StreamOptions) {
  const res = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(opts),
    signal: opts.signal,
  });

  if (!res.ok || !res.body) {
    const txt = await res.text();
    let msg = txt;
    try { msg = JSON.parse(txt)?.error?.message ?? txt; } catch { }
    throw new Error(msg);
  }

  yield* parseSSE<StreamChunk>(res.body, (data) => {
    let j: any;
    try { j = JSON.parse(data); } catch { return { content: '', reasoning: '' }; }
    if (j?.error) throw new Error(j.error?.message ?? 'Provider error');
    const d = j?.choices?.[0]?.delta;
    return {
      content: toText(d?.content),
      reasoning: toText(d?.reasoning ?? d?.reasoning_content),
    };
  });
}