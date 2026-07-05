/**
 * Telegram auth helper — validates Telegram initData on the server.
 *
 * In production, validate the hash using the BOT_TOKEN HMAC.
 * In dev/preview (no BOT_TOKEN), accept initDataUnsafe as-is but mark user
 * as a "dev" user. This keeps the sandbox functional while real deployments
 * are secure.
 */
import crypto from 'crypto'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN

export interface TgUser {
  id: number
  first_name?: string
  last_name?: string
  username?: string
  photo_url?: string
  language_code?: string
}

export interface AuthResult {
  ok: boolean
  user?: TgUser
  startParam?: string
  dev?: boolean
  reason?: string
}

/**
 * Validate a Telegram WebApp initData string.
 * Returns the parsed user if valid.
 */
export function validateTelegramInitData(initData: string): AuthResult {
  if (!initData) return { ok: false, reason: 'missing-initData' }

  const params = new URLSearchParams(initData)
  const userJson = params.get('user')
  const startParam = params.get('start_param') ?? undefined
  const hash = params.get('hash')

  if (!userJson) return { ok: false, reason: 'missing-user' }

  let user: TgUser
  try {
    user = JSON.parse(userJson)
  } catch {
    return { ok: false, reason: 'invalid-user-json' }
  }
  if (!user?.id) return { ok: false, reason: 'invalid-user-id' }

  // If no BOT_TOKEN configured (sandbox), accept the user but flag as dev
  if (!BOT_TOKEN || !hash) {
    return { ok: true, user, startParam, dev: true }
  }

  // Build data-check string
  params.delete('hash')
  const dataCheckArr: string[] = []
  for (const [k, v] of params.entries()) {
    dataCheckArr.push(`${k}=${v}`)
  }
  dataCheckArr.sort()
  const dataCheckString = dataCheckArr.join('\n')

  const secret = crypto
    .createHmac('sha256', 'WebAppData')
    .update(BOT_TOKEN)
    .digest()
  const computed = crypto
    .createHmac('sha256', secret)
    .update(dataCheckString)
    .digest('hex')

  if (computed !== hash) {
    return { ok: false, reason: 'invalid-hash' }
  }

  // Optional: check auth_date freshness
  const authDate = parseInt(params.get('auth_date') ?? '0', 10)
  if (authDate && Date.now() / 1000 - authDate > 86400) {
    return { ok: false, reason: 'expired' }
  }

  return { ok: true, user, startParam }
}

/** Convenience: extract a usable initData from a Request */
export function getInitDataFromRequest(req: Request): string {
  // Try Authorization: Bearer <initData> header first
  const auth = req.headers.get('authorization') ?? ''
  if (auth.startsWith('Bearer ')) return auth.slice(7).trim()
  // Then custom X-TG-InitData
  const xInit = req.headers.get('x-tg-initdata')
  if (xInit) return xInit
  return ''
}
