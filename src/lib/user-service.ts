/**
 * Server-side helper: get-or-create a User row from Telegram initData.
 * Also handles first-time 20-point bonus and referral start_param.
 */
import { db } from './db'
import { getSetting, toInt } from './settings'
import { validateTelegramInitData, type TgUser } from './tg-auth'
import { randomBytes } from 'crypto'

function makeReferralCode(telegramId: number): string {
  const rand = randomBytes(4).toString('hex')
  return `${telegramId.toString(36)}${rand}`
}

export interface UserContext {
  user: {
    id: string
    telegramId: string
    username: string | null
    firstName: string | null
    lastName: string | null
    photoUrl: string | null
    points: number
    joinedAt: Date
    referralCode: string
    referredById: string | null
    bonusGranted: boolean
    ageConfirmed: boolean
  }
  startParam: string | null
  isNew: boolean
  dev: boolean
  authBypassed?: boolean
}

/** Return type for resolveUser that can carry an error reason */
export interface ResolveUserResult {
  ctx: UserContext | null
  reason?: string
}

/**
 * Verify initData, get-or-create user, apply first-time bonus + referral reward.
 * Returns null on failure (check `reason` on the wrapper for diagnostics).
 */
export async function resolveUser(initData: string): Promise<UserContext | null> {
  const result = validateTelegramInitData(initData)
  if (!result.ok || !result.user) return null

  const tg: TgUser = result.user
  const tgId = String(tg.id)
  const startParam = result.startParam ?? null

  const existing = await db.user.findUnique({ where: { telegramId: tgId } })

  // Handle referral param: start_param format = "ref_<referralCode>"
  let referrerId: string | null = existing?.referredById ?? null
  if (!existing && startParam && startParam.startsWith('ref_')) {
    const code = startParam.slice(4)
    const referrer = await db.user.findUnique({ where: { referralCode: code } })
    if (referrer && referrer.telegramId !== tgId) {
      referrerId = referrer.id
    }
  }

  if (existing) {
    return {
      user: {
        id: existing.id,
        telegramId: existing.telegramId,
        username: existing.username,
        firstName: existing.firstName,
        lastName: existing.lastName,
        photoUrl: existing.photoUrl,
        points: existing.points,
        joinedAt: existing.joinedAt,
        referralCode: existing.referralCode,
        referredById: existing.referredById,
        bonusGranted: existing.bonusGranted,
        ageConfirmed: existing.ageConfirmed,
      },
      startParam,
      isNew: false,
      dev: result.dev ?? false,
      authBypassed: result.authBypassed,
    }
  }

  // Create new user
  const joinBonus = toInt(await getSetting('joinBonus'), 20)
  const referralReward = toInt(await getSetting('referralReward'), 30)

  const newUser = await db.user.create({
    data: {
      telegramId: tgId,
      username: tg.username ?? null,
      firstName: tg.first_name ?? null,
      lastName: tg.last_name ?? null,
      photoUrl: tg.photo_url ?? null,
      points: joinBonus, // first-time bonus
      referralCode: makeReferralCode(tg.id),
      referredById: referrerId,
      bonusGranted: true,
    },
  })

  // Award referrer
  if (referrerId) {
    await db.user.update({
      where: { id: referrerId },
      data: { points: { increment: referralReward } },
    })
    await db.referral.upsert({
      where: { referrerId },
      update: {
        referredCount: { increment: 1 },
        pointsEarned: { increment: referralReward },
      },
      create: {
        referrerId,
        referredCount: 1,
        pointsEarned: referralReward,
      },
    })
  }

  return {
    user: {
      id: newUser.id,
      telegramId: newUser.telegramId,
      username: newUser.username,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      photoUrl: newUser.photoUrl,
      points: newUser.points,
      joinedAt: newUser.joinedAt,
      referralCode: newUser.referralCode,
      referredById: newUser.referredById,
      bonusGranted: newUser.bonusGranted,
      ageConfirmed: newUser.ageConfirmed,
    },
    startParam,
    isNew: true,
    dev: result.dev ?? false,
    authBypassed: result.authBypassed,
  }
}

/** Light-weight helper that only returns the user row without side effects */
export async function getUserById(userId: string) {
  return db.user.findUnique({ where: { id: userId } })
}

export async function getUserByTelegramId(telegramId: string) {
  return db.user.findUnique({ where: { telegramId } })
}
