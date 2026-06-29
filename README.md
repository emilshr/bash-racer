# Bash Racer

Type bash scripts fast — offline speed tests and online multiplayer type races.

## Stack

- Next.js 16, React 19, Tailwind 4, shadcn/ui
- Drizzle ORM + Neon Postgres
- Jotai (client state)
- Socket.IO (realtime lobbies)
- Upstash Redis (lobby state + cross-instance broadcasts)

## Setup

```bash
pnpm install

cp .env.example .env.local
# Set DATABASE_URL (Neon)
# Optionally set Upstash vars (see Environment below)

pnpm db:push
pnpm db:seed
```

### Upstash Redis

1. Create a database at [Upstash Console](https://console.upstash.com)
2. From **Connect**, copy:
   - `KV_REST_API_URL` + `KV_REST_API_TOKEN` (REST — lobby state)
   - `REDIS_URL` (TCP `rediss://` — Socket.IO adapter pub/sub)
3. On Vercel: add the Upstash integration (auto-injects `KV_REST_API_*` and `REDIS_URL`)

Without Upstash vars, lobbies use in-memory storage (fine for local solo dev).

## Development

```bash
# Full app with Socket.IO (recommended)
pnpm dev

# Next.js only (no sockets)
pnpm dev:next

# Vercel WebSocket parity
pnpm dev:vercel
```

Open [http://localhost:3000](http://localhost:3000).

## Modes

- **Offline** — random bash snippet from DB, WPM/accuracy/timer
- **Race Lobby** — public lobbies (2–5 players), 30s countdown, live progress

## Environment

Validated with Zod in [`lib/env.ts`](lib/env.ts).

| Variable                   | Required | Description                                 |
| -------------------------- | -------- | ------------------------------------------- |
| `DATABASE_URL`             | Yes      | Neon Postgres connection string             |
| `KV_REST_API_URL`   | Prod     | Upstash REST URL for lobby state            |
| `KV_REST_API_TOKEN` | Prod     | Upstash REST token (set with URL)           |
| `REDIS_URL`         | Prod     | Upstash TCP URL for Socket.IO adapter       |
| `SKIP_ENV_VALIDATION`      | No       | Set `true` for drizzle-kit without full env |

## Scripts

| Command        | Description                  |
| -------------- | ---------------------------- |
| `pnpm dev`     | Custom server with Socket.IO |
| `pnpm build`   | Production build             |
| `pnpm db:push` | Push schema to Neon          |
| `pnpm db:seed` | Seed ~100 bash snippets      |
