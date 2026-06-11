# AI SEO Employee

An AI-powered SEO assistant that answers one question every day:

> **"What is the highest-impact SEO action I should take today?"**

It connects to Google Search Console, crawls your sitemap, and turns the data
into a prioritized daily action plan — no keyword databases, no paid SEO APIs,
no persistence layer to manage.

Built with Next.js (App Router), React, TypeScript, Tailwind, and shadcn-style
components. Deploys to Vercel as-is.

## Features

| Page | What it does |
| --- | --- |
| `/dashboard` | Today's highest-impact task, performance stats, traffic declines, quick wins |
| `/opportunities` | Opportunity cards from Search Console: declining pages, page-2 keywords, low-CTR snippets |
| `/internal-links` | Sitemap crawler that finds orphan pages and suggests link placements with anchor text |
| `/content-refresh` | AI-drafted titles, meta descriptions, H2s, FAQs, and content additions for any URL |
| `/coach` | Chat with an AI coach that knows your real pages, queries, and numbers |
| `/competitor` | Competitor analysis: keywords, content gaps, blog ideas (the original AI Quick SEO tool) |

**Demo mode:** click "Explore with demo data" on the dashboard to use the full
product with a realistic sample site — no credentials required.

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in keys (see below)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `OPENROUTER_API_KEY` | For AI features | Content refresh, task prioritization, link suggestions, coach |
| `OPENROUTER_MODEL` | No | Override the model (default: `openrouter/free`) |
| `GOOGLE_CLIENT_ID` | For real GSC data | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | For real GSC data | Google OAuth client secret |

Without Google credentials the app runs in demo mode. Without an OpenRouter
key, opportunity detection and crawling still work (they're deterministic);
AI features show a clear error.

## OpenRouter setup

1. Create an account at [openrouter.ai](https://openrouter.ai).
2. Generate a key at [openrouter.ai/keys](https://openrouter.ai/keys).
3. Set `OPENROUTER_API_KEY` in `.env.local` (and in Vercel project settings).

The free default model works out of the box; set `OPENROUTER_MODEL` to any
OpenRouter model ID for higher quality.

## Google Search Console setup

1. Go to the [Google Cloud Console](https://console.cloud.google.com/) and
   create (or select) a project.
2. **Enable the API:** APIs & Services → Library → search "Google Search
   Console API" → Enable.
3. **Configure the OAuth consent screen:** APIs & Services → OAuth consent
   screen. External is fine; add the scope
   `https://www.googleapis.com/auth/webmasters.readonly` and add your Google
   account as a test user while the app is unverified.
4. **Create credentials:** APIs & Services → Credentials → Create Credentials
   → OAuth client ID → Web application. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/google/callback` (development)
   - `https://YOUR-DOMAIN.vercel.app/api/auth/google/callback` (production)
5. Copy the client ID and secret into `GOOGLE_CLIENT_ID` /
   `GOOGLE_CLIENT_SECRET`.

Access is **read-only** (`webmasters.readonly`). Tokens are stored in httpOnly
cookies on the user's browser — nothing is persisted server-side.

## Vercel deployment

1. Push the repo and import it in Vercel (defaults work — no config needed).
2. Add the environment variables above in Project → Settings → Environment
   Variables.
3. Add the production callback URL to your Google OAuth client (step 4 above).

Notes:

- There is **no database**. Search Console snapshots, crawl results, and the
  daily task plan are cached in memory per serverless instance (10 min / 30
  min / 12 h TTLs) and recomputed on demand after cold starts. This is
  intentional for the MVP; swap `src/lib/services/store.ts` for Redis/KV when
  persistence is needed.
- The sitemap crawler caps at 30 pages per crawl to stay within serverless
  execution limits.

## Architecture

```
src/
├── app/
│   ├── page.tsx                    # Marketing landing page
│   ├── (app)/                      # Product pages (shared sidebar shell)
│   │   ├── layout.tsx
│   │   ├── dashboard/
│   │   ├── opportunities/
│   │   ├── internal-links/
│   │   ├── content-refresh/
│   │   ├── coach/
│   │   └── competitor/
│   ├── actions/                    # Server actions (the "API layer")
│   │   ├── analyze.ts              # Competitor analysis (original tool)
│   │   ├── gsc.ts                  # Connection/property management
│   │   ├── seo.ts                  # Dashboard, opportunities, crawl, refresh
│   │   └── coach.ts                # Coach chat
│   └── api/auth/google/            # OAuth route handlers
├── components/                     # App shell + feature components
│   └── ui/                         # shadcn-style primitives
└── lib/
    ├── types.ts                    # Shared domain types
    ├── demo-data.ts                # Demo dataset (trailgearhub.com)
    ├── prompts/                    # All AI prompt templates
    └── services/                   # Isolated, reusable SEO logic
        ├── gsc.ts                  # GSC import + opportunity detection
        ├── crawler.ts              # Sitemap crawl + link graph
        ├── content-refresh.ts      # Page fetch + AI refresh plan
        ├── tasks.ts                # Daily task generation
        ├── openrouter.ts           # AI client
        ├── google-auth.ts          # OAuth helpers
        ├── session.ts              # Cookie-backed session
        ├── context.ts              # Resolves current site context
        └── store.ts                # In-memory TTL cache
```
