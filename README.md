# News Aggregator

A news aggregator built with React and TypeScript. It pulls articles from **The Guardian**,
**The New York Times** and **NewsAPI.org**.

> Work in progress. The full documentation (architecture, trade-offs, API limitations) will be added
> when the project is finished.

## Quick start (Docker)

1. Get free API keys:
   - The Guardian: https://open-platform.theguardian.com/access
   - The New York Times: https://developer.nytimes.com (create an app with the **Article Search API** enabled)
   - NewsAPI.org: https://newsapi.org/register
2. Create `.env` from the template and fill in the keys:
   ```bash
   cp .env.example .env
   ```
3. Build and run:
   ```bash
   docker compose up --build
   ```
4. Open http://localhost:8080

The image build runs lint, format check, type check and tests, so a broken build never produces an
image. Any key you leave out simply disables that source.

## How API keys are handled

The browser never sees the keys. The app calls `/api/<source>/…`, and a proxy attaches the key
before forwarding the request upstream:

- **Docker:** nginx (`docker/nginx/default.conf.template`).
- **Local dev:** a Vite plugin (`server/vite-api-proxy.ts`).

`GET /api/config` reports which sources are configured, without exposing the keys themselves.

## Local development

Requires Node 20.19+ (see `.nvmrc`).

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # unit and integration tests
npm run check        # lint + format + typecheck + tests
```
