/**
 * Admin session helpers — signed JWT-like session token stored in a cookie.
 * Keeps admin auth simple, dependency-light, and serverless-friendly.
 */
import crypto from 'crypto'

const SECRET = process.env.ADMIN_SESSION_SECRET || 'dev-admin-secret-change-me'
const COOKIE_NAME = 'cv_admin_session'

export interface AdminSession {
  username: string
  issuedAt: number
  expiresAt: number
}

export function signAdminSession(username: string): string {
  const issuedAt = Date.now()
  const expiresAt = issuedAt + 1000 * 60 * 60 * 12 // 12h
  const payload: AdminSession = { username, issuedAt, expiresAt }
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url')
  const sig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  return `${body}.${sig}`
}

export function verifyAdminSession(token: string | null | undefined): AdminSession | null {
  if (!token) return null
  const [body, sig] = token.split('.')
  if (!body || !sig) return null
  const expectedSig = crypto.createHmac('sha256', SECRET).update(body).digest('base64url')
  if (sig !== expectedSig) return null
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString()) as AdminSession
    if (Date.now() > payload.expiresAt) return null
    return payload
  } catch {
    return null
  }
}

export const ADMIN_COOKIE = COOKIE_NAME

export function adminCookieHeader(token: string): string {
  return `${ADMIN_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`
}

export function adminClearCookieHeader(): string {
  return `${ADMIN_COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0${
    process.env.NODE_ENV === 'production' ? '; Secure' : ''
  }`
}

export function getAdminSessionFromRequest(req: Request): AdminSession | null {
  const cookies = req.headers.get('cookie') ?? ''
  const match = cookies.split(';').map(s => s.trim()).find(s => s.startsWith(`${ADMIN_COOKIE}=`))
  if (!match) return null
  const token = match.split('=').slice(1).join('=')
  return verifyAdminSession(token)
}
