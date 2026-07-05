'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ShieldCheck, AlertTriangle } from 'lucide-react'
import { springs } from '@/lib/api-client'

interface AgeGateProps {
  onConfirm: () => void
  // Show even without user (controlled by parent)
  forceShow?: boolean
}

const STORAGE_KEY = 'cv_age_confirmed_v1'

/** Returns true if the user has previously confirmed in this browser */
export function ageConfirmedLocally(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export default function AgeGate({ onConfirm, forceShow }: AgeGateProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (forceShow || !ageConfirmedLocally()) setVisible(true)
  }, [forceShow])

  const handleConfirm = () => {
    try { localStorage.setItem(STORAGE_KEY, '1') } catch {}
    setVisible(false)
    onConfirm()
  }

  const handleDeny = () => {
    // Show a "you cannot proceed" message but keep the gate up
    if (typeof window !== 'undefined') {
      try { window.Telegram?.WebApp?.close?.() } catch {}
    }
    setVisible(false)
    // Replace with a denial screen
    document.body.innerHTML =
      '<div style="display:flex;align-items:center;justify-content:center;min-height:100vh;color:#FFB4AB;text-align:center;font-family:Inter,sans-serif;padding:2rem">You must be 18 or older to access this content.</div>'
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.85, opacity: 0, y: 20 }}
            transition={springs.bouncy}
            className="w-full max-w-md p-6 m3-elevated"
            style={{
              background: 'var(--m3-surface-container-high)',
              color: 'var(--m3-on-surface)',
              borderRadius: 'var(--radius-m3-2xl)',
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-12 h-12 flex items-center justify-center"
                style={{
                  background: 'var(--m3-error-container)',
                  color: 'var(--m3-on-error-container)',
                  borderRadius: 'var(--radius-m3-full)',
                }}
              >
                <AlertTriangle size={22} />
              </div>
              <div>
                <h2 className="text-xl font-bold">Age Verification</h2>
                <p className="text-sm opacity-70">18+ content notice</p>
              </div>
            </div>

            <p className="text-sm leading-relaxed mb-6 opacity-90">
              This Telegram Mini App contains downloadable content that may include mature
              themes. By proceeding, you confirm that you are at least 18 years old and
              that viewing such content is legal in your jurisdiction.
            </p>

            <div
              className="flex items-start gap-2 mb-6 p-3"
              style={{
                background: 'var(--m3-surface-container-highest)',
                borderRadius: 'var(--radius-m3-md)',
              }}
            >
              <ShieldCheck size={18} className="mt-0.5 flex-shrink-0 opacity-80" />
              <p className="text-xs opacity-80">
                Your confirmation is stored locally and on our servers to prevent
                repeated prompts. You can clear it any time by clearing site data.
              </p>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={handleConfirm}
                className="m3-button m3-button-filled w-full"
              >
                I am 18 or older — Enter
              </button>
              <button
                onClick={handleDeny}
                className="m3-button m3-button-text w-full"
                style={{ color: 'var(--m3-error)' }}
              >
                Exit
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
