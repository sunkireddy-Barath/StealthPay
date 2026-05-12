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

  return fetch(apiUrl(path), { ...options, headers })
}
