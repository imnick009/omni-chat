export async function* parseSSE<T>(
  body: ReadableStream<Uint8Array>,
  extract: (data: string) => T
): AsyncGenerator<T> {
  const reader = body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  let stopped = false;

  function* handle(line: string): Generator<T> {
    const t = line.trim();
    if (!t.startsWith('data:')) return;
    const data = t.slice(5).trim();
    if (!data) return;
    if (data === '[DONE]') { stopped = true; return; }
    yield extract(data);
  }

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const lines = buf.split('\n');
      buf = lines.pop() ?? '';
      for (const line of lines) {
        if (stopped) return;
        yield* handle(line);
      }
    }
    buf += dec.decode();
    if (!stopped && buf.trim()) yield* handle(buf);
  } finally {
    try { await reader.cancel(); } catch { }
    reader.releaseLock();
  }
}