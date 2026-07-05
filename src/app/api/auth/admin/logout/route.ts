import { NextResponse } from 'next/server'
import { adminClearCookieHeader } from '@/lib/admin-session'

export const runtime = 'nodejs'

export async function POST() {
  const res = NextResponse.json({ ok: true })
  res.headers.set('set-cookie', adminClearCookieHeader())
  return res
}
