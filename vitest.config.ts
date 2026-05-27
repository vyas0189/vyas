import { resolve } from 'node:path';
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
				test: {
					name: 'dom',
					environment: 'happy-dom',
					include: ['tests/unit/contact-form.test.tsx'],
					setupFiles: ['./tests/setup.ts'],
				},
				resolve: { alias: { '@': resolve(__dirname, './src') } },
				esbuild: { jsx: 'automatic', jsxImportSource: 'react' },
			},
		],
		coverage: {
			reporter: ['text', 'json', 'html'],
			exclude: ['node_modules', 'dist', '.astro', 'tests', 'src/components/ui'],
		},
	},
});
