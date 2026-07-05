'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useState, useEffect } from 'react'
import { ArrowLeft, Coins, Play, Download, Lock, Sparkles, Check, Share2, Eye } from 'lucide-react'
import { apiFetch, springs } from '@/lib/api-client'
import { useAdsgram } from '@/lib/adsgram'

interface ContentDetail {
  id: string
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  imageUrl?: string | null
  metadata?: string | null
  pointCost: number
  tags?: string | null
  visibility: boolean
  createdAt: string
  category: { id: string; name: string; slug: string } | null
  alreadyUnlocked: boolean
}

interface ContentDetailProps {
  contentId: string
  onBack: () => void
  userPoints: number
  adsgramPlacementId: string
  adsgramEnabled: boolean
  requiredAdCount: number
  onPointsChanged: () => void
  haptic: (s?: any) => void
  notify: (t: 'error' | 'success' | 'warning') => void
}

export default function ContentDetailView({
  contentId,
  onBack,
  userPoints,
  adsgramPlacementId,
  adsgramEnabled,
  requiredAdCount,
  onPointsChanged,
  haptic,
  notify,
}: ContentDetailProps) {
  const [content, setContent] = useState<ContentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [accessMethod, setAccessMethod] = useState<'points' | 'ads' | null>(null)
  const [adsCompleted, setAdsCompleted] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [showShareTip, setShowShareTip] = useState(false)

  const adsgram = useAdsgram(adsgramEnabled && adsgramPlacementId ? adsgramPlacementId : null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    apiFetch<{ ok: boolean; content: ContentDetail }>(`/api/content/${contentId}`)
      .then((r) => {
        if (!alive) return
        if (r.ok && r.content) {
          setContent(r.content)
          if (r.content.alreadyUnlocked) {
            // Pre-fetch the download URL since already unlocked
            apiFetch<{ ok: boolean; downloadUrl?: string }>(
              `/api/content/${contentId}/download`,
              { method: 'POST', body: JSON.stringify({ method: 'points' }) }
            ).then((d) => {
              if (d.ok && d.downloadUrl) {
                setDownloadUrl(d.downloadUrl)
                setAccessMethod('points')
              }
            })
          }
        }
      })
      .finally(() => alive && setLoading(false))

    // Load ad progress
    apiFetch<{ ok: boolean; completed?: number; required?: number }>(
      `/api/ads/status?contentId=${contentId}`
    ).then((r) => {
      if (r.ok && typeof r.completed === 'number') setAdsCompleted(r.completed)
    })

    return () => { alive = false }
  }, [contentId])

  const canAfford = (userPoints ?? 0) >= (content?.pointCost ?? 4)
  const adsRemaining = Math.max(0, requiredAdCount - adsCompleted)

  const handleDownloadWithPoints = async () => {
    if (!content) return
    if (!canAfford) {
      notify('error')
      setError('Not enough points. Earn more via referrals or watch ads.')
      return
    }
    setBusy(true); setError(null); haptic('medium')
    try {
      const r = await apiFetch<{
        ok: boolean
        downloadUrl?: string
        error?: string
        pointsRemaining?: number
        accessMethod?: string
      }>(`/api/content/${content.id}/download`, {
        method: 'POST',
        body: JSON.stringify({ method: 'points' }),
      })
      if (r.ok && r.downloadUrl) {
        setDownloadUrl(r.downloadUrl)
        setAccessMethod((r.accessMethod as any) || 'points')
        notify('success')
        onPointsChanged()
      } else {
        notify('error')
        setError(r.error || 'Failed to unlock')
      }
    } finally {
      setBusy(false)
    }
  }

  const handleWatchAd = async () => {
    if (!content) return
    if (!adsgram.ready) {
      notify('error')
      setError('Ads not available right now. Please try again.')
      return
    }
    haptic('light')
    const rewarded = await adsgram.showAd()
    if (rewarded) {
      // Record on backend
      await apiFetch('/api/ads/track', {
        method: 'POST',
        body: JSON.stringify({ contentId: content.id, status: 'completed' }),
      })
      setAdsCompleted((n) => n + 1)
      notify('success')
    } else {
      notify('warning')
      setError('Ad was not completed. Watch the full ad to earn the reward.')
    }
  }

  const handleDownloadWithAds = async () => {
    if (!content) return
    if (adsCompleted < requiredAdCount) {
      notify('error')
      setError(`Watch ${requiredAdCount - adsCompleted} more ad(s) to unlock.`)
      return
    }
    setBusy(true); setError(null); haptic('medium')
    try {
      const r = await apiFetch<{
        ok: boolean
        downloadUrl?: string
        error?: string
      }>(`/api/content/${content.id}/download`, {
        method: 'POST',
        body: JSON.stringify({ method: 'ads' }),
      })
      if (r.ok && r.downloadUrl) {
        setDownloadUrl(r.downloadUrl)
        setAccessMethod('ads')
        notify('success')
      } else {
        notify('error')
        setError(r.error || 'Failed to unlock')
      }
    } finally {
      setBusy(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-4 pb-32 max-w-lg mx-auto">
        <div className="aspect-video rounded-2xl shimmer" style={{ background: 'var(--m3-surface-container)' }} />
      </div>
    )
  }

  if (!content) {
    return (
      <div className="px-4 pt-4 pb-32 max-w-lg mx-auto text-center opacity-70">
        <p>Content not found.</p>
        <button onClick={onBack} className="m3-button m3-button-tonal mt-4">Go back</button>
      </div>
    )
  }

  const tags = (content.tags || '').split(',').map((s) => s.trim()).filter(Boolean)

  return (
    <div className="px-0 pt-0 pb-32 max-w-lg mx-auto">
      {/* Hero image */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.snappy}
        className="relative w-full aspect-[4/3] overflow-hidden"
        style={{
          borderRadius: '0 0 var(--radius-m3-2xl) var(--radius-m3-2xl)',
          background: 'var(--m3-surface-container-high)',
        }}
      >
        {content.imageUrl || content.thumbnailUrl ? (
          <img
            src={content.imageUrl || content.thumbnailUrl || ''}
            alt={content.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center opacity-50">
            <Sparkles size={48} />
          </div>
        )}
        <button
          onClick={() => { haptic('light'); onBack() }}
          className="absolute top-3 left-3 w-10 h-10 flex items-center justify-center"
          style={{
            background: 'rgba(15,15,18,0.7)',
            color: 'var(--m3-on-surface)',
            borderRadius: 'var(--radius-m3-full)',
            backdropFilter: 'blur(8px)',
          }}
        >
          <ArrowLeft size={20} />
        </button>
        {content.category && (
          <div
            className="absolute top-3 right-3 px-3 py-1 text-xs font-medium"
            style={{
              background: 'rgba(15,15,18,0.7)',
              color: 'var(--m3-on-surface)',
              borderRadius: 'var(--radius-m3-full)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {content.category.name}
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.bouncy, delay: 0.08 }}
        className="px-4 mt-4"
      >
        <h1 className="text-2xl font-bold leading-tight mb-2">{content.title}</h1>

        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-xs">
          <span className="flex items-center gap-1 px-2.5 py-1" style={{ background: 'var(--m3-tertiary-container)', color: 'var(--m3-on-tertiary-container)', borderRadius: 'var(--radius-m3-full)' }}>
            <Coins size={12} /> {content.pointCost} pts
          </span>
          <span className="flex items-center gap-1 px-2.5 py-1" style={{ background: 'var(--m3-secondary-container)', color: 'var(--m3-on-secondary-container)', borderRadius: 'var(--radius-m3-full)' }}>
            <Eye size={12} /> {new Date(content.createdAt).toLocaleDateString()}
          </span>
          {content.alreadyUnlocked && (
            <span className="flex items-center gap-1 px-2.5 py-1" style={{ background: 'var(--m3-accent)', color: 'var(--m3-on-accent)', borderRadius: 'var(--radius-m3-full)' }}>
              <Check size={12} /> Unlocked
            </span>
          )}
        </div>

        {/* Description */}
        {content.description && (
          <p className="text-sm leading-relaxed opacity-85 mb-4">{content.description}</p>
        )}

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-5">
            {tags.map((t) => (
              <span key={t} className="m3-chip" style={{ cursor: 'default' }}>#{t}</span>
            ))}
          </div>
        )}

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 text-sm"
              style={{
                background: 'var(--m3-error-container)',
                color: 'var(--m3-on-error-container)',
                borderRadius: 'var(--radius-m3-md)',
              }}
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Download card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...springs.snappy, delay: 0.15 }}
          className="p-5 mb-3 m3-elevated"
          style={{
            background: 'var(--m3-surface-container-high)',
            borderRadius: 'var(--radius-m3-xl)',
          }}
        >
          {downloadUrl ? (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={springs.bouncy}
                className="w-16 h-16 mx-auto mb-3 flex items-center justify-center"
                style={{
                  background: 'var(--m3-accent)',
                  color: 'var(--m3-on-accent)',
                  borderRadius: 'var(--radius-m3-full)',
                  boxShadow: '0 0 24px rgba(181,240,168,0.45)',
                }}
              >
                <Check size={32} strokeWidth={3} />
              </motion.div>
              <p className="font-bold text-lg mb-1">Unlocked via {accessMethod}!</p>
              <p className="text-xs opacity-70 mb-4">Tap below to start your download.</p>
              <motion.a
                href={downloadUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => haptic('medium')}
                whileTap={{ scale: 0.97 }}
                whileHover={{ y: -2 }}
                animate={{ boxShadow: [
                  '0 8px 24px rgba(181,240,168,0.30), 0 0 0 0 rgba(181,240,168,0.50)',
                  '0 12px 32px rgba(181,240,168,0.45), 0 0 0 8px rgba(181,240,168,0.00)',
                  '0 8px 24px rgba(181,240,168,0.30), 0 0 0 0 rgba(181,240,168,0.00)',
                ] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                className="w-full flex items-center justify-center gap-2.5 font-bold text-lg py-4 px-6"
                style={{
                  background: 'linear-gradient(135deg, var(--m3-accent) 0%, #7DDB6E 100%)',
                  color: 'var(--m3-on-accent)',
                  borderRadius: 'var(--radius-m3-full)',
                  border: 'none',
                  minHeight: 56,
                }}
              >
                <Download size={22} strokeWidth={2.6} /> Download Now
              </motion.a>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Lock size={18} className="opacity-70" />
                  <span className="font-semibold text-sm">Unlock to download</span>
                </div>
                <span className="text-xs opacity-65">{userPoints} pts available</span>
              </div>

              {/* Option 1: Points — primary CTA */}
              <motion.button
                onClick={handleDownloadWithPoints}
                disabled={busy || !canAfford}
                whileTap={{ scale: canAfford ? 0.97 : 1 }}
                whileHover={canAfford ? { y: -2 } : undefined}
                className="w-full flex items-center justify-center gap-2.5 font-bold text-base py-3.5 px-5 mb-2 disabled:opacity-50"
                style={{
                  background: canAfford
                    ? 'linear-gradient(135deg, var(--m3-primary) 0%, #B89CFF 100%)'
                    : 'var(--m3-surface-container-high)',
                  color: canAfford ? 'var(--m3-on-primary)' : 'var(--m3-on-surface-variant)',
                  borderRadius: 'var(--radius-m3-full)',
                  border: 'none',
                  boxShadow: canAfford
                    ? '0 6px 18px rgba(217,194,255,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset'
                    : 'none',
                  minHeight: 52,
                }}
              >
                <Coins size={20} strokeWidth={2.5} />
                {canAfford
                  ? `Spend ${content.pointCost} Points to Download`
                  : `Need ${content.pointCost - userPoints} more pts`}
              </motion.button>

              {/* Option 2: Ads */}
              {adsgramEnabled && adsgramPlacementId ? (
                <>
                  <div
                    className="flex items-center gap-2 my-3 text-xs opacity-60"
                  >
                    <div className="flex-1 h-px" style={{ background: 'var(--m3-outline-variant)' }} />
                    <span>OR</span>
                    <div className="flex-1 h-px" style={{ background: 'var(--m3-outline-variant)' }} />
                  </div>

                  <div
                    className="p-3 mb-3"
                    style={{
                      background: 'var(--m3-surface-container-highest)',
                      borderRadius: 'var(--radius-m3-md)',
                    }}
                  >
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="opacity-80">Watch {requiredAdCount} ads to unlock free</span>
                      <span className="font-semibold">{adsCompleted}/{requiredAdCount}</span>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden"
                      style={{ background: 'var(--m3-surface-container)', borderRadius: 'var(--radius-m3-full)' }}
                    >
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, (adsCompleted / requiredAdCount) * 100)}%` }}
                        transition={springs.snappy}
                        className="h-full"
                        style={{ background: 'var(--m3-tertiary)' }}
                      />
                    </div>
                  </div>

                  {adsRemaining > 0 ? (
                    <motion.button
                      onClick={handleWatchAd}
                      disabled={busy || adsgram.showing}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ y: -1 }}
                      className="w-full flex items-center justify-center gap-2.5 font-bold text-base py-3.5 px-5"
                      style={{
                        background: 'var(--m3-tertiary)',
                        color: 'var(--m3-on-tertiary)',
                        borderRadius: 'var(--radius-m3-full)',
                        border: 'none',
                        boxShadow: '0 6px 18px rgba(255,180,166,0.30)',
                        minHeight: 52,
                      }}
                    >
                      <Play size={20} strokeWidth={2.5} fill="currentColor" />
                      {adsgram.showing
                        ? 'Ad playing...'
                        : `▶ Watch Ad (${adsRemaining} left) — Free Unlock`}
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={handleDownloadWithAds}
                      disabled={busy}
                      whileTap={{ scale: 0.97 }}
                      whileHover={{ y: -2 }}
                      animate={{ boxShadow: [
                        '0 8px 24px rgba(181,240,168,0.30), 0 0 0 0 rgba(181,240,168,0.50)',
                        '0 12px 32px rgba(181,240,168,0.45), 0 0 0 8px rgba(181,240,168,0.00)',
                        '0 8px 24px rgba(181,240,168,0.30), 0 0 0 0 rgba(181,240,168,0.00)',
                      ] }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      className="w-full flex items-center justify-center gap-2.5 font-bold text-lg py-4 px-6"
                      style={{
                        background: 'linear-gradient(135deg, var(--m3-accent) 0%, #7DDB6E 100%)',
                        color: 'var(--m3-on-accent)',
                        borderRadius: 'var(--radius-m3-full)',
                        border: 'none',
                        minHeight: 56,
                      }}
                    >
                      <Download size={22} strokeWidth={2.6} /> Claim Free Download
                    </motion.button>
                  )}
                </>
              ) : (
                <p className="text-xs opacity-60 text-center mt-3">
                  Ad-supported downloads are currently disabled by the admin.
                </p>
              )}
            </>
          )}
        </motion.div>

        {/* Share */}
        <motion.button
          onClick={() => {
            haptic('light')
            if (typeof navigator !== 'undefined' && navigator.share) {
              navigator.share({ title: content.title, url: window.location.href }).catch(() => {})
            } else {
              try {
                navigator.clipboard?.writeText(window.location.href)
                setShowShareTip(true)
                setTimeout(() => setShowShareTip(false), 2000)
              } catch {}
            }
          }}
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -1 }}
          className="w-full flex items-center justify-center gap-2 font-semibold text-sm py-3 px-4 mt-1"
          style={{
            background: showShareTip ? 'var(--m3-accent)' : 'var(--m3-surface-container)',
            color: showShareTip ? 'var(--m3-on-accent)' : 'var(--m3-on-surface)',
            borderRadius: 'var(--radius-m3-full)',
            border: '1px solid var(--m3-outline-variant)',
            minHeight: 48,
          }}
        >
          <Share2 size={18} strokeWidth={2.4} /> {showShareTip ? '✓ Link copied!' : 'Share this content'}
        </motion.button>
      </motion.div>
    </div>
  )
}
