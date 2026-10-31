/**
 * search.spec.ts — the critical user journey: find a city, see the weather.
 *
 * All network traffic is mocked (see fixtures/api-mocks.ts) so these tests
 * are deterministic and hermetic. Assertions verify *visible outcomes*
 * (text the user reads), not implementation details.
 */

import { expect, test } from '@playwright/test';
import { mockCityFound, mockForecastSuccess } from '../fixtures/api-mocks.js';
import { HomePage } from '../page-objects/home-page.js';
import { LONDON } from '../test-data/cities.js';

test.describe('City search journey', () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await mockCityFound(page);
    await mockForecastSuccess(page);
    await home.open();
  });

  test('searching a city renders current conditions and a 5-day forecast', async () => {
    await home.searchFor(LONDON.query);

    await home.expectWeatherFor(LONDON.expected.placeHeading);
    await expect(home.currentTemp).toHaveText(LONDON.expected.currentTempC);
    await expect(home.conditionLabel).toHaveText(LONDON.expected.condition);
    await expect(home.details).toContainText(LONDON.expected.humidity);
    await expect(home.details).toContainText(LONDON.expected.wind);
    await expect(home.details).toContainText(LONDON.expected.precipitation);
    await expect(home.forecastItems).toHaveCount(LONDON.expected.forecastItems);
    await expect(home.forecastItems.first()).toContainText(LONDON.expected.firstForecastDay);
  });

  test('a completed search is saved as a recent chip and survives a reload', async ({ page }) => {
    await home.searchFor(LONDON.query);
    await home.expectWeatherFor(LONDON.expected.placeHeading);

    await expect(home.recentChips).toHaveCount(1);
    await expect(home.recentChips.first()).toHaveText(LONDON.expected.placeHeading);

    // Persistence: the chip must still be there after a full page reload.
    await page.reload();
    await expect(home.recentChips).toHaveCount(1);
  });

  test('clicking a recent chip re-opens that city without typing', async ({ page }) => {
    await home.searchFor(LONDON.query);
    await home.expectWeatherFor(LONDON.expected.placeHeading);

    await page.reload();
    await home.recentChips.first().click();

    await home.expectWeatherFor(LONDON.expected.placeHeading);
    await expect(home.currentTemp).toHaveText(LONDON.expected.currentTempC);
  });

  test('empty input is rejected with inline guidance before any request', async () => {
    await home.searchFor('   ');

    await expect(home.searchError).toBeVisible();
    await expect(home.searchError).toContainText(/type a city/i);
    await expect(home.weatherPanel).toBeHidden();
  });

  test('the °F toggle converts the display and persists the choice', async ({ page }) => {
    await home.searchFor(LONDON.query);
    await expect(home.currentTemp).toHaveText(LONDON.expected.currentTempC);

    await home.fahrenheitButton.click();

    await expect(home.currentTemp).toHaveText(LONDON.expected.currentTempF);
    await expect(home.celsiusButton).toHaveAttribute('aria-pressed', 'false');
    await expect(home.fahrenheitButton).toHaveAttribute('aria-pressed', 'true');

    // The choice must survive a reload (localStorage).
    await page.reload();
    expect(await page.evaluate(() => localStorage.getItem('skycast:units'))).toBe('"imperial"');
  });

  test('keyboard-only users can complete the full journey', async ({ page }) => {
    // Reach the search field using Tab only. Focus order differs between
    // engines (WebKit skips links by default), so tab until it lands there.
    for (let attempt = 0; attempt < 6; attempt += 1) {
      await page.keyboard.press('Tab');
      const reachedInput = await home.searchInput.evaluate(
        (el) => el === document.activeElement,
      );
      if (reachedInput) break;
    }
    await expect(home.searchInput).toBeFocused();

    await page.keyboard.type(LONDON.query);
    await page.keyboard.press('Enter'); // form submits via keyboard

    await home.expectWeatherFor(LONDON.expected.placeHeading);
  });
});

test.describe('Geolocation journey', () => {
  test('granting location permission renders weather without a search', async ({ browser }) => {
    const context = await browser.newContext({
      geolocation: { latitude: 51.5072, longitude: -0.1275 },
      permissions: ['geolocation'],
    });
    const page = await context.newPage();
    const geoHome = new HomePage(page);

    await mockForecastSuccess(page);
    await geoHome.open();
    await geoHome.locationButton.click();

    await geoHome.expectWeatherFor('My location');
    await context.close();
  });
});
