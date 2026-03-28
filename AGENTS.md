# AgentForge — Operational Guide

## Project
Building a booking dashboard for short-term rental properties using Next.js 15, TypeScript, Tailwind CSS v4, App Router.

## Tech Stack
- **Framework**: Next.js 15 (App Router, src/ directory)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS v4 with dark mode (class strategy)
- **Charts**: recharts
- **Data**: JSON files in src/data/ (NO database, NO SQLite, NO external services)
- **Tests**: vitest
- **Deploy**: Vercel (auto-deploy on git push)

## Data Architecture
- All data lives in JSON files under `src/data/`
- Data access functions in `src/lib/data.ts`
- For mutations (create booking, update status): write to a server-side JSON file or use in-memory store
- 3 properties: Northstar Lodge, Nyhavn Oak, Streamhouse
- 50 sample bookings, 30 guests with realistic names/emails/phones

## Code Style
- Use `'use client'` directive only on components that need interactivity (forms, toggles, search)
- Server components by default
- Tailwind classes for all styling — no CSS files
- shadcn/ui patterns welcome but don't install the full library — build components inline

## Feedback Loops (run before every commit)
```bash
npm run build    # Must succeed — no TypeScript errors
npm run test     # Must pass — no test failures
npm run lint     # Must pass — no lint warnings
```

## Commit Convention
```
feat(#ID): short description of feature
```
Where ID matches the feature_list.json feature ID.

## Rules
- ONE feature per session. Do not try to implement multiple features.
- Search before implementing — don't assume something doesn't exist.
- No placeholder code. No TODOs. No stubs. Full implementations only.
- If stuck, note the issue in claude-progress.txt and exit cleanly.
