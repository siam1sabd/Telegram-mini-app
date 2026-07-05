/**
 * Telegram Mini App SDK loader and hook.
 * Loads the official Telegram WebApp script and exposes typed helpers.
 */
'use client'

import { useEffect, useState, useCallback } from 'react'

declare global {
  interface Window {
    Telegram?: {
      WebApp: TelegramWebApp
    }
  }
}

export interface TelegramUser {
  id: number
  first_name: string
  last_name?: string
  username?: string
  language_code?: string
  photo_url?: string
  is_premium?: boolean
}

export interface TelegramWebApp {
  initData: string
  initDataUnsafe: {
    user?: TelegramUser
    start_param?: string
    auth_date?: number
    hash?: string
  }
  version: string
  platform: string
  colorScheme: 'light' | 'dark'
  themeParams: Record<string, string>
  isExpanded: boolean
  viewportHeight: number
  viewportStableHeight: number
  headerColor: string
  backgroundColor: string
  BottomButton?: any
  MainButton: any
  BackButton: any
  HapticFeedback: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft') => void
    notificationOccurred: (type: 'error' | 'success' | 'warning') => void
    selectionChanged: () => void
  }
  showAlert: (message: string, cb?: () => void) => void
  showConfirm: (message: string, cb?: (ok: boolean) => void) => void
  showPopup: (params: any, cb?: (id: string) => void) => void
  ready: () => void
  expand: () => void
  close: () => void
  disableVerticalSwipes?: () => void
  enableVerticalSwipes?: () => void
  setHeaderColor: (color: string) => void
  setBackgroundColor: (color: string) => void
  onEvent: (event: string, cb: () => void) => void
  offEvent: (event: string, cb: () => void) => void
}

const SCRIPT_URL = 'https://telegram.org/js/telegram-web-app.js'

let loadPromise: Promise<TelegramWebApp | null> | null = null

export function loadTelegramSDK(): Promise<TelegramWebApp | null> {
  if (typeof window === 'undefined') return Promise.resolve(null)
  if (window.Telegram?.WebApp) return Promise.resolve(window.Telegram.WebApp)
  if (loadPromise) return loadPromise

  loadPromise = new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SCRIPT_URL}"]`
    )
    if (existing) {
      existing.addEventListener('load', () => resolve(window.Telegram?.WebApp ?? null))
      existing.addEventListener('error', () => resolve(null))
      return
    }
    const s = document.createElement('script')
    s.src = SCRIPT_URL
    s.async = true
    s.onload = () => resolve(window.Telegram?.WebApp ?? null)
    s.onerror = () => resolve(null)
    document.head.appendChild(s)
  })
  return loadPromise
}

export function useTelegram() {
  const [webApp, setWebApp] = useState<TelegramWebApp | null>(null)
  const [user, setUser] = useState<TelegramUser | null>(null)
  const [startParam, setStartParam] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let mounted = true
    loadTelegramSDK().then((wa) => {
      if (!mounted || !wa) {
        setReady(true)
        return
      }
      wa.ready()
      try { wa.expand() } catch {}
      setWebApp(wa)
      setUser(wa.initDataUnsafe?.user ?? null)
      setStartParam(wa.initDataUnsafe?.start_param ?? null)
      try {
        wa.setHeaderColor?.('#0F0F12')
        wa.setBackgroundColor?.('#0F0F12')
      } catch {}
      setReady(true)
    })
    return () => {
      mounted = false
    }
  }, [])

  const haptic = useCallback(
    (style: 'light' | 'medium' | 'heavy' | 'rigid' | 'soft' = 'light') => {
      try { webApp?.HapticFeedback?.impactOccurred?.(style) } catch {}
    },
    [webApp]
  )
  const notify = useCallback(
    (type: 'error' | 'success' | 'warning') => {
      try { webApp?.HapticFeedback?.notificationOccurred?.(type) } catch {}
    },
    [webApp]
  )

  return { webApp, user, startParam, ready, haptic, notify }
}
