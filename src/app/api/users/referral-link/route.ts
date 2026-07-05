import { NextResponse } from 'next/server'
import { resolveUser } from '@/lib/user-service'
import { getInitDataFromRequest } from '@/lib/tg-auth'

export const runtime = 'nodejs'

/**
 * GET /api/users/referral-link
 * Returns a Telegram Deep Link using the bot username + start_param.
 */
export async function GET(req: Request) {
  try {
    const initData = getInitDataFromRequest(req)
    if (!initData) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    const ctx = await resolveUser(initData)
    if (!ctx) return NextResponse.json({ ok: false, error: 'invalid-initData' }, { status: 401 })

    const botUsername = process.env.TELEGRAM_BOT_USERNAME || 'YourMiniAppBot'
    const link = `https://t.me/${botUsername}?startapp=ref_${ctx.user.referralCode}`

    return NextResponse.json({ ok: true, link, code: ctx.user.referralCode })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'server-error' }, { status: 500 })
  }
}
