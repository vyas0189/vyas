import { resolve } from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		globals: true,
		projects: [
			{
				test: {
					name: 'node',
					environment: 'node',
					include: [
						'tests/unit/schemas.test.ts',
						'tests/unit/utils.test.ts',
						'tests/unit/middleware.test.ts',
						'tests/unit/rate-limit.test.ts',
					],
				},
				resolve: { alias: { '@': resolve(__dirname, './src') } },
			},
			{
				// React plugin handles JSX (Vitest 4 / Rolldown does not transform JSX itself).
				plugins: [react()],
				test: {
					name: 'dom',
					environment: 'happy-dom',
					include: ['tests/unit/contact-form.test.tsx'],
					setupFiles: ['./tests/setup.ts'],
				},
				resolve: { alias: { '@': resolve(__dirname, './src') } },
			},
		],
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules', 'dist', '.astro', 'tests', 'src/components/ui'],
		},
	},
});
