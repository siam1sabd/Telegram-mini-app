import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSessionFromRequest } from '@/lib/admin-session'

export const runtime = 'nodejs'

/** GET /api/admin/users — paginated user list with download/referral info */
export async function GET(req: Request) {
  if (!getAdminSessionFromRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const url = new URL(req.url)
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 200)
  const offset = parseInt(url.searchParams.get('offset') || '0', 10)
  const search = url.searchParams.get('q')

  const where: any = {}
  if (search) {
    where.OR = [
      { username: { contains: search } },
      { firstName: { contains: search } },
      { telegramId: { contains: search } },
    ]
  }

  const [users, total] = await Promise.all([
    db.user.findMany({
      where,
      orderBy: { joinedAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        _count: { select: { downloads: true, referrals: true } },
      },
    }),
    db.user.count({ where }),
  ])

  return NextResponse.json({
    ok: true,
    total,
    users: users.map((u) => ({
      id: u.id,
      telegramId: u.telegramId,
      username: u.username,
      firstName: u.firstName,
      lastName: u.lastName,
      photoUrl: u.photoUrl,
      points: u.points,
      joinedAt: u.joinedAt,
      ageConfirmed: u.ageConfirmed,
      bonusGranted: u.bonusGranted,
      downloadsCount: u._count.downloads,
      referralsCount: u._count.referrals,
    })),
  })
}
