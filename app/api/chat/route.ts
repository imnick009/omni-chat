import { PROVIDERS } from '@/lib/providers';

type Msg = { role: string; content: any };

export const dynamic = 'force-dynamic';

const SSE_HEADERS = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache, no-transform',
  Connection: 'keep-alive',
  'X-Accel-Buffering': 'no',
};

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: { message } }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function toText(v: any): string {
  if (typeof v === 'string') return v;
  if (Array.isArray(v)) {
    return v.map((p) => (typeof p === 'string' ? p : typeof p?.text === 'string' ? p.text : '')).join('');
  }
  if (v && typeof v === 'object' && typeof v.text === 'string') return v.text;
  return '';
}

export async function POST(req: Request) {
  let body: any;
  try { body = await req.json(); } catch { return jsonError('Invalid JSON body', 400); }

  const { providerId, apiKey, messages } = body;
  const model: string = typeof body.model === 'string' ? body.model.trim() : '';
  const baseRaw: string = typeof body.baseURL === 'string' ? body.baseURL.trim() : '';
  const p = PROVIDERS[providerId];
  const base = baseRaw || p?.baseURL || '';
  const api: 'openai' | 'anthropic' =
    body.apiType === 'anthropic' ? 'anthropic' : baseRaw ? 'openai' : p?.api ?? 'openai';

  if (!base) return jsonError('Missing Base URL', 400);
  if (!apiKey?.trim()) return jsonError('Missing API key', 400);
  if (!model) return jsonError('Missing model ID', 400);
  if (!Array.isArray(messages) || !messages.length) return jsonError('Empty messages', 400);

  const url = `${base.replace(/\/$/, '')}/${api === 'anthropic' ? 'messages' : 'chat/completions'}`;

  const system = messages
    .filter((m: Msg) => m.role === 'system')
    .map((m: Msg) => (typeof m.content === 'string' ? m.content : ''))
    .join('\n');
  const rest = messages.filter((m: Msg) => m.role !== 'system');

  const toParts = (content: any): any =>
    typeof content === 'string'
      ? content
      : (content as any[]).map((part) => {
          if (part?.type === 'text') return { type: 'text', text: part.text ?? '' };
          if (part?.type === 'image_url') {
            const match = String(part.image_url?.url ?? '').match(/^data:([^;]+);base64,(.+)$/);
            if (match) return { type: 'image', source: { type: 'base64', media_type: match[1], data: match[2] } };
          }
          return { type: 'text', text: JSON.stringify(part) };
        });

  const payload =
    api === 'anthropic'
      ? {
          model,
          max_tokens: 4096,
          system: system || undefined,
          messages: rest.map((m: Msg) => ({ role: m.role, content: toParts(m.content) })),
          stream: true,
        }
      : { model, messages, stream: true };

  let upstream: Response;
  try {
    upstream = await fetch(url, {
      method: 'POST',
      headers:
        api === 'anthropic'
          ? { 'Content-Type': 'application/json', 'x-api-key': apiKey.trim(), 'anthropic-version': '2023-06-01' }
          : { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey.trim()}` },
      body: JSON.stringify(payload),
      signal: req.signal,
    });
  } catch (e: any) {
    return jsonError(`Network error: ${e?.message ?? String(e)}`, 502);
  }

  if (!upstream.ok) {
    const text = await upstream.text();
    return jsonError(`HTTP ${upstream.status}: ${text.slice(0, 600)}`, upstream.status);
  }

  const ct = upstream.headers.get('content-type') ?? '';
  if (!ct.includes('text/event-stream')) {
    try {
      const j = await upstream.json();
      if (j?.error) return jsonError(JSON.stringify(j.error), 502);
      const content = toText(j?.choices?.[0]?.message?.content ?? j?.content);
      return new Response(`data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\ndata: [DONE]\n\n`, { headers: SSE_HEADERS });
    } catch (e: any) {
      return jsonError(`Invalid response: ${e?.message}`, 502);
    }
  }

  return new Response(toOpenAISSE(upstream.body!, api === 'anthropic'), { headers: SSE_HEADERS });
}

function toOpenAISSE(src: ReadableStream<Uint8Array>, anthropic: boolean) {
  const dec = new TextDecoder();
  const enc = new TextEncoder();
  let buf = '';
  let sentDone = false;
  type C = TransformStreamDefaultController<Uint8Array>;
  const send = (c: C, payload: unknown) => c.enqueue(enc.encode(`data: ${JSON.stringify(payload)}\n\n`));
  const finish = (c: C) => { if (!sentDone) { sentDone = true; c.enqueue(enc.encode('data: [DONE]\n\n')); } };

  const handle = (line: string, c: C) => {
    const t = line.trim();
    if (!t.startsWith('data:')) return;
    const data = t.slice(5).trim();
    if (data === '[DONE]') return finish(c);
    let j: any;
    try { j = JSON.parse(data); } catch { return; }
    if (j.error) { send(c, { error: { message: j.error.message ?? JSON.stringify(j.error) } }); return finish(c); }
    if (anthropic) {
      if (j.type === 'content_block_delta') {
        if (j.delta?.type === 'text_delta') send(c, { choices: [{ delta: { content: toText(j.delta.text) } }] });
        else if (j.delta?.type === 'thinking_delta') send(c, { choices: [{ delta: { reasoning: toText(j.delta.thinking) } }] });
      } else if (j.type === 'message_stop') finish(c);
    } else {
      const delta = j.choices?.[0]?.delta;
      if (delta) {
        const out: Record<string, string> = {};
        const content = toText(delta.content);
        if (content) out.content = content;
        const reasoning = toText(delta.reasoning_content ?? delta.reasoning);
        if (reasoning) out.reasoning = reasoning;
        if (Object.keys(out).length) send(c, { choices: [{ delta: out }] });
      }
      if (j.choices?.[0]?.finish_reason) finish(c);
    }
  };

  return src.pipeThrough(
    new TransformStream<Uint8Array, Uint8Array>({
      transform(chunk, controller) {
        buf += dec.decode(chunk, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() ?? '';
        for (const line of lines) handle(line, controller);
      },
      flush(controller) {
        buf += dec.decode();
        if (buf.trim()) handle(buf, controller);
        finish(controller);
      },
    })
  );
}