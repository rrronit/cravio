# Cravio API architecture

The Worker uses a domain-layered structure:

```text
src/
├── index.ts          Worker entrypoint only
├── app.ts            Hono composition, middleware, route mounting, errors
├── routes/           URL and HTTP-method declarations
├── handlers/         Request parsing, validation, response formatting
├── services/         Business rules and domain orchestration
├── repositories/     D1 queries and persistence mapping
├── models/           Domain types, database row types, Zod schemas
└── lib/              Shared transport-independent utilities
```

Dependency flow is one-directional:

```text
routes → handlers → services → repositories → D1
                     ↓
                   models
```

Routes never query D1. Repositories do not contain HTTP or business logic. Services are the only layer that coordinates multiple repositories, such as recipe imports and pantry recommendations.

## Database

Apply the versioned D1 migrations before local development:

```bash
npm run db:migrate:local -w server
npm run server
```

For production, create the D1 database, update the Wrangler binding, and apply remote migrations as described in the root README.

## Email OTP authentication

The auth API uses Cloudflare Email Service, D1, and opaque bearer sessions:

```text
POST /auth/otp/request  { "email": "person@example.com" }
POST /auth/otp/verify   { "email": "person@example.com", "code": "123456" }
GET  /auth/me           Authorization: Bearer <token>
POST /auth/logout       Authorization: Bearer <token>
```

Before deploying:

1. Onboard `cravio.app` under **Compute → Email Service → Email Sending** in Cloudflare, or change `EMAIL_FROM` in `wrangler.jsonc` to an address on an onboarded domain.
2. Generate a random secret of at least 32 characters and store it with `npx wrangler secret put AUTH_SECRET -c server/wrangler.jsonc`.
3. Apply the latest D1 migrations locally and remotely (`0004` adds auth storage; `0005` isolates pantry data by user).

Do not put `AUTH_SECRET` in `wrangler.jsonc` or commit it. Local Email Service calls are simulated by default; set `remote: true` on the binding only when intentionally sending real test emails.

For local-only OTP development, create `server/.dev.vars`:

```dotenv
ENVIRONMENT="development"
AUTH_SECRET="replace-with-a-local-secret-at-least-32-characters-long"
```

Then apply the local migrations and start Wrangler:

```bash
npm run db:migrate:local -w server
npm run dev -w server
```

Wrangler listens on `0.0.0.0:8787` so Expo on another device can reach it. Android emulators use `http://10.0.2.2:8787`; iOS simulators and web use `http://localhost:8787`. For a physical phone, copy `mobile/.env.example` to `mobile/.env` and replace the example address with the computer's LAN IP.

When and only when `ENVIRONMENT` is exactly `development`, the request response includes a `devCode` field and Wrangler prints the code to its local console. No email is sent. The deployed configuration explicitly sets `ENVIRONMENT` to `production`, where OTP codes are never returned or logged and delivery still requires the Cloudflare Email Service binding.

Successful production OTP requests return `{ "message": "...", "expiresIn": 600 }`. Successful verification returns `{ "token": "...", "expiresAt": "<ISO timestamp>", "user": { ... } }`. Send that token as `Authorization: Bearer <token>` for every domain API request. The legacy `X-User-Id` identity override is no longer accepted.

## Reel extraction

`POST /imports` accepts a public `https://www.instagram.com/reel/…` URL and an optional copied caption. The Worker stores the job in D1 and sends it to `cravio-imports`; the app polls `GET /imports/:id` until the job is `ready` or `failed`. TikTok, YouTube, Instagram posts, and arbitrary URLs are rejected.

The extractor uses Cloudflare Browser Rendering for public Instagram Reel text and structured recipe extraction. A deterministic caption parser remains available when AI extraction cannot produce valid output.

Apply `0007_real_imports.sql` before running the importer. The importer does not download Reel video files or bypass login and bot protections.
