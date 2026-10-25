export const dynamic = 'force-dynamic';

const FALLBACK = [
  'Explain quantum computing in simple words',
  'Write a Python script to rename files in bulk',
  'Plan a perfect 3-day trip to Goa',
  'How does AI image generation actually work?',
];

export async function GET(req: Request) {
  const headers = req.headers;
  const fromCloudflare = (headers.get('cf-ipcountry') || '').toUpperCase();
  const fromVercel = (headers.get('x-vercel-ip-country') || '').toUpperCase();
  const fromQuery = (new URL(req.url).searchParams.get('geo') || '').toUpperCase();
  const geo = [fromCloudflare, fromVercel, fromQuery].find((g) => /^[A-Z]{2}$/.test(g)) || 'IN';

  try {
    const res = await fetch(`https://trends.google.com/trending/rss?geo=${geo}`, {
      cache: 'no-store',
      signal: AbortSignal.timeout(8000),
    });
    const xml = await res.text();
    const titles = [...xml.matchAll(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/gs)]
      .map((m) => m[1].trim())
      .filter((t) => t && !/trending now/i.test(t))
      .slice(0, 6);
    if (!titles.length) throw new Error('empty');
    return Response.json({ topics: titles, geo });
  } catch {
    return Response.json({ topics: FALLBACK, geo });
  }
}