# Claude Code Instructions

## Project: vyas-portfolio
Personal portfolio site built with Astro 7 (static), React 19 islands, Tailwind v4, deployed to Netlify. Contact form posts to a single SSR API route (`src/pages/api/emails.ts`) that sends mail via Resend. Sentry handles error reporting.

## Architecture
- **Rendering**: `output: 'static'` in `astro.config.mjs`. Only `src/pages/api/emails.ts` opts back into SSR via `export const prerender = false;`.
- **Middleware**: `src/middleware.ts` does the CSRF origin check for `/api/*` POSTs. With static output it only runs for on-demand routes — never for CDN-served pages, so page headers cannot live there. `edgeMiddleware` is off (Sentry needs Node built-ins unavailable on the Deno edge runtime).
- **Security headers**: static headers (HSTS, XFO, nosniff, …) live in `netlify.toml`. The CSP is generated post-build into `dist/_headers` by `scripts/generate-headers.mjs` (runs via the `postbuild` script) because its inline-script hashes change every build — Sentry injects a per-build debug-ID snippet. Don't hardcode CSP hashes anywhere. Note that Netlify's Vite plugin also serves `dist/_headers` in **dev**, so a leftover build applies a production CSP to the dev server whose hashes can't match dev's inline scripts — that blocks island hydration entirely. `scripts/clean-dev-headers.mjs` removes it before Playwright starts the dev server; see that script's comment.
- **Forms**: react-hook-form + zod (`src/lib/schemas.ts`). UI primitives are shadcn-style in `src/components/ui/`.
- **Email**: Resend (`@react-email/components` for the template at `src/components/ui/contact-email.tsx`). The email template is server-only — keep it out of client bundles.
- **Observability**: Sentry client + server configs at repo root. Source maps uploaded and deleted post-upload.

## Common commands
Package manager is Bun (`bun.lock` is the committed lockfile and what CI actually installs from). `package-lock.json` is also committed and is **not** optional: GitHub's dependency graph for this repo tracks only `package.json` and `package-lock.json` — `bun.lock` is not scanned — so every Dependabot alert is keyed to it, and the Snyk PR check reads it too. No install step uses it, but it must be kept in sync whenever dependencies or `overrides` change, or the security dashboards will report a tree that no longer exists. Regenerate with `npm install --package-lock-only` (lockfile only; it does not touch `node_modules`, so Bun remains the only install path).
- `bun run dev` — dev server
- `bun run build` — production build
- `bun run preview` — preview built output locally
- `bun run typecheck` — `astro check`
- `bun run test:unit` — Vitest
- `bun run test:e2e` — Playwright (uses dev server unless reconfigured)
- `bun run test` — both unit + e2e (note: `bun test`, without `run`, invokes Bun's own native test runner instead of this script — always use `run`)

## Required env vars
See `.env.example`. Required: `RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `RESEND_TO_EMAIL`. Optional: `PUBLIC_SENTRY_DSN`, `SENTRY_DSN`, `SENTRY_AUTH_TOKEN`, `RATE_LIMIT_SALT` (salt for hashing IPs in the rate limiter).

## Deploy
GitHub Actions (`.github/workflows/deploy.yml`) is the only deploy path. Netlify's git-driven build should be disabled in the Netlify UI to prevent double-deploys. PRs deploy to a Netlify preview; pushes to `main` deploy `--prod`.

## Conventions
- Hydration: prefer `client:visible` or `client:idle` over `client:load`. The site is mostly static.
- Tests: keep unit tests close to logic (validation, utils). E2E focuses on user-visible flows.
- Secrets: never log raw form input (name/email/message). Sentry has `beforeSend` scrubbers that redact these — don't bypass them.

## Task Master AI Instructions
**Import Task Master's development workflow commands and guidelines, treat as if import is in the main CLAUDE.md file.**
@./.taskmaster/CLAUDE.md
