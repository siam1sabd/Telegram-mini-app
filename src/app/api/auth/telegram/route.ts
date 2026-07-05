import { NextResponse } from 'next/server'
import { resolveUser } from '@/lib/user-service'
import { getInitDataFromRequest } from '@/lib/tg-auth'

export const runtime = 'nodejs'

/** POST /api/auth/telegram — body: { initData } — returns the resolved user */
export async function POST(req: Request) {
  try {
    let body: any = {}
    try { body = await req.json() } catch {}
    const initData = body.initData || getInitDataFromRequest(req)
    if (!initData) {
      return NextResponse.json({ ok: false, error: 'missing-initData' }, { status: 400 })
    }
    const ctx = await resolveUser(initData)
    if (!ctx) {
      return NextResponse.json({ ok: false, error: 'invalid-initData' }, { status: 401 })
    }
    return NextResponse.json({ ok: true, ...ctx })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'server-error' }, { status: 500 })
  }
}
