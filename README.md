# Bentevi Theme Extraction API v2

Internal microservice that receives a website URL, captures a screenshot, extracts design signals, asks OpenAI to infer a theme, then returns a normalized light/dark theme JSON for Bentevi.

## Stack

- Node.js
- TypeScript
- Fastify
- Playwright (Chromium)
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

Returns a simple readiness payload for Railway.

## Railway

- The server binds to `0.0.0.0`
- The server reads `process.env.PORT`
- Use the standard Node deploy flow with:
  - build command: `npm run build`
  - start command: `npm start`

## Notes

- No persistence or caching is used.
- Every request performs a fresh screenshot and a fresh AI inference.
- Favicon and logo extraction are best-effort heuristics.
