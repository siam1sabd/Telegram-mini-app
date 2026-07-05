import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser } from '@/lib/user-service'
import { getInitDataFromRequest } from '@/lib/tg-auth'

export const runtime = 'nodejs'

/**
 * POST /api/ads/track
 * Body: { contentId?: string, status: 'started' | 'completed' }
 * Records an ad view for the current user (and optionally tied to contentId).
 */
export async function POST(req: Request) {
  try {
    const initData = getInitDataFromRequest(req)
    if (!initData) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    const ctx = await resolveUser(initData)
    if (!ctx) return NextResponse.json({ ok: false, error: 'invalid-initData' }, { status: 401 })

    const { contentId, status } = await req.json()
    if (!['started', 'completed'].includes(status)) {
      return NextResponse.json({ ok: false, error: 'invalid-status' }, { status: 400 })
    }

    const view = await db.adView.create({
      data: {
        userId: ctx.user.id,
        contentId: contentId ?? null,
        status,
      },
    })
    return NextResponse.json({ ok: true, viewId: view.id })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'server-error' }, { status: 500 })
  }
}
