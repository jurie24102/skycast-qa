/**
 * home-page.ts — Page Object for the SkyCast home screen.
 *
 * Every locator and interaction for the page lives here. Spec files describe
 * *user journeys*, never raw selectors, so a redesign of the app touches one
 * file instead of twenty tests.
 *
 * Selectors are user-facing (roles, labels, text) rather than implementation
 * details (CSS classes) — the same attributes screen readers rely on.
 */

import { expect, type Locator, type Page } from '@playwright/test';

export class HomePage {
  readonly page: Page;

  // Search form
  readonly searchInput: Locator;
  readonly searchButton: Locator;
  readonly locationButton: Locator;
  readonly searchError: Locator;

  // Unit toggle
  readonly celsiusButton: Locator;
  readonly fahrenheitButton: Locator;

  // Recent searches
  readonly recentSection: Locator;
  readonly recentChips: Locator;

  // Status region (loading + errors)
  readonly statusRegion: Locator;
  readonly errorCard: Locator;
  readonly retryButton: Locator;

  // Weather results
  readonly weatherPanel: Locator;
  readonly placeHeading: Locator;
  readonly currentTemp: Locator;
  readonly conditionLabel: Locator;
  readonly details: Locator;
  readonly forecastItems: Locator;

  constructor(page: Page) {
    this.page = page;

    this.searchInput = page.getByLabel('City', { exact: true });
    this.searchButton = page.getByRole('button', { name: 'Search', exact: true });
    this.locationButton = page.getByRole('button', { name: /my location/i });
    this.searchError = page.locator('#search-error');

    this.celsiusButton = page.getByRole('button', { name: '°C' });
    this.fahrenheitButton = page.getByRole('button', { name: '°F' });

    this.recentSection = page.locator('#recent');
    this.recentChips = page.locator('.recent-list .chip');

    this.statusRegion = page.locator('#status-region');
    this.errorCard = this.statusRegion.locator('.status-card.error');
    this.retryButton = this.statusRegion.getByRole('button', { name: /try again/i });

    this.weatherPanel = page.locator('#weather');
    this.placeHeading = page.locator('#place-heading');
    this.currentTemp = page.locator('#current-temp');
    this.conditionLabel = page.locator('#cond-desc');
    this.details = page.locator('#details');
    this.forecastItems = page.locator('.forecast li');
  }

  /** Navigate to the app root. */
  async open(): Promise<void> {
    await this.page.goto('/');
  }

  /** Type a city and submit — the way a keyboard user would. */
  async searchFor(city: string): Promise<void> {
    await this.searchInput.fill(city);
    await this.searchButton.click();
  }

  /** Assert a successful weather render for the given place. */
  async expectWeatherFor(placeLabel: string): Promise<void> {
    await expect(this.weatherPanel).toBeVisible();
    await expect(this.placeHeading).toHaveText(placeLabel);
  }

  /** Assert the friendly error card is shown with the given title. */
  async expectError(title: RegExp): Promise<void> {
    await expect(this.errorCard).toBeVisible();
    await expect(this.errorCard.getByText(title)).toBeVisible();
  }
}
