'use client'

import { motion } from 'framer-motion'
import { Home, User, Shield } from 'lucide-react'
import { springs } from '@/lib/api-client'

export type Tab = 'home' | 'profile' | 'admin'

interface BottomNavProps {
  active: Tab
  onChange: (t: Tab) => void
  showAdmin?: boolean
}

const TABS: { id: Tab; label: string; icon: any }[] = [
  { id: 'home', label: 'Home', icon: Home },
  { id: 'profile', label: 'Profile', icon: User },
]

export default function BottomNav({ active, onChange, showAdmin }: BottomNavProps) {
  const tabs = showAdmin
    ? [...TABS, { id: 'admin' as Tab, label: 'Admin', icon: Shield }]
    : TABS

  return (
    <div
      className="fixed left-0 right-0 z-40 safe-bottom"
      style={{
        bottom: 0,
        padding: '0.6rem 1rem max(0.6rem, env(safe-area-inset-bottom))',
        background:
          'linear-gradient(180deg, transparent 0%, var(--m3-surface-container-low) 35%)',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="mx-auto max-w-lg flex items-center justify-between gap-1 p-1.5"
        style={{
          background: 'var(--m3-surface-container-high)',
          borderRadius: 'var(--radius-m3-full)',
          boxShadow: '0 4px 16px rgba(0,0,0,0.35)',
        }}
      >
        {tabs.map((t) => {
          const Icon = t.icon
          const isActive = active === t.id
          return (
            <button
              key={t.id}
              onClick={() => onChange(t.id)}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 px-2"
              style={{
                borderRadius: 'var(--radius-m3-full)',
                minHeight: 48,
                color: isActive
                  ? 'var(--m3-on-secondary-container)'
                  : 'var(--m3-on-surface-variant)',
              }}
            >
              {isActive && (
                <motion.div
                  layoutId="bottom-nav-pill"
                  transition={springs.snappy}
                  className="absolute inset-0"
                  style={{
                    background: 'var(--m3-secondary-container)',
                    borderRadius: 'var(--radius-m3-full)',
                    zIndex: 0,
                  }}
                />
              )}
              <motion.div
                animate={isActive ? { y: -1, scale: 1.05 } : { y: 0, scale: 1 }}
                transition={springs.soft}
                className="relative z-10 flex items-center gap-1.5"
              >
                <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                <span
                  className="text-xs font-medium"
                  style={{ opacity: isActive ? 1 : 0.85 }}
                >
                  {t.label}
                </span>
              </motion.div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
