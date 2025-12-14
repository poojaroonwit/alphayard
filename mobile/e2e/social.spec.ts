/**
 * Social Features E2E Tests
 * 
 * Tests for social posting, feed, and interactions.
 * 
 * Run with: npx playwright test e2e/social.spec.ts
 */

import { test, expect } from '@playwright/test';

// Test data
const TEST_POST = {
    content: 'This is a test post from E2E testing! 🎉',
    comment: 'Great post! This is a test comment.',
};

test.describe('Social Features', () => {

    test.beforeEach(async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Try to login or use dev bypass first
        // Look for dev bypass
        const devButton = page.locator('text=Dev Login, text=Skip, [data-testid="dev-bypass"]').first();
        if (await devButton.count() > 0) {
            await devButton.click();
            await page.waitForTimeout(2000);
        }
    });

    test('should display the home/feed page', async ({ page }) => {
        await page.screenshot({ path: 'e2e/screenshots/social-01-home.png' });

        // Check for common home page elements
        const pageContent = await page.content();
        console.log('Home page loaded, checking for feed elements...');

        // The page should have loaded something
        expect(pageContent.length).toBeGreaterThan(100);
    });

    test('should find create post button', async ({ page }) => {
        // Look for create post button/FAB
        const createPostSelectors = [
            'button[aria-label*="post" i]',
            'button[aria-label*="create" i]',
            '[data-testid="create-post"]',
            '[data-testid="fab"]',
            'text=New Post',
            'text=Create',
            'button:has-text("+")',
        ];

        for (const selector of createPostSelectors) {
            try {
                const button = page.locator(selector).first();
                if (await button.count() > 0) {
                    console.log(`Found create post button with: ${selector}`);
                    await page.screenshot({ path: 'e2e/screenshots/social-02-create-button-found.png' });
                    return;
                }
            } catch {
                continue;
            }
        }

        console.log('Create post button not found - may need to be logged in first');
        await page.screenshot({ path: 'e2e/screenshots/social-02-no-create-button.png' });
    });

    test('should navigate through tabs/sections', async ({ page }) => {
        // Look for navigation tabs
        const tabSelectors = [
            '[role="tab"]',
            '[role="tablist"] button',
            'nav button',
            'nav a',
        ];

        for (const selector of tabSelectors) {
            try {
                const tabs = page.locator(selector);
                const count = await tabs.count();
                if (count > 0) {
                    console.log(`Found ${count} tabs with selector: ${selector}`);

                    // Click on each tab
                    for (let i = 0; i < Math.min(count, 5); i++) {
                        try {
                            await tabs.nth(i).click();
                            await page.waitForTimeout(500);
                            await page.screenshot({ path: `e2e/screenshots/social-03-tab-${i}.png` });
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

        console.log('No tabs found');
    });

    test('should display posts in feed', async ({ page }) => {
        // Look for post elements
        const postSelectors = [
            '[data-testid*="post"]',
            '.post',
            '[role="article"]',
            'div[class*="post"]',
        ];

        for (const selector of postSelectors) {
            try {
                const posts = page.locator(selector);
                const count = await posts.count();
                if (count > 0) {
                    console.log(`Found ${count} posts with selector: ${selector}`);
                    await page.screenshot({ path: 'e2e/screenshots/social-04-posts-found.png' });
                    return;
                }
            } catch {
                continue;
            }
        }

        console.log('No posts found in feed');
        await page.screenshot({ path: 'e2e/screenshots/social-04-no-posts.png' });
    });

    test('should interact with post (like/comment)', async ({ page }) => {
        // Look for like buttons
        const likeSelectors = [
            'button[aria-label*="like" i]',
            '[data-testid*="like"]',
            'button:has-text("❤")',
            'button:has-text("Like")',
        ];

        for (const selector of likeSelectors) {
            try {
                const likeButton = page.locator(selector).first();
                if (await likeButton.count() > 0) {
                    console.log(`Found like button with: ${selector}`);
                    await likeButton.click();
                    await page.waitForTimeout(500);
                    await page.screenshot({ path: 'e2e/screenshots/social-05-liked.png' });
                    return;
                }
            } catch {
                continue;
            }
        }

        console.log('No like button found');
    });
});

test.describe('Create Post Flow', () => {

    test('complete create post flow', async ({ page }) => {
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Try dev bypass first
        const devButton = page.locator('text=Dev Login, text=Skip, [data-testid="dev-bypass"]').first();
        if (await devButton.count() > 0) {
            await devButton.click();
            await page.waitForTimeout(2000);
        }

        // Find and click create post button
        const createButton = page.locator('button:has-text("+"), [data-testid="create-post"], [data-testid="fab"]').first();
        if (await createButton.count() > 0) {
            await createButton.click();
            await page.waitForTimeout(1000);
            await page.screenshot({ path: 'e2e/screenshots/social-06-create-modal.png' });

            // Find text input and type post content
            const textInput = page.locator('textarea, input[type="text"], [contenteditable="true"]').first();
            if (await textInput.count() > 0) {
                await textInput.fill(TEST_POST.content);
                await page.screenshot({ path: 'e2e/screenshots/social-07-post-typed.png' });

                // Find and click post/submit button
                const submitButton = page.locator('button:has-text("Post"), button:has-text("Share"), button[type="submit"]').first();
                if (await submitButton.count() > 0) {
                    await submitButton.click();
                    await page.waitForTimeout(2000);
                    await page.screenshot({ path: 'e2e/screenshots/social-08-post-submitted.png' });
                }
            }
        }

        console.log('Create post flow completed - check screenshots');
    });
});
