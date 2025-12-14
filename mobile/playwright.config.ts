import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright E2E Test Configuration
 * 
 * Run with: npx playwright test
 * Debug with: npx playwright test --debug
 * UI mode: npx playwright test --ui
 */
export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',

    use: {
        // Base URL for the app
        baseURL: 'http://localhost:8084',

        // Capture screenshot on failure
        screenshot: 'only-on-failure',

        // Capture video on failure
        video: 'retain-on-failure',

        // Trace on retry
        trace: 'on-first-retry',

        // Viewport size
        viewport: { width: 1280, height: 720 },
    },

    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],

    // Web server config - uncomment if you want Playwright to start the server
    // webServer: {
    //   command: 'npm run web',
    //   url: 'http://localhost:8082',
    //   reuseExistingServer: !process.env.CI,
    // },
});
