import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signAdminSession, adminCookieHeader, ADMIN_COOKIE } from '@/lib/admin-session'
import { getSetting, setSetting, DEFAULT_SETTINGS } from '@/lib/settings'

export const runtime = 'nodejs'

/**
 * POST /api/auth/admin/login
 * Body: { username, password }
 *
 * First-time auto-seed: if no AdminUser exists, the first login using
 * the env-configured ADMIN_USERNAME / ADMIN_PASSWORD (or default admin/admin)
 * will create the admin row and persist a hashed password.
 */
export async function POST(req: Request) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ ok: false, error: 'missing-credentials' }, { status: 400 })
    }

    let admin = await db.adminUser.findUnique({ where: { username } })

    // Auto-seed on first run
    if (!admin) {
      const seededUser = process.env.ADMIN_USERNAME || (await getSetting('adminUsername')) || 'admin'
      if (username !== seededUser) {
        return NextResponse.json({ ok: false, error: 'invalid-credentials' }, { status: 401 })
      }
      const seededPass =
        process.env.ADMIN_PASSWORD ||
        (await getSetting('adminPassword')) ||
        'admin123'
      if (password !== seededPass) {
        return NextResponse.json({ ok: false, error: 'invalid-credentials' }, { status: 401 })
      }
      const hash = bcrypt.hashSync(password, 10)
      admin = await db.adminUser.create({ data: { username, passwordHash: hash } })
      // Persist so subsequent logins use the hashed password
      await setSetting('adminUsername', username)
    } else {
      const ok = bcrypt.compareSync(password, admin.passwordHash)
      if (!ok) {
        return NextResponse.json({ ok: false, error: 'invalid-credentials' }, { status: 401 })
      }
    }

    const token = signAdminSession(admin.username)
    const res = NextResponse.json({ ok: true, username: admin.username })
    res.headers.set('set-cookie', adminCookieHeader(token))
    return res
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'server-error' }, { status: 500 })
  }
}
