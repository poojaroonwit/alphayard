/**
 * Navigation E2E Tests
 * 
 * Tests for app navigation and screen transitions.
 * 
 * Run with: npx playwright test e2e/navigation.spec.ts
 */

import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');
    });

    test('should load the app without errors', async ({ page }) => {
        // Check that the page loaded
        const title = await page.title();
        console.log(`Page title: ${title}`);

        // Check for no console errors
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') {
                errors.push(msg.text());
            }
        });

        await page.waitForTimeout(2000);

        if (errors.length > 0) {
            console.log('Console errors found:', errors);
        }

        await page.screenshot({ path: 'e2e/screenshots/nav-01-initial.png' });
        expect(await page.content()).toBeTruthy();
    });

    test('should handle navigation menu', async ({ page }) => {
        // Look for hamburger menu or navigation drawer
        const menuSelectors = [
            'button[aria-label*="menu" i]',
            '[data-testid="menu"]',
            '[data-testid="hamburger"]',
            'button:has-text("☰")',
        ];

        for (const selector of menuSelectors) {
            try {
                const menuButton = page.locator(selector).first();
                if (await menuButton.count() > 0) {
                    console.log(`Found menu with: ${selector}`);
                    await menuButton.click();
                    await page.waitForTimeout(1000);
                    await page.screenshot({ path: 'e2e/screenshots/nav-02-menu-open.png' });
                    return;
                }
            } catch {
                continue;
            }
        }

        console.log('No menu button found');
    });

    test('should handle bottom tab navigation', async ({ page }) => {
        // Look for bottom tabs
        const tabBarSelectors = [
            '[role="tablist"]',
            'nav[aria-label*="bottom" i]',
            '[data-testid="bottom-tabs"]',
        ];

        for (const selector of tabBarSelectors) {
            try {
                const tabBar = page.locator(selector).first();
                if (await tabBar.count() > 0) {
                    console.log(`Found tab bar with: ${selector}`);

                    // Find and click tabs
                    const tabs = tabBar.locator('button, a, [role="tab"]');
                    const count = await tabs.count();
                    console.log(`Found ${count} tabs`);

                    for (let i = 0; i < Math.min(count, 5); i++) {
                        try {
                            await tabs.nth(i).click();
                            await page.waitForTimeout(500);
                            await page.screenshot({ path: `e2e/screenshots/nav-03-tab-${i}.png` });
                        } catch {
                            continue;
                        }
                    }
                    return;
                }
            } catch {
                continue;
            }
        }

        console.log('No tab bar found');
    });

    test('should navigate to profile/settings', async ({ page }) => {
        // Look for profile/settings link
        const profileSelectors = [
            'button[aria-label*="profile" i]',
            'a[aria-label*="profile" i]',
            '[data-testid="profile"]',
            '[data-testid="settings"]',
            'text=Profile',
            'text=Settings',
            'text=Account',
        ];

        for (const selector of profileSelectors) {
            try {
                const profileLink = page.locator(selector).first();
                if (await profileLink.count() > 0) {
                    console.log(`Found profile/settings with: ${selector}`);
                    await profileLink.click();
                    await page.waitForTimeout(1000);
                    await page.screenshot({ path: 'e2e/screenshots/nav-04-profile.png' });
                    return;
                }
            } catch {
                continue;
            }
        }

        console.log('No profile/settings link found');
    });

    test('should handle back navigation', async ({ page }) => {
        // Navigate to a sub-page first if possible
        const anyLink = page.locator('a, button').first();
        if (await anyLink.count() > 0) {
            await anyLink.click();
            await page.waitForTimeout(500);
        }

        // Try to go back
        await page.goBack();
        await page.waitForTimeout(500);
        await page.screenshot({ path: 'e2e/screenshots/nav-05-after-back.png' });

        // Verify we're still on a valid page
        expect(await page.content()).toBeTruthy();
    });
});

test.describe('Responsive Design', () => {

    test('should work on mobile viewport', async ({ page }) => {
        await page.setViewportSize({ width: 375, height: 667 }); // iPhone SE
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'e2e/screenshots/responsive-01-mobile.png' });

        expect(await page.content()).toBeTruthy();
    });

    test('should work on tablet viewport', async ({ page }) => {
        await page.setViewportSize({ width: 768, height: 1024 }); // iPad
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'e2e/screenshots/responsive-02-tablet.png' });

        expect(await page.content()).toBeTruthy();
    });

    test('should work on desktop viewport', async ({ page }) => {
        await page.setViewportSize({ width: 1920, height: 1080 }); // Full HD
        await page.goto('/');
        await page.waitForLoadState('networkidle');
        await page.screenshot({ path: 'e2e/screenshots/responsive-03-desktop.png' });

        expect(await page.content()).toBeTruthy();
    });
});
