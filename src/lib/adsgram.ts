/**
 * AdsGram SDK loader + hook.
 * Docs: https://docs.adsgram.ai/
 * Loads the integration script and exposes showAd() with reward callback.
 */
'use client'

import { useEffect, useState, useCallback, useRef } from 'react'

declare global {
  interface Window {
    Adsgram?: {
      init: (options: {
        blockId: string
        onReward?: (user_id?: string) => void
        onError?: (error: { description: string; code?: string }) => void
        onRewardedVideo?: any
      }) => {
        show: () => Promise<void>
        destroy?: () => void
      }
    }
  }
}

const DEFAULT_SCRIPT = 'https://sad.adsgram.ai/js/integration2.js'

let loadPromise: Promise<boolean> | null = null

export function loadAdsgramScript(url: string = DEFAULT_SCRIPT): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false)
  if (window.Adsgram) return Promise.resolve(true)
  if (loadPromise) return loadPromise
  loadPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${url}"]`)
    if (existing) {
      existing.addEventListener('load', () => resolve(true))
      existing.addEventListener('error', () => resolve(false))
      return
    }
    const s = document.createElement('script')
    s.src = url
    s.async = true
    s.onload = () => resolve(true)
    s.onerror = () => resolve(false)
    document.head.appendChild(s)
  })
  return loadPromise
}

export function useAdsgram(blockId: string | null, scriptUrl?: string) {
  const [ready, setReady] = useState(false)
  const [showing, setShowing] = useState(false)
  const sdkRef = useRef<ReturnType<NonNullable<Window['Adsgram']>['init']> | null>(null)

  useEffect(() => {
    if (!blockId) {
      // No-op effect when AdsGram is disabled
      return
    }
    let mounted = true
    loadAdsgramScript(scriptUrl).then((ok) => {
      if (!mounted || !ok || !window.Adsgram) {
        return
      }
      try {
        sdkRef.current = window.Adsgram.init({ blockId })
        if (mounted) setReady(true)
      } catch {
        /* init failed */
      }
    })
    return () => {
      mounted = false
      try { sdkRef.current?.destroy?.() } catch {}
      sdkRef.current = null
    }
  }, [blockId, scriptUrl])

  const showAd = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!sdkRef.current) {
        resolve(false)
        return
      }
      setShowing(true)
      // Re-init with reward handlers per call so we can resolve promise
      try {
        if (!window.Adsgram) { resolve(false); setShowing(false); return }
        const instance = window.Adsgram.init({
          blockId: blockId!,
          onReward: () => resolve(true),
          onError: () => resolve(false),
        })
        instance.show().catch(() => resolve(false)).finally(() => setShowing(false))
      } catch {
        setShowing(false)
        resolve(false)
      }
    })
  }, [blockId])

  return { ready, showing, showAd }
}
