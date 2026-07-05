'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useApi, springs } from '@/lib/api-client'
import { useMemo, useState } from 'react'
import { Sparkles, Image as ImageIcon, Film, Music, Tag, Search, Download, Coins } from 'lucide-react'

const ICONS: Record<string, any> = {
  sparkles: Sparkles,
  image: ImageIcon,
  film: Film,
  music: Music,
  tag: Tag,
}

interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  order: number
  contentCount: number
}
interface ContentItem {
  id: string
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  pointCost: number
  tags?: string | null
  category: { id: string; name: string; slug: string } | null
}

interface HomeViewProps {
  onOpenContent: (id: string) => void
  siteTitle: string
}

export default function HomeView({ onOpenContent, siteTitle }: HomeViewProps) {
  const { data: catsData, loading: catsLoading } = useApi<{ ok: boolean; categories: Category[] }>(
    '/api/categories'
  )
  const categories = catsData?.categories ?? []
  const [explicitCat, setExplicitCat] = useState<string | null>(null)
  const [search, setSearch] = useState('')

  // Effective active category = explicitly chosen OR first available
  const activeCat = explicitCat ?? categories[0]?.id ?? null

  const queryParams = useMemo(() => {
    const p = new URLSearchParams()
    if (activeCat) p.set('categoryId', activeCat)
    if (search) p.set('q', search)
    p.set('limit', '50')
    return p.toString()
  }, [activeCat, search])

  const { data: contentData, loading: contentLoading } = useApi<{ ok: boolean; items: ContentItem[] }>(
    `/api/content?${queryParams}`,
    [activeCat, search]
  )

  const items = contentData?.items ?? []

  return (
    <div className="px-4 pt-4 pb-32 max-w-lg mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.snappy}
        className="mb-5"
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="w-9 h-9 flex items-center justify-center"
            style={{
              background: 'var(--m3-primary)',
              color: 'var(--m3-on-primary)',
              borderRadius: 'var(--radius-m3-md)',
            }}
          >
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-bold leading-tight">{siteTitle}</h1>
            <p className="text-xs opacity-65">Premium content · Telegram Mini App</p>
          </div>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...springs.snappy, delay: 0.05 }}
        className="mb-4 flex items-center gap-2 p-3"
        style={{
          background: 'var(--m3-surface-container)',
          borderRadius: 'var(--radius-m3-full)',
        }}
      >
        <Search size={18} className="opacity-60" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search content..."
          className="flex-1 bg-transparent outline-none text-sm"
          style={{ color: 'var(--m3-on-surface)' }}
        />
      </motion.div>

      {/* Category chips */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="mb-5 -mx-4 px-4 overflow-x-auto no-scrollbar"
      >
        <div className="flex gap-2 pb-1">
          {catsLoading && !categories.length && (
            <>
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 w-24 rounded-full shimmer"
                  style={{ background: 'var(--m3-surface-container)' }}
                />
              ))}
            </>
          )}
          {categories.map((c, i) => {
            const Icon = (c.icon && ICONS[c.icon]) || Tag
            const isActive = activeCat === c.id
            return (
              <motion.button
                key={c.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ ...springs.soft, delay: i * 0.03 }}
                whileTap={{ scale: 0.94 }}
                onClick={() => setExplicitCat(c.id)}
                className="m3-chip"
                style={
                  isActive
                    ? {
                        background: 'var(--m3-primary)',
                        color: 'var(--m3-on-primary)',
                        borderColor: 'transparent',
                      }
                    : undefined
                }
              >
                <Icon size={14} />
                <span>{c.name}</span>
                <span
                  className="ml-1 text-xs opacity-70"
                  style={{
                    background: isActive
                      ? 'rgba(0,0,0,0.18)'
                      : 'var(--m3-surface-container-highest)',
                    padding: '0 0.4rem',
                    borderRadius: 'var(--radius-m3-full)',
                  }}
                >
                  {c.contentCount}
                </span>
              </motion.button>
            )
          })}
        </div>
      </motion.div>

      {/* Content grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={(activeCat || 'none') + search}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={springs.snappy}
        >
          {contentLoading && !items.length ? (
            <div className="grid grid-cols-2 gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="aspect-[3/4] rounded-2xl shimmer"
                  style={{ background: 'var(--m3-surface-container)' }}
                />
              ))}
            </div>
          ) : items.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              style={{ color: 'var(--m3-on-surface-variant)' }}
            >
              <div
                className="w-16 h-16 flex items-center justify-center mb-3"
                style={{
                  background: 'var(--m3-surface-container-high)',
                  borderRadius: 'var(--radius-m3-full)',
                }}
              >
                <Search size={28} className="opacity-50" />
              </div>
              <p className="text-sm font-medium">No content available</p>
              <p className="text-xs opacity-70 mt-1">
                Try a different category or search term.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {items.map((item, i) => (
                <motion.button
                  key={item.id}
                  initial={{ opacity: 0, y: 16, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ ...springs.bouncy, delay: i * 0.04 }}
                  whileTap={{ scale: 0.97 }}
                  whileHover={{ y: -3 }}
                  onClick={() => onOpenContent(item.id)}
                  className="m3-card m3-card-interactive text-left overflow-hidden"
                >
                  <div
                    className="aspect-[3/4] m3-thumbnail"
                    style={{
                      borderRadius:
                        'var(--radius-m3-lg) var(--radius-m3-lg) var(--radius-m3-xs) var(--radius-m3-xs)',
                    }}
                  >
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        loading="lazy"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon size={32} className="opacity-40" />
                      </div>
                    )}
                    {/* Point cost badge */}
                    <div
                      className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 text-xs font-semibold"
                      style={{
                        background: 'rgba(15,15,18,0.78)',
                        color: 'var(--m3-tertiary)',
                        borderRadius: 'var(--radius-m3-full)',
                        backdropFilter: 'blur(6px)',
                      }}
                    >
                      <Coins size={11} />
                      {item.pointCost}
                    </div>
                  </div>
                  <div className="p-3">
                    <h3 className="font-semibold text-sm line-clamp-1 mb-0.5">
                      {item.title}
                    </h3>
                    {item.category && (
                      <p className="text-xs opacity-60">{item.category.name}</p>
                    )}
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
