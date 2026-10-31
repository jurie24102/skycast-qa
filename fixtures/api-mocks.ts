/**
 * api-mocks.ts — route-interception helpers.
 *
 * Most journeys are tested against **mocked** Open-Meteo responses so the
 * suite is deterministic, fast, and able to reproduce failure modes (404-ish
 * empty results, HTTP 500, dead network) on demand. A small set of `@live`
 * tagged tests runs against the real API separately — see tests/live/.
 */

import type { Page } from '@playwright/test';
import { LONDON, UNKNOWN_CITY } from '../test-data/cities.js';

const GEOCODE_PATTERN = '**/geocoding-api.open-meteo.com/**';
const FORECAST_PATTERN = '**/api.open-meteo.com/v1/forecast*';

function jsonPayload(body: unknown, status = 200) {
  return {
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  };
}

/** Geocoding resolves the query to a city (London by default). */
export async function mockCityFound(page: Page, city = LONDON): Promise<void> {
  await page.route(GEOCODE_PATTERN, (route) =>
    route.fulfill(jsonPayload(city.geocodingResponse)),
  );
}

/** Geocoding answers successfully but with zero results ("city not found"). */
export async function mockCityNotFound(page: Page, city = UNKNOWN_CITY): Promise<void> {
  await page.route(GEOCODE_PATTERN, (route) =>
    route.fulfill(jsonPayload(city.geocodingResponse)),
  );
}

/** Forecast API returns healthy data. */
export async function mockForecastSuccess(page: Page): Promise<void> {
  await page.route(FORECAST_PATTERN, (route) =>
    route.fulfill(jsonPayload(LONDON.forecastResponse)),
  );
}

/** Forecast API answers with a server error — the app must degrade gracefully. */
export async function mockForecastServerError(page: Page): Promise<void> {
  await page.route(FORECAST_PATTERN, (route) =>
    route.fulfill({ status: 500, contentType: 'text/plain', body: 'Internal Server Error' }),
  );
}

/** The network is down for all Open-Meteo hosts — requests never leave the machine. */
export async function simulateOffline(page: Page): Promise<void> {
  await page.route(GEOCODE_PATTERN, (route) => route.abort('internetdisconnected'));
  await page.route(FORECAST_PATTERN, (route) => route.abort('internetdisconnected'));
}
