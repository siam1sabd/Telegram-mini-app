import { NextResponse } from 'next/server'
import { db } from '@/lib/db'

export const runtime = 'nodejs'

/** GET /api/content?categoryId=...&limit=...&offset=... — public list */
export async function GET(req: Request) {
  const url = new URL(req.url)
  const categoryId = url.searchParams.get('categoryId') || undefined
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '50', 10), 100)
  const offset = parseInt(url.searchParams.get('offset') || '0', 10)
  const search = url.searchParams.get('q')

  const where: any = { visibility: true }
  if (categoryId) where.categoryId = categoryId
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { description: { contains: search } },
      { tags: { contains: search } },
    ]
  }

  const items = await db.content.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: limit,
    skip: offset,
    include: { category: true },
  })

  return NextResponse.json({
    ok: true,
    items: items.map((c) => ({
      id: c.id,
      title: c.title,
      description: c.description,
      thumbnailUrl: c.thumbnailUrl,
      imageUrl: c.imageUrl,
      pointCost: c.pointCost,
      tags: c.tags,
      createdAt: c.createdAt,
      category: c.category
        ? { id: c.category.id, name: c.category.name, slug: c.category.slug }
        : null,
    })),
  })
}

/** POST /api/content — admin: create new content */
export async function POST(req: Request) {
  const { getAdminSessionFromRequest } = await import('@/lib/admin-session')
  if (!getAdminSessionFromRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const body = await req.json()
  const {
    title,
    description,
    thumbnailUrl,
    imageUrl,
    metadata,
    downloadUrl,
    categoryId,
    visibility,
    pointCost,
    tags,
  } = body

  if (!title || !downloadUrl || !categoryId) {
    return NextResponse.json(
      { ok: false, error: 'title, downloadUrl, categoryId required' },
      { status: 400 }
    )
  }

  const item = await db.content.create({
    data: {
      title,
      description: description ?? null,
      thumbnailUrl: thumbnailUrl ?? null,
      imageUrl: imageUrl ?? null,
      metadata: typeof metadata === 'string' ? metadata : metadata ? JSON.stringify(metadata) : null,
      downloadUrl,
      categoryId,
      visibility: visibility ?? true,
      pointCost: pointCost ?? 4,
      tags: tags ?? null,
    },
  })
  return NextResponse.json({ ok: true, content: item })
}
