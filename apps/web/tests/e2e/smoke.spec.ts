import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
    test('HomePage loads and shows title', async ({ page }) => {
        await page.goto('/');

        // Check Title (from Metadata or Header)
        await expect(page).toHaveTitle(/One Stop Solution for Code Snippets | OPENHAVEN/);

        // Check Header Text
        // The logo text is "OPENHAVEN"
        await expect(page.getByAltText('OPENHAVEN')).toBeVisible();
    });

    test('Navigation to Login works', async ({ page }) => {
        await page.goto('/');
        await page.getByRole('link', { name: 'Log In' }).click();
        await expect(page).toHaveURL(/\/login/);
        await expect(page.getByRole('heading', { name: 'Log in to your account' })).toBeVisible();
    });

    test('Search UI exists', async ({ page }) => {
        await page.goto('/');
        const searchInput = page.getByPlaceholder('Search snippets, tags, or authors...');
        await expect(searchInput).toBeVisible();
    });

    // Basic Auth Flow (Requires running backend and clean state ideally)
    test('Can Navigate to Signup', async ({ page }) => {
        await page.goto('/signup');
        await expect(page.getByRole('heading', { name: 'Create an account' })).toBeVisible();
    });
});
