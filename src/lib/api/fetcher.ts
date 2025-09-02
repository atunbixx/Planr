"use client"

import AuthClient from '@/lib/auth/client'

type FetcherOptions = RequestInit & {
  parseJson?: boolean
}

function isBrowser() {
  return typeof window !== 'undefined'
}

export async function apiFetch<T = any>(input: string, options: FetcherOptions = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  }

  // Inject auth token when available
  const token = AuthClient.getToken()
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(input, {
    ...options,
    headers,
  })

  // Handle auth/navigation globally on the client
  if (isBrowser() && res.status === 401) {
    window.location.href = '/signin'
    throw new Error('Unauthorized')
  }
  if (isBrowser() && res.status === 403) {
    try {
      const j = await res.clone().json()
      if (j?.error?.requiresOnboarding) {
        window.location.href = '/onboarding'
        throw new Error('Onboarding required')
      }
    } catch {}
  }

  const parseJson = options.parseJson !== false
  if (!parseJson) return (undefined as unknown as T)

  const json = await res.json().catch(() => undefined)
  if (!res.ok) {
    const msg = json?.error?.message || `Request failed with ${res.status}`
    const err: any = new Error(msg)
    if (json?.error?.details) err.details = json.error.details
    throw err
  }
  return json as T
}

export const api = {
  get: <T>(url: string, init?: FetcherOptions) => apiFetch<T>(url, { ...(init || {}), method: 'GET' }),
  post: <T>(url: string, body?: any, init?: FetcherOptions) => apiFetch<T>(url, { ...(init || {}), method: 'POST', body: JSON.stringify(body ?? {}) }),
  patch: <T>(url: string, body?: any, init?: FetcherOptions) => apiFetch<T>(url, { ...(init || {}), method: 'PATCH', body: JSON.stringify(body ?? {}) }),
  put: <T>(url: string, body?: any, init?: FetcherOptions) => apiFetch<T>(url, { ...(init || {}), method: 'PUT', body: JSON.stringify(body ?? {}) }),
  delete: <T>(url: string, init?: FetcherOptions) => apiFetch<T>(url, { ...(init || {}), method: 'DELETE' }),
}
