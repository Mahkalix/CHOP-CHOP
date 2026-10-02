# CHOP-CHOP

A solo, desktop-only, Overcooked-like browser game: 5 levels and a per-level leaderboard.

## Stack

- **Front:** Phaser 3 + TypeScript + Vite (`apps/game`, to be added)
- **Back:** Node.js + Fastify + Drizzle ORM, PostgreSQL hosted on Supabase (`apps/api`)
- **Shared:** Zod schemas and types used by both sides (`packages/shared`, imported as `@chopchop/shared`)
- pnpm monorepo, Node 22+

## Getting started

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # then fill in DATABASE_URL
pnpm test
pnpm typecheck
```

`DATABASE_URL` is the Supabase **Session pooler** connection string
(Supabase dashboard > Connect > Direct > Method: Session pooler). Ask the team for
the password; never commit `.env`.
