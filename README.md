# CHOP-CHOP

A solo, desktop-only, Overcooked-like browser game: 5 levels and a per-level leaderboard.

## Stack

- **Front:** Phaser 3 + TypeScript + Vite (`apps/game`, to be added)
- **Back:** Node.js + Fastify + Drizzle ORM, PostgreSQL hosted on Supabase (`apps/api`)
- **Shared:** Zod schemas and types used by both sides (`packages/shared`, imported as `@chopchop/shared`)
- pnpm monorepo, Node 22+

## Getting started (API)

```bash
pnpm install
cp apps/api/.env.example apps/api/.env   # then fill in DATABASE_URL
pnpm dev:api                              # http://localhost:3000
```

`DATABASE_URL` is the Supabase **Session pooler** connection string
(Supabase dashboard > Connect > Direct > Method: Session pooler). Ask the team for
the password; never commit `.env`.

Only one person should apply migrations, to avoid concurrent schema changes:

```bash
pnpm --filter @chopchop/api db:generate   # after editing apps/api/src/db/schema.ts
pnpm --filter @chopchop/api db:migrate
```

Other commands: `pnpm test`, `pnpm typecheck`.

## API

Players have no account: they only enter a name before playing.

| Method | Route | Description |
|---|---|---|
| GET | `/health` | Liveness check |
| POST | `/scores` | Submit a score |
| GET | `/leaderboard/:levelId?limit=10` | Top scores of a level (limit max 50) |

`POST /scores` body:

```json
{ "levelId": 1, "playerName": "Gordon", "score": 300, "durationMs": 90000 }
```

- `levelId`: 1 to 5
- `playerName`: 2-16 characters, letters/digits/space/`_`/`-` (trimmed)
- Responses: `201 { "id": "...", "rank": 1 }`, `400` invalid payload, `422` implausible score

`GET /leaderboard/:levelId` returns
`{ "levelId": 1, "entries": [{ "rank", "playerName", "score", "durationMs", "createdAt" }] }`,
sorted by score (desc), then duration (asc).

Scores are computed client-side, so the API only applies plausibility bounds per level
(`LEVEL_LIMITS` in `packages/shared/src/levels.ts`). These values are placeholders until the
level design is final.

## Deployment

Set `DATABASE_URL`, `PORT` and `CORS_ORIGIN` (the front's URL) as environment variables on
the host, then run `pnpm --filter @chopchop/api start`.
