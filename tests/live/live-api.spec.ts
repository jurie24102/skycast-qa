/**
 * live-api.spec.ts — smoke tests against the REAL Open-Meteo API.
 *
 * Mocked tests prove the app's logic; these prove the integration contract
 * with the live service. They are excluded from normal runs because real
 * networks vary — opt in with:  RUN_LIVE_TESTS=1 npm run test:live
 */

import { expect, test } from '@playwright/test';
import { HomePage } from '../../page-objects/home-page.js';

test.skip(process.env.RUN_LIVE_TESTS !== '1', 'Live API tests: run with `npm run test:live`.');

test.describe('Live Open-Meteo integration @live', () => {
  let home: HomePage;

  test.beforeEach(async ({ page }) => {
    home = new HomePage(page);
    await home.open();
  });

  test('a real city search returns real weather', async () => {
    await home.searchFor('Cape Town');

    await home.expectWeatherFor(/Cape Town/);
    await expect(home.currentTemp).toHaveText(/^-?\d+°C$/);
    await expect(home.forecastItems).toHaveCount(5);
  });

  test('a nonsense query is handled gracefully against the live API', async () => {
    await home.searchFor('zzqqxxzz');

    await home.expectError(/no weather found/i);
  });
});
