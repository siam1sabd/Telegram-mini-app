import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSessionFromRequest } from '@/lib/admin-session'

export const runtime = 'nodejs'

/** GET /api/admin/stats — dashboard counts */
export async function GET(req: Request) {
  if (!getAdminSessionFromRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const [users, categories, contents, downloads, adViews, pointsSum] = await Promise.all([
    db.user.count(),
    db.category.count(),
    db.content.count(),
    db.downloadHistory.count(),
    db.adView.count(),
    db.user.aggregate({ _sum: { points: true } }),
  ])
  return NextResponse.json({
    ok: true,
    stats: {
      users,
      categories,
      contents,
      downloads,
      adViews,
      totalPointsInCirculation: pointsSum._sum.points ?? 0,
    },
  })
}
