import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser } from '@/lib/user-service'
import { getInitDataFromRequest } from '@/lib/tg-auth'
import { getSettings, toInt } from '@/lib/settings'

export const runtime = 'nodejs'

/**
 * POST /api/content/[id]/download
 * Body: { method: 'points' | 'ads' }
 *
 * Validates:
 *  - method === 'points' → user.points >= downloadPointCost, deduct & record
 *  - method === 'ads'    → user has >= requiredAdCount completed AdViews
 *                           for THIS content since last unlock
 *
 * If already unlocked (existing DownloadHistory), returns the link for free
 * (prevents re-charging users who already paid).
 *
 * On success returns { ok: true, downloadUrl, accessMethod, pointsRemaining }
 * On failure returns { ok: false, error }
 */
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const initData = getInitDataFromRequest(req)
    if (!initData) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    const ctx = await resolveUser(initData)
    if (!ctx) return NextResponse.json({ ok: false, error: 'invalid-initData' }, { status: 401 })

    const content = await db.content.findUnique({ where: { id } })
    if (!content || !content.visibility) {
      return NextResponse.json({ ok: false, error: 'not-found' }, { status: 404 })
    }

    // Already unlocked? Return link for free.
    const existing = await db.downloadHistory.findFirst({
      where: { userId: ctx.user.id, contentId: id },
      orderBy: { downloadedAt: 'desc' },
    })
    if (existing) {
      return NextResponse.json({
        ok: true,
        downloadUrl: content.downloadUrl,
        accessMethod: existing.accessMethod,
        pointsRemaining: ctx.user.points,
        alreadyUnlocked: true,
      })
    }

    const body = await req.json().catch(() => ({}))
    const method: string = body.method || 'points'
    const settings = await getSettings(['downloadPointCost', 'requiredAdCount'])
    const pointCost = toInt(settings.downloadPointCost, 4)
    const requiredAds = toInt(settings.requiredAdCount, 2)

    if (method === 'points') {
      if (ctx.user.points < pointCost) {
        return NextResponse.json(
          { ok: false, error: 'insufficient-points', required: pointCost, have: ctx.user.points },
          { status: 402 }
        )
      }
      // Atomic deduction using a transaction
      const [updatedUser, history] = await db.$transaction([
        db.user.update({
          where: { id: ctx.user.id },
          data: { points: { decrement: pointCost } },
        }),
        db.downloadHistory.create({
          data: {
            userId: ctx.user.id,
            contentId: id,
            pointsSpent: pointCost,
            accessMethod: 'points',
          },
        }),
      ])
      return NextResponse.json({
        ok: true,
        downloadUrl: content.downloadUrl,
        accessMethod: 'points',
        pointsRemaining: updatedUser.points,
        historyId: history.id,
      })
    }

    if (method === 'ads') {
      // Count completed ad views for this content since the most recent unlock (or all-time if none)
      const since = existing?.downloadedAt ?? new Date(0)
      const count = await db.adView.count({
        where: {
          userId: ctx.user.id,
          contentId: id,
          status: 'completed',
          viewedAt: { gte: since },
        },
      })
      if (count < requiredAds) {
        return NextResponse.json(
          {
            ok: false,
            error: 'insufficient-ads',
            required: requiredAds,
            have: count,
          },
          { status: 402 }
        )
      }
      const history = await db.downloadHistory.create({
        data: {
          userId: ctx.user.id,
          contentId: id,
          pointsSpent: 0,
          accessMethod: 'ads',
        },
      })
      return NextResponse.json({
        ok: true,
        downloadUrl: content.downloadUrl,
        accessMethod: 'ads',
        pointsRemaining: ctx.user.points,
        historyId: history.id,
      })
    }

    return NextResponse.json({ ok: false, error: 'invalid-method' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'server-error' }, { status: 500 })
  }
}
