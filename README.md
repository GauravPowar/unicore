# ShodhConnect 🔬

**An interdisciplinary researcher network connecting scientists and academics across India.**

> Built with Next.js 16 · Supabase · Tailwind CSS v4 · KaTeX · Supabase Realtime

---

## ✨ Features

| Feature | Description |
|---|---|
| 🏛️ **Institutional Verification** | Auto-badges for `*.ac.in`, `*.edu.in`, `*.res.in` email domains |
| 🆔 **ORCID Integration** | Optional ORCID iD field with format validation |
| 📝 **Micro-Thoughts Feed** | LaTeX + Markdown posts with drag-and-drop image upload |
| 🧵 **Niche Forums** | Per-discipline boards with nested comments |
| 📂 **Researcher Directory** | Filterable grid by institution, discipline, skills, collab status |
| 💬 **Real-Time DMs** | 1-on-1 messaging via Supabase Realtime (`postgres_changes`) |
| 🌙 **Dark / Light Mode** | System-preference aware, toggleable |
| 🧪 **Mock Data Mode** | Full UI preview without live Supabase credentials |

---

## 🚀 Quick Start

### Prerequisites
- Node.js ≥ 18
- A [Supabase](https://supabase.com) account (free tier is sufficient)

### 1. Clone & Install

```bash
git clone https://github.com/your-username/shodhconnect.git
cd shodhconnect
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase project credentials
```

### 3. Set Up Database

In your Supabase SQL editor, run the migrations in order:

```bash
# Option A: Supabase CLI
supabase db push

# Option B: Manual — paste into Supabase SQL Editor
# 1. supabase/migrations/001_initial_schema.sql
# 2. supabase/seed.sql  (optional sample data)
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> **No Supabase credentials yet?** Set `NEXT_PUBLIC_USE_MOCK_DATA=true` in `.env.local` (or leave it unset) — the app renders fully with built-in mock data.

---

## 🏗️ Project Structure

```
shodhconnect/
├── src/
│   ├── app/                        # Next.js App Router pages
│   │   ├── (auth)/                 # Login / signup route group
│   │   ├── forums/[slug]/          # Per-forum discussion board
│   │   ├── directory/              # Researcher directory
│   │   ├── messages/               # Real-time DM drawer
│   │   └── layout.tsx              # Root layout (sidebar + theme)
│   ├── components/                 # Shared UI components
│   │   ├── feed/                   # Post cards, composer
│   │   ├── forums/                 # Forum thread views
│   │   ├── directory/              # Researcher cards, filters
│   │   ├── messages/               # Chat UI
│   │   └── ui/                     # Primitives (Button, Badge, etc.)
│   ├── lib/
│   │   ├── supabase/               # Client + server Supabase instances
│   │   ├── mock-data.ts            # Fallback data for preview mode
│   │   ├── validators.ts           # Email domain + ORCID validators
│   │   └── utils.ts                # cn(), formatDate(), etc.
│   └── types/                      # Shared TypeScript types (DB row types)
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Full schema + RLS policies
│   └── seed.sql                    # 6 forums, 5 posts, 3 profiles
├── public/
├── .env.example
└── README.md
```

---

## 🗄️ Database Schema

```
profiles        ← auto-created on signup; RLS-protected
forums          ← 6 seeded interdisciplinary boards
posts           ← Markdown + LaTeX content; media_urls[]
comments        ← nested (parent_comment_id nullable)
messages        ← Realtime-enabled; sender/receiver RLS
post_upvotes    ← dedup table; trigger syncs upvotes_count
```

**Row Level Security** is enabled on all tables. Users can only write their own rows; messages are only visible to sender and receiver.

---

## 🔐 Institutional Verification Logic

```typescript
// src/lib/validators.ts
const INDIAN_ACADEMIC_DOMAINS = ['.ac.in', '.edu.in', '.res.in'];

export function isIndianAcademicEmail(email: string): boolean {
  const domain = email.split('@')[1]?.toLowerCase() ?? '';
  return INDIAN_ACADEMIC_DOMAINS.some(suffix => domain.endsWith(suffix));
}

export function isValidOrcidId(orcid: string): boolean {
  return /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(orcid);
}
```

The database trigger `handle_new_user()` automatically sets `is_verified_researcher = true` for matching domains at signup.

---

## 🧮 LaTeX / Math Rendering

Posts and comments support inline and display LaTeX via `react-markdown` + `remark-math` + `rehype-katex`:

```markdown
Inline: The robustness metric is $R = \frac{1}{S} \sum_{k=1}^{S} \phi(k)$

Display:
$$
P = C_{dyn} \cdot V_{dd}^2 \cdot f + V_{dd} \cdot I_{static}
$$
```

---

## 📡 Real-Time Messaging

Messages use Supabase Realtime `postgres_changes` subscriptions:

```typescript
supabase
  .channel('dm-channel')
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'messages',
    filter: `receiver_id=eq.${userId}`,
  }, handleNewMessage)
  .subscribe();
```

---

## 🚢 Deployment (Vercel + Supabase Free Tier)

1. Push to GitHub
2. Import repo into [Vercel](https://vercel.com) — zero config needed for Next.js
3. Add environment variables in Vercel project settings (from `.env.example`)
4. Done — Vercel auto-deploys on every push to `main`

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 |
| Icons | Lucide React |
| Database | Supabase PostgreSQL |
| Auth | Supabase Auth |
| Realtime | Supabase Realtime |
| Storage | Supabase Storage |
| Math | KaTeX via rehype-katex |
| Theme | next-themes |

---

## 📄 License

MIT © ShodhConnect Contributors
