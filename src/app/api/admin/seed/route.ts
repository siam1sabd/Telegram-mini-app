import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import bcrypt from 'bcryptjs'
import { DEFAULT_SETTINGS, setSettings } from '@/lib/settings'

export const runtime = 'nodejs'

/**
 * POST /api/admin/seed
 * One-shot idempotent endpoint to:
 *  - seed default settings
 *  - create demo categories + content (only if DB is empty)
 *  - ensure a default admin user exists if env configured
 *
 * Useful for first-time setup after deploying with a fresh Turso DB.
 */
export async function POST() {
  const result: string[] = []

  // 1. Seed settings
  for (const [k, v] of Object.entries(DEFAULT_SETTINGS)) {
    const exists = await db.setting.findUnique({ where: { key: k } })
    if (!exists) {
      await db.setting.create({ data: { key: k, value: v } })
      result.push(`setting:${k}`)
    }
  }

  // 2. Default admin (only if env provided AND no admin exists)
  const adminUser = process.env.ADMIN_USERNAME
  const adminPass = process.env.ADMIN_PASSWORD
  if (adminUser && adminPass) {
    const exists = await db.adminUser.findUnique({ where: { username: adminUser } })
    if (!exists) {
      await db.adminUser.create({
        data: { username: adminUser, passwordHash: bcrypt.hashSync(adminPass, 10) },
      })
      result.push('admin-user')
    }
  }

  // 3. Demo content (only if no categories)
  const catCount = await db.category.count()
  if (catCount === 0) {
    const cats = await db.$transaction([
      db.category.create({ data: { name: 'Anime', slug: 'anime', order: 1, icon: 'sparkles' } }),
      db.category.create({ data: { name: 'Wallpapers', slug: 'wallpapers', order: 2, icon: 'image' } }),
      db.category.create({ data: { name: 'Movies', slug: 'movies', order: 3, icon: 'film' } }),
      db.category.create({ data: { name: 'Music', slug: 'music', order: 4, icon: 'music' } }),
    ])
    result.push(`categories:${cats.length}`)

    const demoItems = [
      { title: 'Cyber Skyline Wallpaper', catId: cats[1].id, thumb: 'https://picsum.photos/seed/cyber/600/400', tags: '4k,dark,futuristic', url: 'https://example.com/download/cyber' },
      { title: 'Sakura Dreams Pack', catId: cats[0].id, thumb: 'https://picsum.photos/seed/sakura/600/400', tags: 'anime,sakura', url: 'https://example.com/download/sakura' },
      { title: 'Lo-Fi Beats Vol.3', catId: cats[3].id, thumb: 'https://picsum.photos/seed/lofi/600/400', tags: 'lofi,music,mp3', url: 'https://example.com/download/lofi' },
      { title: 'Indie Sci-Fi Short', catId: cats[2].id, thumb: 'https://picsum.photos/seed/scifi/600/400', tags: 'movie,scifi,mp4', url: 'https://example.com/download/scifi' },
      { title: 'Mountain Sunset Pack', catId: cats[1].id, thumb: 'https://picsum.photos/seed/mountain/600/400', tags: 'nature,4k', url: 'https://example.com/download/mountain' },
      { title: 'Studio Ghibli Tribute', catId: cats[0].id, thumb: 'https://picsum.photos/seed/ghibli/600/400', tags: 'anime,ghibli', url: 'https://example.com/download/ghibli' },
    ]
    for (const it of demoItems) {
      await db.content.create({
        data: {
          title: it.title,
          description: `Premium download: ${it.title}. High quality, ready to use.`,
          thumbnailUrl: it.thumb,
          imageUrl: it.thumb,
          downloadUrl: it.url,
          categoryId: it.catId,
          visibility: true,
          pointCost: 4,
          tags: it.tags,
        },
      })
    }
    result.push(`content:${demoItems.length}`)
  }

  return NextResponse.json({ ok: true, seeded: result })
}
