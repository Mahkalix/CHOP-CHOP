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
the password; never commit `.env`. `SUPABASE_URL` is the project URL, used to verify player tokens.

Only one person should apply migrations, to avoid concurrent schema changes:

```bash
pnpm --filter @chopchop/api db:generate   # after editing apps/api/src/db/schema.ts
pnpm --filter @chopchop/api db:migrate
```

Other commands: `pnpm test`, `pnpm typecheck`.

## API

Players sign up and log in **directly with Supabase Auth** from the front end (`supabase-js`,
email + password). The API never sees passwords: protected routes expect the access token as
`Authorization: Bearer <token>`, and the API verifies it against the project's public signing keys.
Only the data needed by the leaderboard is stored server-side (`joueur`, `niveau`, `version_regles`,
`partie`); recipes, ingredients and orders live in the game config.

| Method | Route | Auth | Description |
|---|---|---|---|
| GET | `/health` | no | Liveness check |
| GET | `/me` | yes | Own profile, `404` if no pseudo chosen yet |
| PUT | `/me` | yes | Create or change the pseudo (`{ "pseudo": "Gordon" }`), `409` if taken |
| POST | `/games` | yes | Start a game (`{ "levelId": 1 }`), returns `201 { gameId, levelId, startedAt }` |
| POST | `/games/:id/finish` | yes | End a game (`{ "score": 300, "bestCombo": 4 }`), returns `{ rank, score, durationMs }` |
| POST | `/games/:id/abandon` | yes | Give up a game, `204`. Abandoned games are never ranked |
| GET | `/leaderboard/:levelId?limit=10` | no | Top games of a level (limit max 50) |

Typical flow: sign up with Supabase Auth, `PUT /me` once to choose a pseudo, then for each game
`POST /games` when the level starts and `POST /games/:id/finish` when the timer ends.

- `pseudo`: 2-16 characters, letters/digits/space/`_`/`-` (trimmed), unique whatever the case
- `levelId`: a number from 1 to 5
- The **duration is measured by the server** (time between start and finish), never sent by the client
- Finish errors: `400` invalid body, `404` unknown game or not yours, `409` game already ended,
  `422` implausible score (the game is then closed)
- `POST /games` returns `403` if the player has no profile yet
- `GET /leaderboard/:levelId` returns
  `{ "levelId": 1, "entries": [{ "rank", "pseudo", "score", "durationMs", "finishedAt" }] }`,
  sorted by score (desc), then duration (asc), then finish time

Scores are computed client-side, so the API applies plausibility bounds:

- the score cannot exceed `LEVEL_LIMITS[level].maxScore` (`packages/shared/src/levels.ts`, placeholder values)
- a game ends when the timer of its rules version runs out, so the server-measured duration must be within
  `duree_partie_secondes` minus 5 s / plus 60 s (`GAME_DURATION_TOLERANCE_MS`, to allow for lag and pauses)
- a player has one game in progress at most: starting a new one abandons the previous one

## Deployment

Set `DATABASE_URL`, `PORT` and `CORS_ORIGIN` (the front's URL) as environment variables on
the host, then run `pnpm --filter @chopchop/api start`.
