# Claude Code Instructions

## Project: vyas-portfolio
Personal portfolio site built with Astro 6 (static), React 19 islands, Tailwind v4, deployed to Netlify. Contact form posts to a single SSR API route (`src/pages/api/emails.ts`) that sends mail via Resend. Sentry handles error reporting.

## Architecture
- **Rendering**: `output: 'static'` in `astro.config.mjs`. Only `src/pages/api/emails.ts` opts back into SSR via `export const prerender = false;`.
- **Middleware**: `src/middleware.ts` sets CSP and does CSRF origin check for `/api/*` POSTs. Other security headers live in `netlify.toml`. Middleware runs at the edge (`edgeMiddleware: true`).
- **Forms**: react-hook-form + zod (`src/lib/schemas.ts`). UI primitives are shadcn-style in `src/components/ui/`.
- **Email**: Resend (`@react-email/components` for the template at `src/components/ui/contact-email.tsx`). The email template is server-only — keep it out of client bundles.
- **Observability**: Sentry client + server configs at repo root. Source maps uploaded and deleted post-upload.

## Common commands
- `npm run dev` — dev server
- `npm run build` — production build
- `npm run preview` — preview built output locally
- `npm run typecheck` — `astro check`
- `npm run test:unit` — Vitest
- `npm run test:e2e` — Playwright (uses dev server unless reconfigured)
- `npm test` — both unit + e2e

## Required env vars
See `.env.example`. Required: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TO_EMAIL`. Optional: `PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`.

## Deploy
GitHub Actions (`.github/workflows/deploy.yml`) is the only deploy path. Netlify's git-driven build should be disabled in the Netlify UI to prevent double-deploys. PRs deploy to a Netlify preview; pushes to `main` deploy `--prod`.

## Conventions
- Hydration: prefer `client:visible` or `client:idle` over `client:load`. The site is mostly static.
- Tests: keep unit tests close to logic (validation, utils). E2E focuses on user-visible flows.
- Secrets: never log raw form input (name/email/message). Sentry has `beforeSend` scrubbers that redact these — don't bypass them.

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
