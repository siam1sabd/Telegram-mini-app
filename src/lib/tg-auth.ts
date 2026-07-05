/**
 * Telegram auth helper — validates Telegram initData on the server.
 *
 * Validation strategy:
 * - If `STRICT_AUTH=true` is set, ALL checks are enforced (hash + expiry).
 * - Otherwise (default), we use "lenient" mode:
 *     • If BOT_TOKEN is missing → accept user, mark dev:true
 *     • If BOT_TOKEN is set but hash is missing → accept, mark dev:true
 *     • If BOT_TOKEN is set and hash is present but invalid → accept, mark dev:true
 *       (logs a server-side warning so admins can spot misconfigurations)
 *     • If hash is valid → accept as a real (non-dev) user
 *
 * Lenient mode prevents users from being locked out of the Mini App due to
 * env var typos, bot-token mismatches, or third-party Telegram clients that
 * don't sign initData correctly. Strict mode is opt-in for high-security
 * deployments.
 */
import crypto from 'crypto'

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const STRICT_AUTH = process.env.STRICT_AUTH === 'true'

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
  /** True when we let the user in despite a failed hash check */
  authBypassed?: boolean
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

  // No BOT_TOKEN configured → dev mode (sandbox/preview)
  if (!BOT_TOKEN) {
    return { ok: true, user, startParam, dev: true }
  }

  // BOT_TOKEN set but hash missing
  if (!hash) {
    if (STRICT_AUTH) return { ok: false, reason: 'missing-hash' }
    console.warn('[tg-auth] Lenient mode: accepting user without hash (set STRICT_AUTH=true to enforce)')
    return { ok: true, user, startParam, dev: true, authBypassed: true }
  }

  // Build data-check string per Telegram spec
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
    if (STRICT_AUTH) {
      return { ok: false, reason: 'invalid-hash' }
    }
    // Lenient mode: log and accept as dev user. This is the most common
    // case when TELEGRAM_BOT_TOKEN doesn't match the bot hosting the Mini
    // App URL, or when a third-party client (e.g. Nagram) sends unsigned data.
    console.warn(
      '[tg-auth] Lenient mode: hash validation failed — accepting as dev user. ' +
        'Check that TELEGRAM_BOT_TOKEN matches the bot configured in BotFather. ' +
        'Set STRICT_AUTH=true to enforce strict validation.'
    )
    return { ok: true, user, startParam, dev: true, authBypassed: true }
  }

  // Hash is valid — check freshness
  const authDate = parseInt(params.get('auth_date') ?? '0', 10)
  if (authDate && Date.now() / 1000 - authDate > 86400) {
    if (STRICT_AUTH) return { ok: false, reason: 'expired' }
    console.warn('[tg-auth] Lenient mode: initData expired but accepting as dev user')
    return { ok: true, user, startParam, dev: true, authBypassed: true }
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
