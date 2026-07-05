'use client'

import { motion } from 'framer-motion'
import { useApi, apiFetch, springs } from '@/lib/api-client'
import { useState, useEffect } from 'react'
import { Coins, Gift, Users, Calendar, Download, Eye, Link as LinkIcon, Check, Copy, Award, TrendingUp } from 'lucide-react'

interface ProfileData {
  ok: boolean
  user: {
    id: string
    telegramId: string
    username: string | null
    firstName: string | null
    lastName: string | null
    photoUrl: string | null
    points: number
    joinedAt: string
    referralCode: string
    ageConfirmed: boolean
    bonusGranted: boolean
  }
  stats: {
    downloads: number
    adViews: number
    referralCount: number
    referralPoints: number
  }
  settings: {
    downloadPointCost: number
    requiredAdCount: number
    siteTitle: string
  }
  dev?: boolean
}

interface ProfileViewProps {
  onPointsChanged?: () => void
  haptic: (s?: any) => void
  notify: (t: 'error' | 'success' | 'warning') => void
}

export default function ProfileView({ haptic, notify }: ProfileViewProps) {
  const { data, loading, refetch } = useApi<ProfileData>('/api/users/me')
  const [copied, setCopied] = useState(false)
  const [refLink, setRefLink] = useState('')

  // Fetch referral link on mount
  useEffect(() => {
    apiFetch<{ ok: boolean; link?: string }>('/api/users/referral-link').then((r) => {
      if (r.ok && r.link) setRefLink(r.link)
    })
  }, [])

  if (loading || !data) {
    return (
      <div className="px-4 pt-4 pb-32 max-w-lg mx-auto">
        <div className="h-32 rounded-2xl shimmer" style={{ background: 'var(--m3-surface-container)' }} />
      </div>
    )
  }

  const u = data.user
  const displayName = [u.firstName, u.lastName].filter(Boolean).join(' ') || u.username || `User #${u.telegramId}`

  const handleCopy = () => {
    if (!refLink) return
    haptic('light')
    try {
      navigator.clipboard?.writeText(refLink)
      setCopied(true)
      notify('success')
      setTimeout(() => setCopied(false), 2000)
    } catch {}
  }

  const handleShare = () => {
    if (!refLink) return
    haptic('light')
    if (typeof navigator !== 'undefined' && navigator.share) {
      navigator
        .share({
          title: 'Join me on Content Vault!',
          text: 'Use my referral link to get 20 bonus points instantly:',
          url: refLink,
        })
        .catch(() => {})
    } else {
      handleCopy()
    }
  }

  return (
    <div className="px-4 pt-6 pb-32 max-w-lg mx-auto">
      {/* Header card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.snappy}
        className="p-5 mb-4 m3-elevated relative overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, var(--m3-primary-container) 0%, var(--m3-surface-container-high) 100%)',
          borderRadius: 'var(--radius-m3-2xl)',
        }}
      >
        <div className="flex items-center gap-4 mb-4 relative z-10">
          {u.photoUrl ? (
            <img
              src={u.photoUrl}
              alt={displayName}
              className="w-16 h-16 object-cover"
              style={{ borderRadius: 'var(--radius-m3-full)', border: '2px solid var(--m3-primary)' }}
            />
          ) : (
            <div
              className="w-16 h-16 flex items-center justify-center text-2xl font-bold"
              style={{
                background: 'var(--m3-primary)',
                color: 'var(--m3-on-primary)',
                borderRadius: 'var(--radius-m3-full)',
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold truncate">{displayName}</h1>
            <p className="text-xs opacity-70 truncate">
              @{u.username || 'unknown'} · ID {u.telegramId}
            </p>
            <div
              className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 text-xs font-semibold"
              style={{
                background: 'var(--m3-accent)',
                color: 'var(--m3-on-accent)',
                borderRadius: 'var(--radius-m3-full)',
              }}
            >
              <Calendar size={11} />
              Joined {new Date(u.joinedAt).toLocaleDateString()}
            </div>
          </div>
        </div>

        {/* Points hero */}
        <div
          className="flex items-center justify-between p-4"
          style={{
            background: 'var(--m3-surface-container-lowest)',
            borderRadius: 'var(--radius-m3-xl)',
          }}
        >
          <div>
            <p className="text-xs opacity-70 mb-0.5 flex items-center gap-1">
              <Coins size={11} /> Available Points
            </p>
            <p className="text-3xl font-bold" style={{ color: 'var(--m3-tertiary)' }}>
              {u.points}
            </p>
          </div>
          {u.bonusGranted && (
            <div className="text-right">
              <p className="text-xs opacity-70 mb-0.5 flex items-center gap-1 justify-end">
                <Gift size={11} /> Welcome Bonus
              </p>
              <p className="text-lg font-semibold" style={{ color: 'var(--m3-accent)' }}>
                +20
              </p>
            </div>
          )}
        </div>
      </motion.div>

      {/* Stats grid */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.snappy, delay: 0.05 }}
        className="grid grid-cols-3 gap-2 mb-4"
      >
        {[
          { icon: Download, label: 'Downloads', value: data.stats.downloads, color: 'var(--m3-primary)' },
          { icon: Eye, label: 'Ads Watched', value: data.stats.adViews, color: 'var(--m3-tertiary)' },
          { icon: Users, label: 'Referrals', value: data.stats.referralCount, color: 'var(--m3-accent)' },
        ].map((s, i) => {
          const Icon = s.icon
          return (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ ...springs.bouncy, delay: 0.1 + i * 0.05 }}
              whileTap={{ scale: 0.96 }}
              className="p-3 text-center"
              style={{
                background: 'var(--m3-surface-container)',
                borderRadius: 'var(--radius-m3-lg)',
              }}
            >
              <Icon size={18} className="mx-auto mb-1" style={{ color: s.color }} />
              <p className="text-xl font-bold">{s.value}</p>
              <p className="text-[10px] opacity-65">{s.label}</p>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Referral card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.snappy, delay: 0.1 }}
        className="p-4 mb-4 m3-card"
      >
        <div className="flex items-center gap-2 mb-2">
          <div
            className="w-9 h-9 flex items-center justify-center"
            style={{
              background: 'var(--m3-secondary-container)',
              color: 'var(--m3-on-secondary-container)',
              borderRadius: 'var(--radius-m3-md)',
            }}
          >
            <Gift size={18} />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Invite friends, earn 30 pts</h3>
            <p className="text-xs opacity-65">Get 30 points for each friend who joins.</p>
          </div>
          <span
            className="text-xs px-2 py-1 font-semibold"
            style={{
              background: 'var(--m3-accent)',
              color: 'var(--m3-on-accent)',
              borderRadius: 'var(--radius-m3-full)',
            }}
          >
            +{data.stats.referralPoints}
          </span>
        </div>

        <div
          className="flex items-center gap-2 p-3 mb-3"
          style={{
            background: 'var(--m3-surface-container-low)',
            borderRadius: 'var(--radius-m3-md)',
            border: '1px solid var(--m3-outline-variant)',
          }}
        >
          <LinkIcon size={16} className="opacity-70 flex-shrink-0" />
          <input
            readOnly
            value={refLink || 'Loading...'}
            className="flex-1 bg-transparent text-xs outline-none truncate font-mono"
            style={{ color: 'var(--m3-on-surface)' }}
          />
          <button
            onClick={handleCopy}
            className="p-2 flex items-center gap-1.5 text-xs font-semibold"
            style={{
              background: copied ? 'var(--m3-accent)' : 'var(--m3-surface-container-high)',
              color: copied ? 'var(--m3-on-accent)' : 'var(--m3-on-surface)',
              borderRadius: 'var(--radius-m3-sm)',
              minWidth: 44,
              minHeight: 36,
              justifyContent: 'center',
            }}
          >
            {copied ? <><Check size={14} /> Copied</> : <Copy size={14} />}
          </button>
        </div>

        <motion.button
          whileTap={{ scale: 0.97 }}
          whileHover={{ y: -1 }}
          onClick={handleShare}
          className="w-full flex items-center justify-center gap-2 font-bold text-base py-3.5 px-5"
          style={{
            background: 'linear-gradient(135deg, var(--m3-primary) 0%, var(--m3-tertiary) 100%)',
            color: 'var(--m3-on-primary)',
            borderRadius: 'var(--radius-m3-full)',
            border: 'none',
            boxShadow: '0 6px 18px rgba(217,194,255,0.35), 0 0 0 1px rgba(255,255,255,0.08) inset',
            minHeight: 52,
          }}
        >
          <Gift size={20} strokeWidth={2.5} />
          Share Invite Link
        </motion.button>
      </motion.div>

      {/* Pricing info card */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.snappy, delay: 0.15 }}
        className="p-4 mb-4 m3-card"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp size={18} style={{ color: 'var(--m3-tertiary)' }} />
          <h3 className="font-semibold text-sm">How downloads work</h3>
        </div>
        <div className="space-y-2 text-xs opacity-85">
          <div className="flex items-center justify-between">
            <span>Per download cost</span>
            <span className="font-semibold">{data.settings.downloadPointCost} pts</span>
          </div>
          <div className="flex items-center justify-between">
            <span>OR watch ads to unlock free</span>
            <span className="font-semibold">{data.settings.requiredAdCount} ads</span>
          </div>
          <div className="flex items-center justify-between">
            <span>First-time join bonus</span>
            <span className="font-semibold" style={{ color: 'var(--m3-accent)' }}>+20 pts</span>
          </div>
          <div className="flex items-center justify-between">
            <span>Per successful referral</span>
            <span className="font-semibold" style={{ color: 'var(--m3-accent)' }}>+30 pts</span>
          </div>
        </div>
      </motion.div>

      {data.dev && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="p-3 text-xs text-center"
          style={{
            background: 'var(--m3-tertiary-container)',
            color: 'var(--m3-on-tertiary-container)',
            borderRadius: 'var(--radius-m3-md)',
          }}
        >
          <Award size={14} className="inline mr-1" />
          Dev mode active — Telegram initData validation is bypassed.
        </motion.div>
      )}
    </div>
  )
}
