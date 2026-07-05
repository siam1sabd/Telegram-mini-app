/**
 * Settings service — reads/writes key-value settings from DB with sensible defaults.
 * Used by admin panel to control app behavior without redeployment.
 */
import { db } from './db'
import { cache } from 'react'

export const DEFAULT_SETTINGS: Record<string, string> = {
  joinBonus: '20',
  referralReward: '30',
  downloadPointCost: '4',
  requiredAdCount: '2',
  adsgramPlacementId: '',
  adsgramEnabled: 'true',
  adsgramScriptUrl: 'https://sad.adsgram.ai/js/integration2.js',
  siteTitle: 'Content Vault',
  siteDescription: 'Premium content downloads inside Telegram',
}

export async function getSetting(key: string): Promise<string> {
  const row = await db.setting.findUnique({ where: { key } })
  return row?.value ?? DEFAULT_SETTINGS[key] ?? ''
}

export async function getSettings(keys?: string[]): Promise<Record<string, string>> {
  const rows = keys
    ? await db.setting.findMany({ where: { key: { in: keys } } })
    : await db.setting.findMany()
  const result: Record<string, string> = { ...DEFAULT_SETTINGS }
  for (const r of rows) result[r.key] = r.value
  return result
}

export async function setSetting(key: string, value: string): Promise<void> {
  await db.setting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })
}

export async function setSettings(values: Record<string, string>): Promise<void> {
  await Promise.all(
    Object.entries(values).map(([k, v]) => setSetting(k, v))
  )
}

/** Numeric helper for point/amount settings */
export function toInt(value: string | undefined, fallback: number): number {
  const n = parseInt(value ?? '', 10)
  return Number.isFinite(n) ? n : fallback
}
