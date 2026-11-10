export const SITE_URL = (process.env.NEXT_PUBLIC_APP_URL || 'https://rcsfabrics.netlify.app').replace(/\/$/, '');

// Server-side API base (absolute). Falls back to the Render backend.
export const SERVER_API_URL = (
  process.env.API_URL ||
  (process.env.NEXT_PUBLIC_API_URL?.startsWith('http') ? process.env.NEXT_PUBLIC_API_URL : '') ||
  'https://rcsfabrics-backend.onrender.com/api'
).replace(/\/$/, '');

/** fetch JSON from the API with a short timeout so a sleeping backend never blocks a page. */
export async function fetchApi<T = any>(path: string, timeoutMs = 4000, revalidate = 3600): Promise<T | null> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${SERVER_API_URL}/${path.replace(/^\//, '')}`, {
      signal: ctrl.signal,
      next: { revalidate },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}
