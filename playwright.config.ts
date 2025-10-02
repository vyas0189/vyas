import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: './tests/e2e',
	fullyParallel: true,
	forbidOnly: !!process.env.CI,
	retries: process.env.CI ? 1 : 0,
	workers: process.env.CI ? 4 : undefined,
	reporter: 'html',
	use: {
		baseURL: process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://localhost:4321',
		trace: 'on-first-retry',
		screenshot: 'only-on-failure',
	},
	projects: process.env.CI
		? [
				{
					name: 'chromium',
					use: { ...devices['Desktop Chrome'] },
				},
			]
		: [
				{
					name: 'chromium',
					use: { ...devices['Desktop Chrome'] },
				},
				{
					name: 'firefox',
					use: { ...devices['Desktop Firefox'] },
				},
				{
					name: 'webkit',
					use: { ...devices['Desktop Safari'] },
				},
			],
	webServer: process.env.PLAYWRIGHT_TEST_BASE_URL
		? undefined
		: {
				command: 'npm run dev',
				url: 'http://localhost:4321',
				reuseExistingServer: !process.env.CI,
			},
});
