/**
 * smoke.spec.ts — the cheapest possible signal that the app is alive.
 *
 * If these fail, don't bother reading the rest of the report: the app cannot
 * even render. Also listens for uncaught page errors — a silent JS exception
 * on load would otherwise go unnoticed by DOM assertions.
 */

import { expect, test } from '@playwright/test';
import { HomePage } from '../page-objects/home-page.js';

test.describe('SkyCast smoke @smoke', () => {
  let home: HomePage;
  let pageErrors: string[];

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(String(error)));
    await home.open();
  });

  test('loads with the core UI in place', async () => {
    await expect(home.page).toHaveTitle(/SkyCast/);
    await expect(home.page.getByRole('heading', { name: /skycast/i })).toBeVisible();
    await expect(home.searchInput).toBeVisible();
    await expect(home.searchButton).toBeEnabled();
    await expect(home.page.getByText(/open-meteo/i)).toBeVisible();
    await expect(home.weatherPanel).toBeHidden(); // Nothing fetched yet
  });

  test('boots without any uncaught JavaScript errors', async () => {
    await home.searchInput.click(); // Force a paint + interaction cycle
    expect(pageErrors).toEqual([]);
  });
});
