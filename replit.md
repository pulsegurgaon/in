# PulseGurgaon - AI-Powered News Platform

## Overview

Full-stack AI-powered news platform with real-time RSS fetching, AI content enhancement, search, blogs, admin panel, ads, and ticker system.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (ESM bundle)
- **Frontend**: React + Vite, Tailwind CSS, shadcn/ui, Wouter

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── api-server/         # Express API server (backend)
│   │   └── src/
│   │       ├── lib/
│   │       │   ├── ai.ts          # OpenRouter AI enhancement
│   │       │   ├── rss.ts         # RSS feed fetching (7 sources)
│   │       │   ├── categories.ts  # Keyword-based categorization
│   │       │   └── newsService.ts # News CRUD + processing
│   │       └── routes/
│   │           ├── news.ts        # News CRUD + refresh
│   │           ├── search.ts      # Keyword + AI search
│   │           ├── blogs.ts       # Blog CRUD
│   │           ├── admin.ts       # Admin auth + article management
│   │           └── settings.ts    # Ticker + Ads management
│   └── pulse-gurgaon/      # React frontend (mobile-first news app)
│       └── src/pages/
│           ├── Home.tsx           # News feed with category tabs
│           ├── ArticleDetail.tsx  # Full article with AI content
│           ├── Search.tsx         # Keyword + AI search
│           ├── Blogs.tsx          # Blog listing
│           ├── BlogDetail.tsx     # Blog detail
│           ├── AdminLogin.tsx     # Admin login
│           └── AdminDashboard.tsx # Full admin panel
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
└── scripts/                # Utility scripts
```

## Key Features

### News Engine
- Fetches from 7 RSS sources: Times of India, The Hindu, BBC World, NYT World, MoneyControl, TechCrunch, The Verge
- Deduplication via MD5 hash of title+description
- Auto-refresh every 30 minutes in background
- Keeps max 600 articles (trims oldest)
- Initial fetch on server startup

### AI Enhancement (OpenRouter)
- Models: `openai/gpt-4o-mini` with `anthropic/claude-3-haiku` fallback
- Generates: title, 3 bullet summaries, 500-word article, 6-step timeline, 4 vocab words
- JSON validation with fallback content if AI fails
- Never crashes server

### Categories
- Auto-detected: India, World, Technology, Finance, General
- Keyword-based scoring system

### Search
- Keyword search across title, description, fullArticle
- Date range filtering
- AI-powered natural language search via OpenRouter

### Admin Panel
- URL: `/admin` → Login → `/admin/dashboard`
- Credentials: `admin` / `rishabh1745T`
- Features: Stats, Manage Articles, Manage Blogs, Ticker, Ads, Refresh News

### Ticker
- Scrolling red bar at top of all pages
- Editable text from admin panel

### Ads
- Feed placement (every 5 cards), sidebar, body
- Full CRUD from admin panel

## Database Schema

- `articles` — News articles with AI-enhanced content
- `blogs` — Blog posts
- `ticker` — Scrolling ticker settings
- `ads` — Advertisement management
- `meta` — Platform metadata (last_refreshed timestamp)

## API Routes (all under `/api`)

- `GET /news` — List news (category, page, limit filters)
- `GET /news/featured` — Top 10 recent articles
- `GET /news/stats` — Platform statistics
- `GET /news/categories` — Category counts
- `GET /news/:id` — Single article
- `POST /news/refresh` — Trigger manual refresh
- `GET /search` — Keyword/date search
- `POST /search/ai` — AI natural language search
- `GET/POST /blogs` — Blog listing and creation
- `GET/PUT/DELETE /blogs/:id` — Blog detail, update, delete
- `POST /admin/login` — Admin authentication
- `PUT/DELETE /admin/articles/:id` — Edit/delete articles
- `GET/PUT /settings/ticker` — Ticker management
- `GET/POST /settings/ads` — Ads management
- `PUT/DELETE /settings/ads/:id` — Ads update/delete

## Environment Variables

- `PORT` — Required for server and frontend
- `DATABASE_URL` — PostgreSQL connection string
- `OPENROUTER_API_KEY` — For AI article enhancement

## Deployment

Single server deployment on Render — both frontend (built static) and backend run from process.env.PORT. For a single-server Render deploy, build the frontend and serve it from Express as static files.
