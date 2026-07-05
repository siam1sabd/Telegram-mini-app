'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LayoutDashboard, FolderTree, FilePlus, Settings as SettingsIcon,
  LogOut, Lock, Eye, EyeOff, Plus, Edit, Trash2, Save, X,
  ArrowLeft, Users, Coins, Download, Eye as EyeIcon, Shield,
  GripVertical, Check, Image as ImageIcon, ExternalLink, Sparkles,
} from 'lucide-react'
import { apiFetch, springs } from '@/lib/api-client'

type AdminSection = 'login' | 'dashboard' | 'categories' | 'content' | 'users' | 'settings'

interface ContentItem {
  id: string
  title: string
  description?: string | null
  thumbnailUrl?: string | null
  imageUrl?: string | null
  downloadUrl?: string
  categoryId: string
  visibility: boolean
  pointCost: number
  tags?: string | null
}
interface Category {
  id: string
  name: string
  slug: string
  description?: string | null
  icon?: string | null
  order: number
  contentCount?: number
}

export default function AdminPanel() {
  const [section, setSection] = useState<AdminSection>('login')
  const [authed, setAuthed] = useState(false)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [me, setMe] = useState<string | null>(null)

  useEffect(() => {
    // Check existing session
    apiFetch<{ ok: boolean; username?: string }>('/api/auth/admin/me').then((r) => {
      if (r.ok && r.username) {
        setAuthed(true)
        setMe(r.username)
        setSection('dashboard')
      }
    })
  }, [])

  const handleLogin = async () => {
    setBusy(true); setLoginErr(null)
    try {
      const r = await apiFetch<{ ok: boolean; error?: string; username?: string }>(
        '/api/auth/admin/login',
        { method: 'POST', body: JSON.stringify({ username, password }) }
      )
      if (r.ok) {
        setAuthed(true)
        setMe(r.username || username)
        setSection('dashboard')
      } else {
        setLoginErr(r.error || 'Login failed')
      }
    } finally { setBusy(false) }
  }

  const handleLogout = async () => {
    await apiFetch('/api/auth/admin/logout', { method: 'POST' })
    setAuthed(false); setMe(null); setSection('login'); setUsername(''); setPassword('')
  }

  if (!authed || section === 'login') {
    return (
      <div className="px-4 pt-10 pb-32 max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={springs.snappy}
          className="p-6 m3-elevated"
          style={{ background: 'var(--m3-surface-container-high)', borderRadius: 'var(--radius-m3-2xl)' }}
        >
          <div className="flex items-center gap-3 mb-5">
            <div
              className="w-12 h-12 flex items-center justify-center"
              style={{
                background: 'var(--m3-primary)',
                color: 'var(--m3-on-primary)',
                borderRadius: 'var(--radius-m3-md)',
              }}
            >
              <Shield size={22} />
            </div>
            <div>
              <h1 className="text-xl font-bold">Admin Access</h1>
              <p className="text-xs opacity-70">Sign in to manage your Mini App</p>
            </div>
          </div>

          {loginErr && (
            <div
              className="mb-3 p-2.5 text-xs"
              style={{
                background: 'var(--m3-error-container)',
                color: 'var(--m3-on-error-container)',
                borderRadius: 'var(--radius-m3-sm)',
              }}
            >
              {loginErr}
            </div>
          )}

          <div className="space-y-3">
            <div>
              <label className="text-xs opacity-70 mb-1 block">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="admin"
                className="m3-input"
                autoCapitalize="none"
              />
            </div>
            <div>
              <label className="text-xs opacity-70 mb-1 block">Password</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
                  placeholder="••••••••"
                  className="m3-input pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 opacity-70"
                >
                  {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button
              onClick={handleLogin}
              disabled={busy || !username || !password}
              className="m3-button m3-button-filled w-full disabled:opacity-50"
            >
              {busy ? 'Signing in...' : (<><Lock size={16} /> Sign In</>)}
            </button>
            <p className="text-xs text-center opacity-60 mt-2">
              Default first-time credentials: <code className="font-mono">admin / admin123</code>
              <br />
              (Override via <code className="font-mono">ADMIN_USERNAME</code> / <code className="font-mono">ADMIN_PASSWORD</code> env vars)
            </p>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-4 pb-32 max-w-3xl mx-auto">
      {/* Admin header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={springs.snappy}
        className="flex items-center justify-between mb-4"
      >
        <div className="flex items-center gap-2">
          <div
            className="w-9 h-9 flex items-center justify-center"
            style={{
              background: 'var(--m3-primary)',
              color: 'var(--m3-on-primary)',
              borderRadius: 'var(--radius-m3-md)',
            }}
          >
            <Shield size={18} />
          </div>
          <div>
            <h1 className="text-lg font-bold">Admin Panel</h1>
            <p className="text-xs opacity-60">@{me}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="m3-button m3-button-text" style={{ color: 'var(--m3-error)' }}>
          <LogOut size={16} /> Logout
        </button>
      </motion.div>

      {/* Section tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto no-scrollbar -mx-4 px-4">
        {[
          { id: 'dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
          { id: 'categories' as const, label: 'Categories', icon: FolderTree },
          { id: 'content' as const, label: 'Content', icon: FilePlus },
          { id: 'users' as const, label: 'Users', icon: Users },
          { id: 'settings' as const, label: 'Settings', icon: SettingsIcon },
        ].map((t) => {
          const Icon = t.icon
          const active = section === t.id
          return (
            <button
              key={t.id}
              onClick={() => setSection(t.id)}
              className="m3-chip"
              style={
                active
                  ? { background: 'var(--m3-primary)', color: 'var(--m3-on-primary)', borderColor: 'transparent' }
                  : undefined
              }
            >
              <Icon size={14} /> {t.label}
            </button>
          )
        })}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={section}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={springs.snappy}
        >
          {section === 'dashboard' && <DashboardSection />}
          {section === 'categories' && <CategoriesSection />}
          {section === 'content' && <ContentSection />}
          {section === 'users' && <UsersSection />}
          {section === 'settings' && <SettingsSection />}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

/* ============ Dashboard ============ */
function DashboardSection() {
  const [stats, setStats] = useState<any>(null)
  useEffect(() => {
    apiFetch<{ ok: boolean; stats?: any }>('/api/admin/stats').then((r) => {
      if (r.ok && r.stats) setStats(r.stats)
    })
  }, [])

  if (!stats) return <div className="text-center opacity-60 py-10">Loading...</div>

  const cards = [
    { label: 'Users', value: stats.users, icon: Users, color: 'var(--m3-primary)' },
    { label: 'Categories', value: stats.categories, icon: FolderTree, color: 'var(--m3-secondary)' },
    { label: 'Content Items', value: stats.contents, icon: FilePlus, color: 'var(--m3-tertiary)' },
    { label: 'Downloads', value: stats.downloads, icon: Download, color: 'var(--m3-accent)' },
    { label: 'Ad Views', value: stats.adViews, icon: EyeIcon, color: 'var(--m3-secondary)' },
    { label: 'Points in Circulation', value: stats.totalPointsInCirculation, icon: Coins, color: 'var(--m3-tertiary)' },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {cards.map((c, i) => {
        const Icon = c.icon
        return (
          <motion.div
            key={c.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...springs.bouncy, delay: i * 0.04 }}
            className="p-4 m3-card"
          >
            <Icon size={18} className="mb-2" style={{ color: c.color }} />
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs opacity-65">{c.label}</p>
          </motion.div>
        )
      })}
    </div>
  )
}

/* ============ Categories ============ */
function CategoriesSection() {
  const [cats, setCats] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '', icon: '' })

  const load = async () => {
    setLoading(true)
    const r = await apiFetch<{ ok: boolean; categories: Category[] }>('/api/categories')
    if (r.ok) setCats(r.categories)
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const handleSave = async () => {
    if (!form.name) return
    if (editing) {
      await apiFetch(`/api/categories/${editing.id}`, {
        method: 'PATCH',
        body: JSON.stringify(form),
      })
    } else {
      await apiFetch('/api/categories', {
        method: 'POST',
        body: JSON.stringify(form),
      })
    }
    setForm({ name: '', description: '', icon: '' })
    setEditing(null); setShowForm(false)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? All content inside will also be removed.')) return
    await apiFetch(`/api/categories/${id}`, { method: 'DELETE' })
    load()
  }

  const moveOrder = async (id: string, dir: -1 | 1) => {
    const idx = cats.findIndex((c) => c.id === id)
    const target = idx + dir
    if (target < 0 || target >= cats.length) return
    const updates = cats.map((c, i) => ({ id: c.id, order: i + 1 }))
    // Swap
    const a = updates[idx].order
    updates[idx].order = updates[target].order
    updates[target].order = a
    await apiFetch('/api/categories', { method: 'PATCH', body: JSON.stringify({ updates }) })
    load()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold">Categories ({cats.length})</h2>
        <button
          onClick={() => { setForm({ name: '', description: '', icon: '' }); setEditing(null); setShowForm(true) }}
          className="m3-button m3-button-filled"
        >
          <Plus size={16} /> New
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 mb-3 m3-card"
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs opacity-70 block mb-1">Name</label>
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="m3-input" placeholder="e.g. Anime" />
            </div>
            <div>
              <label className="text-xs opacity-70 block mb-1">Icon (sparkles, image, film, music, tag)</label>
              <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="m3-input" placeholder="sparkles" />
            </div>
            <div>
              <label className="text-xs opacity-70 block mb-1">Description</label>
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="m3-input" rows={2} />
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="m3-button m3-button-filled flex-1">
                <Save size={16} /> {editing ? 'Update' : 'Create'}
              </button>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="m3-button m3-button-text">
                <X size={16} /> Cancel
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center opacity-60 py-8">Loading...</div>
      ) : (
        <div className="space-y-2">
          {cats.map((c, i) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springs.soft, delay: i * 0.03 }}
              className="p-3 m3-card flex items-center gap-3"
            >
              <div className="flex flex-col gap-0.5">
                <button onClick={() => moveOrder(c.id, -1)} disabled={i === 0} className="opacity-50 hover:opacity-100 disabled:opacity-20">
                  <GripVertical size={14} className="rotate-180" />
                </button>
                <button onClick={() => moveOrder(c.id, 1)} disabled={i === cats.length - 1} className="opacity-50 hover:opacity-100 disabled:opacity-20">
                  <GripVertical size={14} />
                </button>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{c.name}</p>
                <p className="text-xs opacity-60">
                  {c.contentCount ?? 0} items · /{c.slug}
                </p>
                {c.description && (
                  <p className="text-xs opacity-70 mt-0.5 truncate">{c.description}</p>
                )}
              </div>
              <button
                onClick={() => { setEditing(c); setForm({ name: c.name, description: c.description || '', icon: c.icon || '' }); setShowForm(true) }}
                className="p-2"
                style={{ background: 'var(--m3-surface-container-high)', borderRadius: 'var(--radius-m3-sm)' }}
              >
                <Edit size={14} />
              </button>
              <button
                onClick={() => handleDelete(c.id)}
                className="p-2"
                style={{ background: 'var(--m3-error-container)', color: 'var(--m3-on-error-container)', borderRadius: 'var(--radius-m3-sm)' }}
              >
                <Trash2 size={14} />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============ Content ============ */
function ContentSection() {
  const [cats, setCats] = useState<Category[]>([])
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<ContentItem | null>(null)
  const emptyForm = {
    title: '', description: '', thumbnailUrl: '', imageUrl: '',
    metadata: '', downloadUrl: '', categoryId: '', visibility: true,
    pointCost: 4, tags: '',
  }
  const [form, setForm] = useState<any>(emptyForm)

  const loadCats = async () => {
    const r = await apiFetch<{ ok: boolean; categories: Category[] }>('/api/categories')
    if (r.ok) setCats(r.categories)
  }
  const loadItems = async () => {
    setLoading(true)
    // Admin sees all content — fetch without visibility filter by using direct DB-like query
    // We'll fetch via the regular endpoint per-category. For simplicity, fetch all categories' content.
    const allItems: ContentItem[] = []
    if (cats.length === 0) await loadCats()
    for (const c of (cats.length ? cats : [])) {
      const r = await apiFetch<{ ok: boolean; items: any[] }>(`/api/content?categoryId=${c.id}&limit=100`)
      if (r.ok) allItems.push(...r.items.map((it) => ({ ...it, downloadUrl: it.downloadUrl ?? '' })))
    }
    setItems(allItems)
    setLoading(false)
  }
  useEffect(() => { loadCats().then(loadItems) }, [])

  const handleSave = async () => {
    if (!form.title || !form.downloadUrl || !form.categoryId) {
      alert('Title, Download URL, and Category are required')
      return
    }
    const body = { ...form, pointCost: parseInt(form.pointCost, 10) || 4 }
    if (editing) {
      await apiFetch(`/api/content/${editing.id}`, { method: 'PATCH', body: JSON.stringify(body) })
    } else {
      await apiFetch('/api/content', { method: 'POST', body: JSON.stringify(body) })
    }
    setForm(emptyForm); setEditing(null); setShowForm(false)
    loadItems()
  }

  const handleEdit = (it: any) => {
    setEditing(it)
    setForm({
      title: it.title || '',
      description: it.description || '',
      thumbnailUrl: it.thumbnailUrl || '',
      imageUrl: it.imageUrl || '',
      metadata: '',
      downloadUrl: it.downloadUrl || '',
      categoryId: it.category?.id || it.categoryId || '',
      visibility: it.visibility ?? true,
      pointCost: it.pointCost ?? 4,
      tags: it.tags || '',
    })
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this content item?')) return
    await apiFetch(`/api/content/${id}`, { method: 'DELETE' })
    loadItems()
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-bold">Content ({items.length})</h2>
        <button
          onClick={() => { setForm({ ...emptyForm, categoryId: cats[0]?.id || '' }); setEditing(null); setShowForm(true) }}
          className="m3-button m3-button-filled"
        >
          <Plus size={16} /> Upload
        </button>
      </div>

      {showForm && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="p-4 mb-3 m3-card"
        >
          <div className="space-y-3">
            <Field label="Title *">
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="m3-input" />
            </Field>
            <Field label="Category *">
              <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="m3-input">
                <option value="">Select...</option>
                {cats.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Thumbnail URL">
              <input value={form.thumbnailUrl} onChange={(e) => setForm({ ...form, thumbnailUrl: e.target.value })} className="m3-input" placeholder="https://..." />
              {form.thumbnailUrl && (
                <div className="mt-2 aspect-video rounded-lg overflow-hidden" style={{ background: 'var(--m3-surface-container)' }}>
                  <img src={form.thumbnailUrl} alt="thumb" className="w-full h-full object-cover" />
                </div>
              )}
            </Field>
            <Field label="Image URL (full-size hero)">
              <input value={form.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} className="m3-input" placeholder="https://..." />
            </Field>
            <Field label="Download URL * (admin-configurable)">
              <input value={form.downloadUrl} onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })} className="m3-input" placeholder="https://example.com/file.zip" />
            </Field>
            <Field label="Description">
              <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="m3-input" rows={3} />
            </Field>
            <Field label="Tags (comma-separated)">
              <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} className="m3-input" placeholder="4k, dark, anime" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Point Cost">
                <input type="number" value={form.pointCost} onChange={(e) => setForm({ ...form, pointCost: e.target.value })} className="m3-input" min={0} />
              </Field>
              <Field label="Visibility">
                <label className="flex items-center gap-2 mt-2">
                  <input
                    type="checkbox"
                    checked={form.visibility}
                    onChange={(e) => setForm({ ...form, visibility: e.target.checked })}
                  />
                  <span className="text-sm">Published</span>
                </label>
              </Field>
            </div>
            <div className="flex gap-2">
              <button onClick={handleSave} className="m3-button m3-button-filled flex-1">
                <Save size={16} /> {editing ? 'Update' : 'Create'}
              </button>
              <button onClick={() => { setShowForm(false); setEditing(null) }} className="m3-button m3-button-text">
                <X size={16} />
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="text-center opacity-60 py-8">Loading...</div>
      ) : items.length === 0 ? (
        <div className="text-center opacity-60 py-8">
          <ImageIcon size={32} className="mx-auto mb-2 opacity-50" />
          No content yet. Click Upload to add your first item.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((it, i) => (
            <motion.div
              key={it.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ ...springs.soft, delay: i * 0.02 }}
              className="p-2 m3-card flex gap-3"
            >
              <div
                className="w-16 h-16 flex-shrink-0 overflow-hidden"
                style={{ borderRadius: 'var(--radius-m3-md)' }}
              >
                {it.thumbnailUrl ? (
                  <img src={it.thumbnailUrl} alt={it.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--m3-surface-container-high)' }}>
                    <ImageIcon size={20} className="opacity-50" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{it.title}</p>
                <p className="text-xs opacity-60 truncate">
                  {it.category?.name || 'Uncategorized'} · {it.pointCost} pts
                </p>
                <div className="flex items-center gap-1 mt-1">
                  {it.visibility ? (
                    <span className="text-[10px] px-1.5 py-0.5" style={{ background: 'var(--m3-accent)', color: 'var(--m3-on-accent)', borderRadius: 4 }}>Published</span>
                  ) : (
                    <span className="text-[10px] px-1.5 py-0.5" style={{ background: 'var(--m3-surface-container-high)', borderRadius: 4 }}>Hidden</span>
                  )}
                  {it.downloadUrl && (
                    <a href={it.downloadUrl} target="_blank" rel="noreferrer" className="text-[10px] opacity-70 flex items-center gap-0.5">
                      <ExternalLink size={10} /> link
                    </a>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button onClick={() => handleEdit(it)} className="p-1.5" style={{ background: 'var(--m3-surface-container-high)', borderRadius: 6 }}>
                  <Edit size={12} />
                </button>
                <button onClick={() => handleDelete(it.id)} className="p-1.5" style={{ background: 'var(--m3-error-container)', color: 'var(--m3-on-error-container)', borderRadius: 6 }}>
                  <Trash2 size={12} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============ Users ============ */
function UsersSection() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    apiFetch<{ ok: boolean; users?: any[]; total?: number }>('/api/admin/users?limit=100').then((r) => {
      if (r.ok) { setUsers(r.users || []); setTotal(r.total || 0) }
      setLoading(false)
    })
  }, [])

  return (
    <div>
      <h2 className="font-bold mb-3">Users ({total})</h2>
      {loading ? (
        <div className="text-center opacity-60 py-8">Loading...</div>
      ) : users.length === 0 ? (
        <div className="text-center opacity-60 py-8">No users yet.</div>
      ) : (
        <div className="space-y-2">
          {users.map((u, i) => (
            <motion.div
              key={u.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ ...springs.soft, delay: i * 0.02 }}
              className="p-3 m3-card flex items-center gap-3"
            >
              <div
                className="w-10 h-10 flex items-center justify-center font-bold"
                style={{
                  background: 'var(--m3-primary)',
                  color: 'var(--m3-on-primary)',
                  borderRadius: 'var(--radius-m3-full)',
                }}
              >
                {(u.firstName || u.username || '?').charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">
                  {u.firstName} {u.lastName || ''}
                </p>
                <p className="text-xs opacity-60 truncate">@{u.username || 'unknown'} · ID {u.telegramId}</p>
                <div className="flex gap-2 mt-1 text-[10px] opacity-75">
                  <span>{u.points} pts</span>
                  <span>·</span>
                  <span>{u.downloadsCount} dl</span>
                  <span>·</span>
                  <span>{u.referralsCount} refs</span>
                </div>
              </div>
              <div className="text-right text-xs opacity-70">
                {new Date(u.joinedAt).toLocaleDateString()}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

/* ============ Settings ============ */
function SettingsSection() {
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    apiFetch<{ ok: boolean; settings?: Record<string, string> }>('/api/settings').then((r) => {
      if (r.ok && r.settings) setSettings(r.settings)
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    await apiFetch('/api/settings', { method: 'PUT', body: JSON.stringify(settings) })
    setSaving(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  if (loading) return <div className="text-center opacity-60 py-8">Loading...</div>

  return (
    <div className="space-y-4">
      {/* Points config */}
      <div className="p-4 m3-card">
        <div className="flex items-center gap-2 mb-3">
          <Coins size={18} style={{ color: 'var(--m3-tertiary)' }} />
          <h3 className="font-semibold text-sm">Points & Rewards</h3>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Join bonus (pts)">
            <input type="number" value={settings.joinBonus || '20'} onChange={(e) => setSettings({ ...settings, joinBonus: e.target.value })} className="m3-input" />
          </Field>
          <Field label="Referral reward (pts)">
            <input type="number" value={settings.referralReward || '30'} onChange={(e) => setSettings({ ...settings, referralReward: e.target.value })} className="m3-input" />
          </Field>
          <Field label="Download cost (pts)">
            <input type="number" value={settings.downloadPointCost || '4'} onChange={(e) => setSettings({ ...settings, downloadPointCost: e.target.value })} className="m3-input" />
          </Field>
          <Field label="Required ad count">
            <input type="number" value={settings.requiredAdCount || '2'} onChange={(e) => setSettings({ ...settings, requiredAdCount: e.target.value })} className="m3-input" />
          </Field>
        </div>
      </div>

      {/* AdsGram config */}
      <div className="p-4 m3-card">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={18} style={{ color: 'var(--m3-primary)' }} />
          <h3 className="font-semibold text-sm">AdsGram Configuration</h3>
        </div>
        <div className="space-y-3">
          <Field label="AdsGram enabled">
            <select value={settings.adsgramEnabled || 'true'} onChange={(e) => setSettings({ ...settings, adsgramEnabled: e.target.value })} className="m3-input">
              <option value="true">Enabled</option>
              <option value="false">Disabled</option>
            </select>
          </Field>
          <Field label="AdsGram Block/Placement ID">
            <input value={settings.adsgramPlacementId || ''} onChange={(e) => setSettings({ ...settings, adsgramPlacementId: e.target.value })} className="m3-input" placeholder="e.g. 1234-abcd-5678" />
          </Field>
          <Field label="AdsGram Script URL (optional)">
            <input value={settings.adsgramScriptUrl || ''} onChange={(e) => setSettings({ ...settings, adsgramScriptUrl: e.target.value })} className="m3-input" placeholder="https://sad.adsgram.ai/js/integration2.js" />
          </Field>
          <p className="text-xs opacity-65">
            Get your placement ID from the AdsGram dashboard at adsgram.ai.
            Changes apply on next app load.
          </p>
        </div>
      </div>

      {/* Site config */}
      <div className="p-4 m3-card">
        <div className="flex items-center gap-2 mb-3">
          <SettingsIcon size={18} style={{ color: 'var(--m3-secondary)' }} />
          <h3 className="font-semibold text-sm">Site Branding</h3>
        </div>
        <div className="space-y-3">
          <Field label="Site title">
            <input value={settings.siteTitle || ''} onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })} className="m3-input" />
          </Field>
          <Field label="Site description">
            <input value={settings.siteDescription || ''} onChange={(e) => setSettings({ ...settings, siteDescription: e.target.value })} className="m3-input" />
          </Field>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="m3-button m3-button-filled w-full"
      >
        {saving ? 'Saving...' : saved ? (<><Check size={16} /> Saved!</>) : (<><Save size={16} /> Save All Settings</>)}
      </button>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs opacity-70 block mb-1">{label}</label>
      {children}
    </div>
  )
}
