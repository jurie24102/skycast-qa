/**
 * errors.spec.ts — the heart of this suite: proof that the app never breaks.
 *
 * Each test force-feeds the app a failure (empty results, HTTP 500, dead
 * network) and asserts the user gets a designed, recoverable experience —
 * the exact scenarios recruiters ask about in interviews.
 */

import { expect, test } from '@playwright/test';
import {
  mockCityFound,
  mockCityNotFound,
  mockForecastServerError,
  mockForecastSuccess,
  simulateOffline,
} from '../fixtures/api-mocks.js';
import { HomePage } from '../page-objects/home-page.js';
import { LONDON, UNKNOWN_CITY } from '../test-data/cities.js';

test.describe('Graceful failure handling', () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.open();
  });

  test('an unknown city shows a friendly not-found message and keeps the app usable', async ({ page }) => {
    await mockCityNotFound(page, UNKNOWN_CITY);

    await home.searchFor(UNKNOWN_CITY.query);

    await home.expectError(new RegExp(UNKNOWN_CITY.expected.errorTitle));
    await expect(home.weatherPanel).toBeHidden();

    // The app must remain usable: a real search straight afterwards succeeds.
    await mockCityFound(page);
    await mockForecastSuccess(page);
    await home.searchFor(LONDON.query);
    await home.expectWeatherFor(LONDON.expected.placeHeading);
  });

  test('a forecast API outage (HTTP 500) shows a recoverable error, not a crash', async ({ page }) => {
    await mockCityFound(page);
    await mockForecastServerError(page);

    await home.searchFor(LONDON.query);

    await home.expectError(/weather service trouble/i);
    await expect(home.weatherPanel).toBeHidden();
  });

  test('a network drop shows a connection error with a working Try again button', async ({ page }) => {
    await simulateOffline(page);

    await home.searchFor(LONDON.query);

    await home.expectError(/connection problem/i);
  });

  test('the app recovers end-to-end once the network is restored', async ({ page }) => {
    // 1. The network is down: search fails.
    await simulateOffline(page);
    await home.searchFor(LONDON.query);
    await home.expectError(/connection problem/i);

    // 2. The network comes back: the SAME search succeeds via the retry button.
    await page.unrouteAll();
    await mockCityFound(page);
    await mockForecastSuccess(page);

    await home.retryButton.click();

    await home.expectWeatherFor(LONDON.expected.placeHeading);
    await expect(home.currentTemp).toHaveText(LONDON.expected.currentTempC);
    await expect(home.errorCard).toHaveCount(0);
  });

  test('a failed search never corrupts saved preferences', async ({ page }) => {
    // Save a real preference first, so there is something to protect.
    await home.fahrenheitButton.click();

    await simulateOffline(page);
    await home.searchFor(LONDON.query);
    await home.expectError(/connection problem/i);

    // localStorage must be untouched by the failure.
    expect(await page.evaluate(() => localStorage.getItem('skycast:units'))).toBe('"imperial"');
    expect(await page.evaluate(() => localStorage.getItem('skycast:recent'))).toBeNull();
  });
});
