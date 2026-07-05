import { NextResponse } from 'next/server'
import { getAdminSessionFromRequest } from '@/lib/admin-session'

export const runtime = 'nodejs'

export async function GET(req: Request) {
  const session = getAdminSessionFromRequest(req)
  if (!session) return NextResponse.json({ ok: false }, { status: 401 })
  return NextResponse.json({ ok: true, username: session.username })
}
