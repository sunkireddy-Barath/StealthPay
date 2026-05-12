/**
 * In development: VITE_API_URL is empty → Vite proxy forwards /api/* to localhost:5000
 * In production:  VITE_API_URL=https://stealthpay-backend.onrender.com
 */
const BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export function apiUrl(path: string): string {
  return `${BASE}${path}`
}

export async function apiFetch(path: string, options?: RequestInit): Promise<Response> {
  const token = localStorage.getItem('stealthpay_token')
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options?.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    return await fetch(apiUrl(path), { ...options, headers })
  } catch {
    // Return a fake 503 response so callers get res.ok === false instead of an unhandled throw
    return new Response(JSON.stringify({ error: 'Backend offline — run: npm run start-backend' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
