# Cravio

Cravio turns recipe reels into a structured personal cookbook and recommends what to cook from the ingredients already in your pantry.

## Run locally

```bash
npm install
npm run server
```

In a second terminal:

```bash
npm run mobile
```

The mobile app is an Expo project. Open it in Expo Go, an iOS simulator, an Android emulator, or press `w` for the web preview.

The API is a Hono app targeting Cloudflare Workers. Wrangler serves it locally at `http://localhost:8787`. The app includes local seed data, so every screen remains usable when the API is offline.

The mobile import screen talks to that API. iOS Simulator and Android Emulator use the local Worker automatically. For Expo Go on a physical device or a deployed Worker, set the public API URL before starting Expo:

```bash
EXPO_PUBLIC_API_URL=https://cravio-api.<your-subdomain>.workers.dev npm run mobile
```

## Deploy the API to Cloudflare

Authenticate Wrangler once, then deploy:

```bash
npx wrangler login
npm run deploy -w server
```

Cloudflare uses [`server/wrangler.jsonc`](server/wrangler.jsonc) as the Worker configuration. The current in-memory seed store is intended for the MVP demo; connect D1 or Durable Objects before relying on persistent production writes.
