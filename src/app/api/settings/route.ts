import { NextResponse } from 'next/server'
import { getSettings, setSettings, DEFAULT_SETTINGS } from '@/lib/settings'
import { getAdminSessionFromRequest } from '@/lib/admin-session'

export const runtime = 'nodejs'

const PUBLIC_KEYS = ['siteTitle', 'siteDescription', 'downloadPointCost', 'requiredAdCount', 'adsgramEnabled']
const ADMIN_KEYS = Object.keys(DEFAULT_SETTINGS)

/** GET /api/settings — returns public + admin settings based on auth */
export async function GET(req: Request) {
  const isAdmin = !!getAdminSessionFromRequest(req)
  const keys = isAdmin ? ADMIN_KEYS : PUBLIC_KEYS
  const values = await getSettings(keys)
  return NextResponse.json({ ok: true, settings: values })
}

/** PUT /api/settings — admin only */
export async function PUT(req: Request) {
  if (!getAdminSessionFromRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const body = (await req.json()) as Record<string, string>
  // Filter to allowed keys only
  const allowed = Object.fromEntries(
    Object.entries(body).filter(([k]) => ADMIN_KEYS.includes(k))
  )
  await setSettings(allowed)
  const fresh = await getSettings(ADMIN_KEYS)
  return NextResponse.json({ ok: true, settings: fresh })
}
