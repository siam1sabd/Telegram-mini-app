import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser } from '@/lib/user-service'
import { getInitDataFromRequest } from '@/lib/tg-auth'
import { getSettings } from '@/lib/settings'

export const runtime = 'nodejs'

/**
 * GET /api/users/me
 * Headers: X-TG-InitData or Authorization: Bearer <initData>
 * Returns the current user + app settings (public ones).
 */
export async function GET(req: Request) {
  try {
    const initData = getInitDataFromRequest(req)
    if (!initData) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    const ctx = await resolveUser(initData)
    if (!ctx) return NextResponse.json({ ok: false, error: 'invalid-initData' }, { status: 401 })

    const settings = await getSettings([
      'downloadPointCost',
      'requiredAdCount',
      'adsgramPlacementId',
      'adsgramEnabled',
      'siteTitle',
    ])

    // download + ad stats
    const [downloads, adViews] = await Promise.all([
      db.downloadHistory.count({ where: { userId: ctx.user.id } }),
      db.adView.count({ where: { userId: ctx.user.id, status: 'completed' } }),
    ])

    // referral stats
    const referral = await db.referral.findUnique({
      where: { referrerId: ctx.user.id },
    })

    return NextResponse.json({
      ok: true,
      user: ctx.user,
      stats: {
        downloads,
        adViews,
        referralCount: referral?.referredCount ?? 0,
        referralPoints: referral?.pointsEarned ?? 0,
      },
      settings: {
        downloadPointCost: parseInt(settings.downloadPointCost || '4', 10),
        requiredAdCount: parseInt(settings.requiredAdCount || '2', 10),
        adsgramPlacementId: settings.adsgramPlacementId || '',
        adsgramEnabled: settings.adsgramEnabled === 'true',
        siteTitle: settings.siteTitle || 'Content Vault',
      },
      dev: ctx.dev,
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'server-error' }, { status: 500 })
  }
}
