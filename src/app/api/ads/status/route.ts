import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser } from '@/lib/user-service'
import { getInitDataFromRequest } from '@/lib/tg-auth'
import { getSettings, toInt } from '@/lib/settings'

export const runtime = 'nodejs'

/**
 * GET /api/ads/status?contentId=...
 * Returns ad progress for the current user + content.
 */
export async function GET(req: Request) {
  try {
    const initData = getInitDataFromRequest(req)
    if (!initData) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    const ctx = await resolveUser(initData)
    if (!ctx) return NextResponse.json({ ok: false, error: 'invalid-initData' }, { status: 401 })

    const url = new URL(req.url)
    const contentId = url.searchParams.get('contentId') || undefined

    const settings = await getSettings(['requiredAdCount'])
    const required = toInt(settings.requiredAdCount, 2)

    const since = new Date(0)
    const completed = await db.adView.count({
      where: {
        userId: ctx.user.id,
        contentId: contentId ?? null,
        status: 'completed',
        viewedAt: { gte: since },
      },
    })

    return NextResponse.json({
      ok: true,
      required,
      completed,
      remaining: Math.max(0, required - completed),
    })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'server-error' }, { status: 500 })
  }
}
