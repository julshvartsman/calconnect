# CalConnect

CalConnect is a campus resource platform that lets students search once and get complete, plain-language resource cards (hours, eligibility, what to bring, and direct form links) without link-chasing.

## Implemented foundation

- Next.js + React + TypeScript web app
- Prisma schema for resources, locations, categories, tags, providers, users, and profiles
- Admin resource CRUD UI and API
- Scrape + summarize endpoint (`Fetch & summarize`) for official resource pages
- Student search/list/detail resource views
- Auth.js (NextAuth) with Google SSO wiring and admin route protection
- Profile + recommendation APIs for rule-based personalization
- iOS architecture planning doc and shared DTO types package

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env
```

Fill in:

- `DATABASE_URL`
- `NEXTAUTH_SECRET`
- `NEXTAUTH_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `ADMIN_EMAILS` (comma-separated admin emails)

3. Run migrations and seed:

```bash
npm run prisma:migrate
npm run prisma:seed
```

4. Start dev server:

```bash
npm run dev
```

## Native search agents (no CrewAI required)

Search uses an in-app 3-step agent flow:

1. Source finder: searches Berkeley-relevant resource links on the web
2. Source reader: fetches and extracts key page text from top links
3. Summarizer: builds structured student-facing output (summary, insights, action steps)

This pipeline runs without CrewAI or external LLM keys. It is deterministic and designed for reliable local setup.

## Main routes

- `/` - student search and resource cards
- `/resources/[id]` - full resource detail card
- `/admin/resources` - admin list
- `/admin/resources/new` - create resource
- `/admin/resources/[id]` - edit resource + trigger scrape/summarize
- `/signin` - SSO sign-in

## iOS follow-up

See `docs/ios-architecture.md` for the React Native/Expo architecture and shared type strategy.
