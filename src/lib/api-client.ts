/** Tiny fetcher with auth header injection (Telegram initData). */
import { useEffect, useState, useCallback } from 'react'

const STORAGE_KEY = 'cv_init_data'

export function getStoredInitData(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(STORAGE_KEY)
}

export function setStoredInitData(v: string) {
  if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, v)
}

export async function apiFetch<T = any>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  const initData = getStoredInitData()
  const headers = new Headers(opts.headers)
  if (initData) {
    headers.set('x-tg-initdata', initData)
    headers.set('authorization', `Bearer ${initData}`)
  }
  if (opts.body && !headers.has('content-type')) {
    headers.set('content-type', 'application/json')
  }
  const res = await fetch(path, { ...opts, headers })
  const data = await res.json().catch(() => ({ ok: false }))
  return data as T
}

/** Convenience hook: GET an API path with auto-refetch capability */
export function useApi<T = any>(path: string | null, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(!!path)
  const [error, setError] = useState<string | null>(null)
  const refetch = useCallback(async () => {
    if (!path) { setData(null); setLoading(false); return }
    setLoading(true); setError(null)
    try {
      const r = await apiFetch<T>(path)
      setData(r)
    } catch (e: any) {
      setError(e?.message ?? 'fetch-error')
    } finally {
      setLoading(false)
    }
  }, [path])
  useEffect(() => { refetch() }, [refetch])
  return { data, loading, error, refetch }
}

/** Spring presets reused across motion variants */
export const springs = {
  soft: { type: 'spring', stiffness: 380, damping: 30, mass: 0.9 } as const,
  snappy: { type: 'spring', stiffness: 520, damping: 34, mass: 0.8 } as const,
  bouncy: { type: 'spring', stiffness: 300, damping: 18, mass: 0.7 } as const,
  gentle: { type: 'spring', stiffness: 220, damping: 26, mass: 1 } as const,
} as const
