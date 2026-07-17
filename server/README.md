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
