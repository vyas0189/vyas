# vyas-portfolio

Personal portfolio site for Vyas Ramankulangara.

**Stack:** Astro 6 (static + one SSR API route) · React 19 · Tailwind v4 · Resend · Sentry · Netlify

## Development

```bash
npm install
cp .env.example .env
# Fill in RESEND_* and SENTRY_* values
npm run dev
```

Open http://localhost:4321.

## Scripts

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run preview` | Preview the built site locally |
| `npm run typecheck` | Run `astro check` |
| `npm run test:unit` | Vitest unit tests |
| `npm run test:e2e` | Playwright e2e tests |
| `npm test` | Unit + e2e |

## Deployment

Deploys are driven by GitHub Actions (`.github/workflows/deploy.yml`):
- **PRs** → Netlify deploy preview + e2e tests against the preview URL.
- **Push to `main`** → `--prod` deploy + e2e against production.

Netlify's git-driven auto-build should be disabled in the Netlify UI; CI is the single source of truth.

## Required env vars

See `.env.example`. The contact form's API route (`/api/emails`) needs all `RESEND_*` values. Sentry vars are optional but recommended for production.

The contact form is rate-limited to **3 submissions per 60s per IP**, backed by [Netlify Blobs](https://docs.netlify.com/blobs/overview/) so the limit holds across cold starts and function instances. When Blobs is unavailable (e.g., local `astro dev` without `netlify dev`) the limiter falls back to an in-memory map for the same window.

## Architecture notes

- **Static-first.** Only `src/pages/api/emails.ts` runs server-side. Everything else is pre-rendered.
- **Edge middleware** (`src/middleware.ts`) applies CSP and CSRF checks on the request path.
- **Security headers** are split: most live in `netlify.toml`; CSP lives in the middleware (will need nonces eventually).
- **Sentry source maps** are uploaded at build time and deleted from `dist/` after upload (see `sourceMapsUploadOptions.filesToDeleteAfterUpload` in `astro.config.mjs`).

## Pre-commit hooks

This repo uses [lefthook](https://github.com/evilmartians/lefthook) to run Biome's lint+format on staged files before each commit. The hook installs automatically on `npm install` (via the `prepare` script). To run it manually: `npx lefthook run pre-commit`.

## License

MIT.
