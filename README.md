# SerpDo

> **"What is the highest-impact SEO action I should take today?"**

SerpDo connects to Google Search Console, finds your biggest SEO problem, and copies a ready-to-paste Claude prompt to fix it. One click. No keyword databases, no enterprise pricing — just your actual data turned into AI-ready actions.

**Live:** [serpdo.com](https://serpdo.com)

---

## What it does

| Feature | Description |
|---------|-------------|
| **Dashboard** | Daily briefing: top task, traffic overview, quick wins, AI-prioritized action list |
| **Action Plan** | Top 10 SEO tasks ranked by impact; per-task copy prompt + single mega-prompt for all 10 |
| **Opportunities** | Declining pages, page-2 keywords, low-CTR snippets — ranked by traffic impact |
| **Sitemap Explorer** | Tree view of all GSC pages grouped by path; Grade or Improve any page in one click |
| **Article Ideas** | AI-generated article titles for keyword gaps your site isn't covering |
| **Internal Links** | Sitemap crawler that finds orphan pages and suggests link placements with anchor text |
| **Content Refresh** | AI-drafted titles, meta descriptions, new H2s, and FAQs for any existing page |
| **AI Coach** | Chat with an SEO coach that knows your real pages, queries, and numbers; history persists in DB |
| **Competitor Spy** | Analyze any competitor URL: keywords, content gaps, blog ideas |
| **Keywords** | Top queries from GSC with clicks, impressions, CTR, and average position |
| **Rank Tracking** | Track keyword positions over time; auto-captures daily snapshot on page load |
| **Page Grader** | Grade any URL 0–100 for SEO + GEO readiness; step-by-step plan to reach 100 |

**Demo mode:** works without a Google account — click "Explore with demo data" on the dashboard.

---

## Stack

- **Next.js 16** (App Router, React 19, TypeScript)
- **Tailwind CSS v4** + shadcn-style components
- **Vercel** (hosting, Postgres via Neon, Analytics)
- **OpenRouter** (AI inference — model-agnostic)
- **Google OAuth + Search Console API** (read-only)
- **Stripe** (subscriptions)

---

## Local development

```bash
npm install
cp .env.example .env.local   # fill in keys (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Demo mode works immediately — no keys required.

---

## Environment variables

All variables are documented in `.env.example`.

| Variable | Required for | Notes |
|----------|-------------|-------|
| `OPENROUTER_API_KEY` | AI features | Get at openrouter.ai/keys |
| `OPENROUTER_MODEL` | AI quality | Recommended: `deepseek/deepseek-v4-flash`. Default: `openrouter/free` (low quality, rotates) |
| `GOOGLE_CLIENT_ID` | Real GSC data | From Google Cloud Console |
| `GOOGLE_CLIENT_SECRET` | Real GSC data | From Google Cloud Console |
| `POSTGRES_URL` | User accounts, billing | Auto-set by Vercel when Neon DB is connected |
| `MIGRATE_SECRET` | DB init | Any secret string; used to authorize `/api/migrate` |
| `STRIPE_SECRET_KEY` | Payments | From Stripe dashboard |
| `STRIPE_PUBLISHABLE_KEY` | Payments | From Stripe dashboard |
| `STRIPE_PRICE_ID` | Payments | The monthly Pro plan price ID |
| `STRIPE_WEBHOOK_SECRET` | Payments | From Stripe webhook endpoint config |
| `SESSION_SECRET` | Auth security | Strong random string; signs user ID cookies |
| `NEXT_PUBLIC_SITE_URL` | URLs, OG tags | e.g. `https://serpdo.com` |
| `NEXT_PUBLIC_GA_ID` | Analytics | Optional. Format: `G-XXXXXXXXXX` |

---

## Google OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/) → create or select a project
2. **Enable API:** APIs & Services → Library → "Google Search Console API" → Enable
3. **OAuth consent screen:** External is fine; add scope `https://www.googleapis.com/auth/webmasters.readonly`; add your Google account as a test user while unverified
4. **Create credentials:** APIs & Services → Credentials → OAuth client ID → Web application
   - Add redirect URI: `http://localhost:3000/api/auth/google/callback` (dev)
   - Add redirect URI: `https://YOUR-DOMAIN/api/auth/google/callback` (prod)
5. Copy client ID + secret into env vars

Access is **read-only**. Tokens stored in httpOnly cookies — nothing persisted server-side.

---

## Stripe setup

1. Create a product in Stripe dashboard → add a recurring price → copy the Price ID → set `STRIPE_PRICE_ID`
2. Create a webhook endpoint pointing to `https://YOUR-DOMAIN/api/stripe/webhook`
   - Events to listen for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`
3. Copy the webhook signing secret → set `STRIPE_WEBHOOK_SECRET`

---

## Vercel deployment

1. Push repo → import in Vercel (framework auto-detected as Next.js, no config needed)
2. Add all env vars in Project → Settings → Environment Variables
3. Connect a **Neon Postgres** database via Vercel Marketplace (auto-sets `POSTGRES_URL`)
4. Add production callback URL to your Google OAuth client
5. **Initialize the database** — run once after first deploy:
   ```bash
   curl -X POST https://YOUR-DOMAIN/api/migrate \
     -H "x-migrate-secret: YOUR_MIGRATE_SECRET"
   ```
   Creates tables: `users`, `subscriptions`, `ai_usage`, `gsc_snapshots`, `coach_messages`

> **Order matters:** set env vars → deploy → run migrate → test auth → test Stripe webhook

---

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Marketing landing page
│   ├── pricing/                    # Pricing page
│   ├── privacy/                    # Privacy policy
│   ├── terms/                      # Terms of service
│   ├── layout.tsx                  # Root layout (metadata, analytics)
│   ├── sitemap.ts                  # /sitemap.xml
│   ├── robots.ts                   # /robots.txt
│   ├── (app)/                      # Authenticated product pages
│   │   ├── layout.tsx              # App shell (sidebar, mobile nav, user popup)
│   │   ├── dashboard/              # Daily briefing + task list + action plan section
│   │   ├── action-plan/            # Top-10 ranked SEO tasks + mega-prompt copy
│   │   ├── opportunities/          # GSC opportunity cards
│   │   ├── sitemap-explorer/       # Tree view of all GSC pages with Grade/Improve actions
│   │   ├── article-ideas/          # AI keyword gap ideas
│   │   ├── internal-links/         # Sitemap crawler + link suggestions
│   │   ├── content-refresh/        # AI content drafts
│   │   ├── coach/                  # AI chat with persistent DB history
│   │   ├── competitor/             # Competitor analysis
│   │   ├── keywords/               # GSC keyword table
│   │   ├── rank-tracking/          # Keyword position history + daily auto-capture
│   │   ├── page-grader/            # 0-100 SEO+GEO score with improvement plan
│   │   └── usage/                  # Usage & billing
│   ├── actions/                    # Next.js server actions (the API layer)
│   │   ├── analyze.ts              # Competitor analysis
│   │   ├── article-ideas.ts        # Article idea generation
│   │   ├── coach.ts                # Coach chat + history persistence (load/save/clear)
│   │   ├── gsc.ts                  # GSC connection + property management
│   │   ├── rank-tracking.ts        # Keyword position CRUD + daily auto-capture
│   │   ├── page-grader.ts          # Page grade server action + DB cache
│   │   └── seo.ts                  # Dashboard, opportunities, crawl, refresh, sitemap pages
│   └── api/
│       ├── auth/google/            # OAuth flow (initiate + callback + logout)
│       ├── stripe/                 # Checkout, portal, webhook
│       ├── migrate/                # DB schema init (run once)
│       └── usage/                  # Usage data endpoint
├── components/
│   ├── app-shell.tsx               # Sidebar + mobile nav + user popup menu
│   ├── action-plan.tsx             # Ranked task list with per-task + mega copy buttons
│   ├── sitemap-tree.tsx            # Collapsible site tree grouped by path segment
│   ├── sitemap-page-picker.tsx     # Dropdown picker that pre-fills URL fields from GSC pages
│   ├── property-selector.tsx       # GSC property switcher
│   ├── usage-meter.tsx             # Free/Pro usage bar
│   ├── connect-gate.tsx            # Gate for unauthenticated users
│   ├── task-card.tsx               # Daily task card
│   ├── opportunity-card.tsx        # Opportunity card
│   └── ui/                         # Primitive components (button, card, etc.)
└── lib/
    ├── db.ts                       # Postgres queries + schema migrations
    ├── stripe.ts                   # Stripe client
    ├── types.ts                    # Shared TypeScript types
    ├── demo-data.ts                # Demo dataset (trailgearhub.com)
    ├── prompts/                    # AI prompt templates (one file per feature)
    └── services/
        ├── gsc.ts                  # GSC data import + opportunity detection
        ├── crawler.ts              # Sitemap fetch + page crawl (max 30 pages)
        ├── content-refresh.ts      # Fetch page HTML + build AI refresh plan
        ├── tasks.ts                # Daily task prioritization
        ├── usage.ts                # Usage enforcement (free cap $0.10/mo)
        ├── openrouter.ts           # AI client (model-agnostic, usage tracking)
        ├── google-auth.ts          # OAuth token exchange + userinfo fetch
        ├── session.ts              # HMAC-signed cookie session
        ├── context.ts              # Resolves current site context (live vs demo)
        ├── page-grader.ts          # Fetches page via Jina Reader, scores 8 SEO+GEO categories
        └── store.ts                # In-memory TTL cache (per serverless instance)
```

### Data flow

```
User request
  → session.ts (read signed cookie → userId)
  → context.ts (live GSC or demo data)
  → gsc.ts / crawler.ts (fetch + cache data)
  → prompts/ + openrouter.ts (AI analysis)
  → Server action returns result to client component
```

### Caching layers

| Layer | TTL | Scope |
|-------|-----|-------|
| In-memory store | 10–720 min (per feature) | Per serverless instance |
| Postgres `gsc_snapshots` | 30 min | Global |

---

## Pricing

| Plan | Price | AI budget |
|------|-------|-----------|
| Free | $0/mo | $0.10/mo of AI usage |
| Pro | $10/mo | $10/mo of AI usage |

Free plan supports demo mode and GSC connection. AI features (coach, content refresh, internal links, article ideas) consume the usage budget and are blocked when the cap is hit.
