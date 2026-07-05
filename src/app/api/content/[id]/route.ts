import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSessionFromRequest } from '@/lib/admin-session'

export const runtime = 'nodejs'

/** GET /api/content/[id] — public content details (download URL is hidden!) */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const c = await db.content.findUnique({
    where: { id },
    include: { category: true },
  })
  if (!c || !c.visibility) {
    return NextResponse.json({ ok: false, error: 'not-found' }, { status: 404 })
  }

  // Check if user has already unlocked this content (avoids re-charging)
  let alreadyUnlocked = false
  const auth = req.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ') || req.headers.get('x-tg-initdata')) {
    try {
      const initData = auth.startsWith('Bearer ') ? auth.slice(7) : req.headers.get('x-tg-initdata')
      if (initData) {
        const { resolveUser } = await import('@/lib/user-service')
        const ctx = await resolveUser(initData)
        if (ctx) {
          const dl = await db.downloadHistory.findFirst({
            where: { userId: ctx.user.id, contentId: id },
            orderBy: { downloadedAt: 'desc' },
          })
          if (dl) alreadyUnlocked = true
        }
      }
    } catch {}
  }

  return NextResponse.json({
    ok: true,
    content: {
      id: c.id,
      title: c.title,
      description: c.description,
      thumbnailUrl: c.thumbnailUrl,
      imageUrl: c.imageUrl,
      metadata: c.metadata,
      pointCost: c.pointCost,
      tags: c.tags,
      visibility: c.visibility,
      createdAt: c.createdAt,
      category: c.category
        ? { id: c.category.id, name: c.category.name, slug: c.category.slug }
        : null,
      // NOTE: downloadUrl is intentionally NOT returned here
      alreadyUnlocked,
    },
  })
}

/** PATCH /api/content/[id] — admin update */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!getAdminSessionFromRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const body = await req.json()
  const data: any = {}
  for (const k of ['title', 'description', 'thumbnailUrl', 'imageUrl', 'downloadUrl', 'categoryId', 'visibility', 'pointCost', 'tags']) {
    if (body[k] !== undefined) data[k] = body[k]
  }
  if (body.metadata !== undefined) {
    data.metadata = typeof body.metadata === 'string' ? body.metadata : JSON.stringify(body.metadata)
  }
  const c = await db.content.update({ where: { id }, data })
  return NextResponse.json({ ok: true, content: c })
}

/** DELETE /api/content/[id] — admin delete */
export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!getAdminSessionFromRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params
  await db.content.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
