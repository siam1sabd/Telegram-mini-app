# Content Vault — Telegram Mini App

A premium-content download Telegram Mini App built with **Next.js 16**, **Material 3 Expressive** UI, **motion physics** animations, a **points + referral** system, **AdsGram** monetization, and **Turso** (libSQL) database — with a full admin panel.

![License](https://img.shields.io/badge/license-MIT-blue)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![Telegram](https://img.shields.io/badge/Telegram-Mini%20App-2CA5E0)

---

## ✨ Features

### User App
- 📱 **Telegram Mini App** — runs natively inside Telegram WebApp
- 🎨 **Material 3 Expressive UI** — varied shape library, expressive typography, warm dark plum palette
- 🌊 **Motion physics** — Framer Motion spring animations on every interaction
- 🔞 **First-time 18+ age gate** — stored locally + on the server
- 🗂️ **Top category navigation** — horizontal chips with content counts
- 🖼️ **Thumbnail grid** — dynamic content listing per category
- 📄 **Content details page** — hero, metadata, tags, download access
- 💎 **Points-based download** — 4 pts per download (configurable)
- 🎁 **First-time bonus** — new users get 20 pts on join
- 👥 **Referral system** — 30 pts per successful invite, deep-link based
- 📺 **AdsGram ads** — watch 2 ads to unlock a download free
- 👤 **Profile page** — points, stats, referral link, joined date
- 🧭 **Bottom navigation** — Home + Profile (motion-physics pill)
- 📱 **Fully responsive** — adapts to Android, iOS, varying DPI

### Admin Panel
- 🔐 **Secure admin auth** — bcrypt-hashed credentials, signed session cookie
- 📊 **Dashboard** — counts for users, categories, content, downloads, ad views, points
- 🗂️ **Category management** — CRUD + reorder
- 📦 **Content upload** — title, thumbnail, image, description, tags, download URL, point cost, visibility
- 🔗 **Download link management** — customize per content item
- 👥 **User management** — view all users with stats
- ⚙️ **Settings** — edit join bonus, referral reward, download cost, required ad count
- 📺 **AdsGram config** — enable/disable, set placement ID, script URL
- 🎨 **Site branding** — title and description

### Backend
- 🗄️ **Turso database** — libSQL via `@prisma/adapter-libsql` (auto-falls back to local SQLite in dev)
- 🔐 **Telegram initData validation** — HMAC-SHA256 against `BOT_TOKEN` (auto-bypasses in dev when token is absent)
- 🍪 **Admin session** — signed HMAC cookie, 12-hour expiry
- ✅ **Download validation** — server-side, prevents abuse, supports both points & ad methods
- 🔒 **Already-unlocked protection** — re-accessing a paid download is free

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- **Node.js 20+** and **Bun** (or npm/pnpm)
- A Telegram bot (via [@BotFather](https://t.me/BotFather))
- (Optional) A Turso account for production DB

### 1. Install dependencies

```bash
bun install        # or: npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Local SQLite works out-of-the-box for dev:
DATABASE_URL=file:./db/custom.db

# For production, swap to Turso (see Deployment section):
# TURSO_DATABASE_URL=libsql://your-db.turso.io
# TURSO_AUTH_TOKEN=...

# Telegram — required for production; optional in dev (app falls back to a fake user)
TELEGRAM_BOT_TOKEN=
TELEGRAM_BOT_USERNAME=YourMiniAppBot

# First-time admin credentials (get hashed & persisted after first login)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
ADMIN_SESSION_SECRET=run: openssl rand -hex 32
```

### 3. Push database schema & seed demo data

```bash
bun run db:push
curl -X POST http://localhost:3000/api/admin/seed
```

This creates:
- 4 demo categories (Anime, Wallpapers, Movies, Music)
- 6 demo content items
- Default settings (20 / 30 / 4 / 2)

### 4. Run the dev server

```bash
bun run dev      # http://localhost:3000
```

Open `http://localhost:3000` in your browser to preview the user app.
Open `http://localhost:3000/?admin=1` to access the admin panel.

---

## 📦 Project Structure

```
.
├── prisma/
│   └── schema.prisma              # Database schema (9 models)
├── public/                         # Static assets
├── src/
│   ├── app/
│   │   ├── api/                    # API routes (auth, users, categories,
│   │   │                           #   content, ads, settings, admin)
│   │   ├── globals.css             # Material 3 Expressive design system
│   │   ├── layout.tsx              # Root layout with Telegram SDK preconnect
│   │   └── page.tsx                # Single-page app shell (state-based router)
│   ├── components/
│   │   ├── age-gate.tsx            # 18+ confirmation popup
│   │   ├── bottom-nav.tsx          # Motion-physics bottom navigation
│   │   ├── home-view.tsx           # Home: search + category chips + content grid
│   │   ├── content-detail-view.tsx # Details: hero + download (points/ads)
│   │   ├── profile-view.tsx        # Profile: points, referral, stats
│   │   ├── admin-panel.tsx         # Admin: login, dashboard, CRUD, settings
│   │   └── ui/                     # shadcn/ui primitives
│   └── lib/
│       ├── db.ts                   # Turso + SQLite-aware Prisma client
│       ├── settings.ts             # Key-value settings with defaults
│       ├── tg-auth.ts              # Telegram initData HMAC validator
│       ├── admin-session.ts        # Signed admin cookie helpers
│       ├── user-service.ts         # Get-or-create user + bonus + referral
│       ├── telegram.ts             # useTelegram() SDK hook
│       ├── adsgram.ts              # useAdsgram() SDK hook
│       └── api-client.ts           # Auth-injecting fetch + useApi() hook
├── .env.example
├── vercel.json
├── netlify.toml
└── README.md
```

---

## 🗄️ Database Schema (Prisma)

| Model | Purpose |
|---|---|
| `User` | Telegram users — points, referral code, age confirmation |
| `AdminUser` | Admin panel credentials (bcrypt-hashed) |
| `AgeConfirmation` | Audit log of 18+ confirmations |
| `Category` | Content categories — name, slug, icon, order |
| `Content` | Downloadable items — title, thumbnail, download URL, point cost, visibility |
| `DownloadHistory` | Every successful unlock — points spent OR ads method |
| `AdView` | Every ad watched — per user, per content |
| `Referral` | Aggregate referral stats per referrer |
| `Setting` | Key-value app settings (overridable from admin panel) |

---

## ☁️ Deployment

### A) Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repo.
3. Add environment variables (see `.env.example`):
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` (required — Vercel can't use local SQLite)
   - `TELEGRAM_BOT_TOKEN`, `TELEGRAM_BOT_USERNAME`
   - `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET`
4. Click **Deploy** — Vercel auto-detects Next.js from `vercel.json`.
5. After deploy, run the seed once:
   ```bash
   curl -X POST https://your-app.vercel.app/api/admin/seed \
     -H "Authorization: Bearer $ADMIN_PASSWORD"
   ```
6. In @BotFather → `/newapp` → set Web App URL to `https://your-app.vercel.app`.

### B) Deploy to Netlify

1. Push this repo to GitHub.
2. Go to [app.netlify.com/start](https://app.netlify.com/start) and import the repo.
3. Build settings auto-load from `netlify.toml`:
   - **Build command:** `bun run build`
   - **Publish directory:** `.next`
4. Add the same environment variables as Vercel.
5. Click **Deploy site**.
6. Run the seed:
   ```bash
   curl -X POST https://your-app.netlify.app/api/admin/seed \
     -H "Authorization: Bearer $ADMIN_PASSWORD"
   ```
7. In @BotFather → set Web App URL to your Netlify URL.

### C) Set up Turso Database (required for both)

```bash
# 1. Install Turso CLI
brew install tursodatabase/tap/turso      # macOS
# or: curl -sSfL https://get.turso.io | bash   # Linux

# 2. Login & create database
turso auth login
turso db create content-vault

# 3. Get the URL and a token
turso db show content-vault --url
# → libsql://content-vault-<you>.turso.io

turso db tokens create content-vault
# → eyJhbGciOi...

# 4. Set env vars in your deploy platform
# TURSO_DATABASE_URL = libsql://content-vault-<you>.turso.io
# TURSO_AUTH_TOKEN   = eyJhbGciOi...
```

---

## 🤖 Telegram Bot Setup

1. Open [@BotFather](https://t.me/BotFather) in Telegram.
2. Send `/newbot` → choose name + username → save the **bot token**.
3. Send `/newapp` (or use the menu) → choose your bot → set:
   - **Title:** Content Vault
   - **Description:** Premium content downloads
   - **Web App URL:** `https://your-deploy-url`
   - **Photo:** any 640x360 image
4. (Optional) Set a menu button:
   ```
   /setmenubutton → choose bot → https://your-deploy-url → "Open Vault"
   ```
5. Test by opening your bot in Telegram and tapping the menu button.

### Referral links

Referral links use Telegram's `startapp` parameter:
```
https://t.me/<YourBotUsername>?startapp=ref_<referralCode>
```
When a NEW user opens the app via this link, the referrer automatically gets 30 pts.

---

## 📺 AdsGram Integration

1. Sign up at [adsgram.ai](https://adsgram.ai) and create a placement.
2. Copy the **Block ID**.
3. Set it either:
   - In `.env` as `ADSGRAM_PLACEMENT_ID=...`, **or**
   - In the **Admin Panel → Settings → AdsGram Configuration** (persists to DB).
4. The user app loads the AdsGram script automatically when a placement ID is set.
5. The "Watch Ad" button on content details calls `Adsgram.show()` and records completion via `/api/ads/track`.
6. After the configured number of ads (default 2), the user can unlock the download for free.

---

## 🔒 Security Notes

- **Telegram initData validation**: When `TELEGRAM_BOT_TOKEN` is set, the server validates the HMAC-SHA256 hash of incoming `initData` per [Telegram's spec](https://core.telegram.org/bots/webapps#validating-data-received-via-the-mini-app). When unset (e.g. local dev), the app accepts a synthesized user marked as `dev: true`.
- **Admin auth**: First-time login with `ADMIN_USERNAME` / `ADMIN_PASSWORD` env vars creates the admin row with a bcrypt hash. Subsequent logins validate against the hash. The session is a signed HMAC cookie valid for 12 hours.
- **Download URL protection**: Content `downloadUrl` is **never** returned in public content responses — only via the validated `/api/content/[id]/download` endpoint after points deduction or ad completion.
- **Re-access**: Once a user has unlocked a content item, they can re-fetch the download URL for free (no re-charge).
- **Referral abuse prevention**: Self-referrals are blocked, and only NEW users (created via the referral link) trigger the referrer reward.

---

## 🎨 Design System

The Material 3 Expressive design tokens live in `src/app/globals.css`:

| Token | Example |
|---|---|
| `--m3-primary` | `#D9C2FF` |
| `--m3-surface-container-high` | `#2A2A31` |
| `--radius-m3-xl` | `28px` |
| `--spring-snappy` | `cubic-bezier(0.16, 1, 0.3, 1)` |

Helper classes: `.m3-card`, `.m3-button-filled`, `.m3-button-tonal`, `.m3-chip`, `.m3-input`, `.m3-thumbnail`, `.m3-shape-expressive` (asymmetric corner), `.m3-elevated`, `.m3-ring-glow`.

Framer Motion spring presets are exported from `src/lib/api-client.ts`:
```ts
import { springs } from '@/lib/api-client'
// springs.soft | springs.snappy | springs.bouncy | springs.gentle
```

---

## 🧪 API Reference

### Public
| Method | Path | Description |
|---|---|---|
| `GET` | `/api/categories` | List all categories |
| `GET` | `/api/content?categoryId=...&q=...` | List content (filtered) |
| `GET` | `/api/content/[id]` | Get content details (no download URL) |
| `GET` | `/api/settings` | Public settings (point cost, ad count, etc.) |

### Authenticated (Telegram initData)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/telegram` | Resolve user (creates if new) |
| `GET` | `/api/users/me` | Current user + stats + settings |
| `POST` | `/api/users/age-confirm` | Mark 18+ confirmed |
| `GET` | `/api/users/referral-link` | Get referral deep link |
| `POST` | `/api/content/[id]/download` | Unlock download (`method: points\|ads`) |
| `POST` | `/api/ads/track` | Record ad view (`status: started\|completed`) |
| `GET` | `/api/ads/status?contentId=...` | Ad progress |

### Admin (signed cookie)
| Method | Path | Description |
|---|---|---|
| `POST` | `/api/auth/admin/login` | Admin login |
| `POST` | `/api/auth/admin/logout` | Admin logout |
| `GET` | `/api/auth/admin/me` | Current admin session |
| `POST/GET/PATCH/DELETE` | `/api/categories` & `/api/categories/[id]` | Category CRUD |
| `POST/GET/PATCH/DELETE` | `/api/content` & `/api/content/[id]` | Content CRUD |
| `GET` | `/api/admin/stats` | Dashboard counts |
| `GET` | `/api/admin/users` | Paginated user list |
| `GET/PUT` | `/api/settings` | Get/update all settings |
| `POST` | `/api/admin/seed` | First-time seed |

---

## 📝 Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bun run start` | Start production server |
| `bun run lint` | Run ESLint |
| `bun run db:push` | Push schema to DB |
| `bun run db:generate` | Regenerate Prisma Client |
| `bun run db:migrate` | Create migration |

---

## 🤝 Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4 + Material 3 Expressive design tokens
- **UI Components:** shadcn/ui (New York) + custom M3 components
- **Animation:** Framer Motion (spring physics)
- **Database:** Prisma ORM + Turso (libSQL)
- **Auth:** Telegram WebApp initData + custom admin cookie session
- **Ad monetization:** AdsGram SDK
- **Package manager:** Bun (also works with npm/pnpm)

---

## 📄 License

MIT — use freely for commercial and personal projects.
