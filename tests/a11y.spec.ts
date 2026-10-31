/**
 * a11y.spec.ts — automated accessibility scans with axe-core.
 *
 * Runs on the initial page and again on a rendered result. The gate is
 * deliberately pragmatic: zero *critical* or *serious* violations (the kinds
 * that block real users). Lower-impact suggestions surface in the HTML report
 * without failing the build.
 */

import { AxeBuilder } from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { mockCityFound, mockForecastSuccess } from '../fixtures/api-mocks.js';
import { HomePage } from '../page-objects/home-page.js';
import { LONDON } from '../test-data/cities.js';

async function seriousViolations(page: import('@playwright/test').Page) {
  const results = await new AxeBuilder({ page }).analyze();
  return results.violations.filter(
    (violation) => violation.impact === 'critical' || violation.impact === 'serious',
  );
}

test.describe('Accessibility', () => {
  test('the empty app state has no critical or serious axe violations', async ({ page }) => {
    await page.goto('/');
    expect(await seriousViolations(page)).toEqual([]);
  });

  test('a rendered weather result has no critical or serious axe violations', async ({ page }) => {
    const home = new HomePage(page);
    await mockCityFound(page);
    await mockForecastSuccess(page);
    await page.goto('/');

    await home.searchFor(LONDON.query);
    await home.expectWeatherFor(LONDON.expected.placeHeading);

    expect(await seriousViolations(page)).toEqual([]);
  });
});
