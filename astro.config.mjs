// @ts-check

import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import netlify from '@astrojs/netlify';
import sentry from '@sentry/astro';

// https://astro.build/config
export default defineConfig({
  output: 'server', // Enable SSR for API routes
  adapter: netlify({
    edgeMiddleware: false
  }),
  vite: {
    // @ts-ignore - Tailwind Vite plugin type compatibility
    plugins: [tailwindcss()],
  },
  integrations: [
    sentry({
      sourceMapsUploadOptions: {
        project: 'vyas-profile',
        org: 'vyas-3y',
        authToken: process.env.SENTRY_AUTH_TOKEN,
      },
    }),
    react()
  ],
});
