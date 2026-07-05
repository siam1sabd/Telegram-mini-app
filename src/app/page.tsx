'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTelegram } from '@/lib/telegram'
import {
  getStoredInitData,
  setStoredInitData,
  apiFetch,
  springs,
} from '@/lib/api-client'
import AgeGate, { ageConfirmedLocally } from '@/components/age-gate'
import BottomNav, { type Tab } from '@/components/bottom-nav'
import HomeView from '@/components/home-view'
import ProfileView from '@/components/profile-view'
import ContentDetailView from '@/components/content-detail-view'
import AdminPanel from '@/components/admin-panel'
import { Sparkles, Shield } from 'lucide-react'

type View =
  | { name: 'home' }
  | { name: 'profile' }
  | { name: 'admin' }
  | { name: 'content'; id: string }

export default function Home() {
  const { webApp, user, startParam, ready, haptic, notify } = useTelegram()
  const [initData, setInitData] = useState<string>('')
  const [authed, setAuthed] = useState(false)
  const [ageConfirmed, setAgeConfirmed] = useState(false)
  const [showAgeGate, setShowAgeGate] = useState(false)
  const [view, setView] = useState<View>({ name: 'home' })
  const [userPoints, setUserPoints] = useState(0)
  const [settings, setSettings] = useState<any>(null)
  const [bootError, setBootError] = useState<string | null>(null)
  const [bootStep, setBootStep] = useState<'init' | 'auth' | 'ready'>('init')
  const tapCountRef = useRef(0)
  const tapTimerRef = useRef<any>(null)

  // 1. Initialize: store initData from Telegram WebApp SDK
  useEffect(() => {
    if (!ready) return
    let storedInit = getStoredInitData()

    // If Telegram provided initData in the SDK, refresh stored value
    if (webApp?.initData) {
      storedInit = webApp.initData
      setStoredInitData(storedInit)
    }

    if (!storedInit) {
      // Dev fallback: synthesize a fake initData so the app is browsable in preview
      const fakeUser = {
        id: 999999999,
        first_name: 'Preview',
        last_name: 'User',
        username: 'preview_user',
        auth_date: Math.floor(Date.now() / 1000),
      }
      const fakeInit = `user=${encodeURIComponent(JSON.stringify(fakeUser))}&auth_date=${fakeUser.auth_date}`
      setStoredInitData(fakeInit)
      storedInit = fakeInit
    }

    setInitData(storedInit)
    setBootStep('auth')
  }, [ready, webApp])

  // 2. Authenticate against backend (creates user, applies bonus)
  useEffect(() => {
    if (!initData || authed) return
    apiFetch<{ ok: boolean; user?: any; settings?: any; dev?: boolean }>(
      '/api/users/me'
    ).then((r) => {
      if (r.ok && r.user) {
        setAuthed(true)
        setUserPoints(r.user.points ?? 0)
        setSettings(r.settings)
        setBootStep('ready')

        // If user hasn't confirmed age on backend, show gate
        if (!r.user.ageConfirmed && !ageConfirmedLocally()) {
          setShowAgeGate(true)
        } else {
          setAgeConfirmed(true)
        }
      } else {
        // Try once more — first call creates the user, second returns fresh data
        apiFetch<{ ok: boolean; user?: any; settings?: any }>('/api/users/me').then((r2) => {
          if (r2.ok && r2.user) {
            setAuthed(true)
            setUserPoints(r2.user.points ?? 0)
            setSettings(r2.settings)
            setBootStep('ready')
            if (!r2.user.ageConfirmed && !ageConfirmedLocally()) {
              setShowAgeGate(true)
            } else {
              setAgeConfirmed(true)
            }
          } else {
            setBootError('Authentication failed. Please reopen from Telegram.')
          }
        })
      }
    }).catch((e) => {
      setBootError(e?.message || 'Network error during auth')
    })
  }, [initData, authed])

  // 3. Confirm age on backend when user accepts
  const handleAgeConfirm = useCallback(async () => {
    setAgeConfirmed(true)
    await apiFetch('/api/users/age-confirm', { method: 'POST' }).catch(() => {})
  }, [])

  // 4. Refresh user points (used after download)
  const refreshPoints = useCallback(async () => {
    const r = await apiFetch<{ ok: boolean; user?: any }>('/api/users/me')
    if (r.ok && r.user) {
      setUserPoints(r.user.points ?? 0)
      setSettings(r.settings)
    }
  }, [])

  // 5. Hidden admin access: tap the logo 5 times within 3 seconds
  const handleLogoTap = () => {
    tapCountRef.current += 1
    clearTimeout(tapTimerRef.current)
    tapTimerRef.current = setTimeout(() => { tapCountRef.current = 0 }, 3000)
    if (tapCountRef.current >= 5) {
      tapCountRef.current = 0
      haptic('medium')
      setView({ name: 'admin' })
    }
  }

  // Also support ?admin=1 query param for direct admin access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('admin') === '1') {
        setView({ name: 'admin' })
      }
    }
  }, [])

  // Boot screen
  if (bootError || bootStep !== 'ready') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={springs.bouncy}
            className="w-20 h-20 mx-auto mb-4 flex items-center justify-center"
            style={{
              background: 'var(--m3-primary)',
              color: 'var(--m3-on-primary)',
              borderRadius: 'var(--radius-m3-2xl)',
              boxShadow: '0 8px 24px rgba(217,194,255,0.25)',
            }}
          >
            <Sparkles size={36} />
          </motion.div>
          {bootError ? (
            <>
              <p className="text-sm font-semibold mb-1" style={{ color: 'var(--m3-error)' }}>
                Something went wrong
              </p>
              <p className="text-xs opacity-70 mb-4 max-w-xs">{bootError}</p>
              <button
                onClick={() => location.reload()}
                className="m3-button m3-button-filled"
              >
                Retry
              </button>
            </>
          ) : (
            <motion.p
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-sm opacity-70"
            >
              Loading your vault...
            </motion.p>
          )}
        </div>
      </div>
    )
  }

  // Admin view (no bottom nav, no age gate)
  if (view.name === 'admin') {
    return (
      <div className="min-h-screen">
        <div className="fixed top-3 left-3 z-50">
          <button
            onClick={() => { haptic('light'); setView({ name: 'home' }) }}
            className="m3-button m3-button-text text-xs"
            style={{ background: 'var(--m3-surface-container-high)' }}
          >
            ← Back to app
          </button>
        </div>
        <AdminPanel />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <AgeGate onConfirm={handleAgeConfirm} forceShow={showAgeGate} />

      {/* Hidden admin access: tap logo 5x */}
      <button
        onClick={handleLogoTap}
        aria-label="Logo"
        className="fixed top-2 right-2 z-30 p-1 opacity-30 hover:opacity-60"
        style={{ background: 'transparent' }}
      >
        <Shield size={14} />
      </button>

      <AnimatePresence mode="wait">
        <motion.div
          key={view.name + (view.name === 'content' ? view.id : '')}
          initial={{ opacity: 0, x: view.name === 'content' ? 30 : 0, y: view.name === 'content' ? 0 : 8 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: view.name === 'content' ? -30 : 0, y: 0 }}
          transition={springs.snappy}
        >
          {view.name === 'home' && (
            <HomeView
              onOpenContent={(id) => { haptic('light'); setView({ name: 'content', id }) }}
              siteTitle={settings?.siteTitle || 'Content Vault'}
            />
          )}
          {view.name === 'profile' && (
            <ProfileView
              onPointsChanged={refreshPoints}
              haptic={haptic}
              notify={notify}
            />
          )}
          {view.name === 'content' && (
            <ContentDetailView
              contentId={view.id}
              onBack={() => { haptic('light'); setView({ name: 'home' }) }}
              userPoints={userPoints}
              adsgramPlacementId={settings?.adsgramPlacementId || ''}
              adsgramEnabled={settings?.adsgramEnabled ?? false}
              requiredAdCount={settings?.requiredAdCount ?? 2}
              onPointsChanged={refreshPoints}
              haptic={haptic}
              notify={notify}
            />
          )}
        </motion.div>
      </AnimatePresence>

      {/* Bottom navigation (hidden on content detail view for immersive UX) */}
      {view.name !== 'content' && (
        <BottomNav
          active={view.name as Tab}
          onChange={(t) => {
            haptic('light')
            setView({ name: t })
          }}
          showAdmin={false}
        />
      )}
    </div>
  )
}
