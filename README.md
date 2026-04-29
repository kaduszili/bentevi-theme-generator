# Bentevi Theme Extraction API v2

Internal microservice that receives a website URL, captures a screenshot, extracts design signals, asks OpenAI to infer a theme, then returns a normalized light/dark theme JSON for Bentevi.

## Stack

- Node.js
- TypeScript
- Fastify (local dev) / Vercel Functions (production)
- `playwright-core` + `@sparticuz/chromium` (serverless) / `playwright` (local Chromium)
- OpenAI `gpt-4o`

## Setup

```bash
npm install
npx playwright install chromium
cp .env.example .env
```

Set:

- `API_KEY`: internal shared key required in `x-api-key`
- `OPENAI_API_KEY`: OpenAI API key
- `PORT`: optional, defaults to `3000`

## Run

```bash
npm run dev
```

Production:

```bash
npm run build
npm start
```

## API

### `POST /theme`

Headers:

```http
x-api-key: your-api-key
content-type: application/json
```

Body:

```json
{
  "url": "https://example.com"
}
```

### `GET /health`

Returns a simple readiness payload.

## Deployment (Vercel)

Both endpoints are also exposed as Vercel Functions under [api/](api/):

- `GET /health` → `api/health.ts`
- `POST /theme` → `api/theme.ts` (configured for `maxDuration: 120s`, `memory: 2048MB` in [vercel.json](vercel.json))

The `/health` and `/theme` paths are mapped via rewrites in [vercel.json](vercel.json) so existing clients hitting `vision.bentevi.co/theme` keep working without an `/api/` prefix.

Setup:

1. `vercel link` to associate the repo with a Vercel project.
2. In the Vercel dashboard set environment variables for Production and Preview:
   - `API_KEY`
   - `OPENAI_API_KEY`
   - `AWS_LAMBDA_JS_RUNTIME=nodejs20.x` (read by `@sparticuz/chromium` at module-load; must be set in dashboard, not in code).
3. Push the branch — Vercel auto-builds a preview. Promote to production via merge to `main`.

Add a domain (e.g. `vision.bentevi.co`) in Project → Settings → Domains. The existing `/health` and `/theme` paths are preserved via rewrites in [vercel.json](vercel.json), so no client changes are required during the Railway → Vercel cutover.

## Notes

- No persistence or caching is used.
- Every request performs a fresh screenshot and a fresh AI inference.
- Favicon and logo extraction are best-effort heuristics.
