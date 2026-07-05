import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { resolveUser } from '@/lib/user-service'
import { getInitDataFromRequest } from '@/lib/tg-auth'

export const runtime = 'nodejs'

/**
 * POST /api/users/age-confirm
 * Marks the user as having confirmed 18+ age.
 * Also persists in AgeConfirmation table for auditability.
 */
export async function POST(req: Request) {
  try {
    const initData = getInitDataFromRequest(req)
    if (!initData) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 })
    const ctx = await resolveUser(initData)
    if (!ctx) return NextResponse.json({ ok: false, error: 'invalid-initData' }, { status: 401 })

    await db.user.update({
      where: { id: ctx.user.id },
      data: { ageConfirmed: true, ageConfirmedAt: new Date() },
    })
    await db.ageConfirmation.upsert({
      where: { telegramId: ctx.user.telegramId },
      create: { telegramId: ctx.user.telegramId },
      update: { confirmedAt: new Date() },
    })

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'server-error' }, { status: 500 })
  }
}
