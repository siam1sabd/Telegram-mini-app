import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getAdminSessionFromRequest } from '@/lib/admin-session'

export const runtime = 'nodejs'

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const cat = await db.category.findUnique({ where: { id } })
  if (!cat) return NextResponse.json({ ok: false, error: 'not-found' }, { status: 404 })
  return NextResponse.json({ ok: true, category: cat })
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!getAdminSessionFromRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params
  const { name, description, icon } = await req.json()
  const data: any = {}
  if (name !== undefined) {
    data.name = name
    data.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  }
  if (description !== undefined) data.description = description
  if (icon !== undefined) data.icon = icon
  const cat = await db.category.update({ where: { id }, data })
  return NextResponse.json({ ok: true, category: cat })
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!getAdminSessionFromRequest(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
  }
  const { id } = await params
  await db.category.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
