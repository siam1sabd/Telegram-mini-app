import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSessionFromRequest } from '@/lib/admin-session'

export const runtime = 'nodejs'

/** GET /api/categories — public list, ordered by `order` */
export async function GET() {
  const cats = await db.category.findMany({
    orderBy: [{ order: 'asc' }, { createdAt: 'asc' }],
    include: { _count: { select: { contents: { where: { visibility: true } } } } },
  })
  return NextResponse.json({
    ok: true,
    categories: cats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description,
      icon: c.icon,
      order: c.order,
      contentCount: c._count.contents,
    })),
  })
}

/** POST /api/categories — admin only */
export async function POST(req: Request) {
  if (!getAdminSessionFromRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const { name, description, icon } = await req.json()
  if (!name) return NextResponse.json({ ok: false, error: 'name-required' }, { status: 400 })
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  const order = (await db.category.count()) + 1
  const cat = await db.category.create({
    data: { name, slug, description, icon, order },
  })
  return NextResponse.json({ ok: true, category: cat })
}

/** PATCH /api/categories — bulk update order (admin) */
export async function PATCH(req: Request) {
  if (!getAdminSessionFromRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const body = (await req.json()) as {
    updates: { id: string; order: number; name?: string; description?: string | null; icon?: string | null }[]
  }
  const updates = body.updates || []
  await Promise.all(
    updates.map((u) =>
      db.category.update({
        where: { id: u.id },
        data: {
          order: u.order,
          ...(u.name !== undefined ? { name: u.name } : {}),
          ...(u.description !== undefined ? { description: u.description } : {}),
          ...(u.icon !== undefined ? { icon: u.icon } : {}),
        },
      })
    )
  )
  return NextResponse.json({ ok: true })
}
