// Removes a stale dist/_headers before `astro dev` starts under Playwright.
//
// Netlify's Vite plugin serves the publish dir's `_headers` file in dev, so a
// dist/_headers left behind by an earlier `bun run build` applies the production
// CSP to the dev server. That CSP pins per-build inline-script hashes (see
// generate-headers.mjs) which never match the inline scripts Astro injects in
// dev, so every React island is blocked from hydrating and ~57 e2e tests fail
// with locator timeouts that look nothing like the actual cause.
//
// This has to run before the dev server boots — the plugin reads `_headers` at
// startup, so a Playwright globalSetup (which runs after webServer launches) is
// too late. `_headers` is a build artifact that `postbuild` regenerates.

import { rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const headersFile = fileURLToPath(new URL('../dist/_headers', import.meta.url));
await rm(headersFile, { force: true });
