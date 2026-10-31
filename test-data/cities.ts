/**
 * cities.ts — typed test fixtures.
 *
 * The mocked Open-Meteo payloads mirror the real API's shape, and the
 * `expected` block is the single source of truth for what the UI should
 * display. Tests assert against these constants, never against logic copied
 * from the app (an assertion that reimplements the app proves nothing).
 */

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1: string;
  country_code: string;
}

export const LONDON = {
  query: 'London',

  geocodingResponse: {
    results: [
      {
        id: 2643743,
        name: 'London',
        latitude: 51.5072,
        longitude: -0.1275,
        country: 'United Kingdom',
        admin1: 'England',
        country_code: 'GB',
      },
    ] satisfies GeocodingResult[],
  },

  forecastResponse: {
    timezone: 'Europe/London',
    current: {
      time: '2026-10-31T14:20',
      temperature_2m: 18.4,
      relative_humidity_2m: 72,
      apparent_temperature: 17.9,
      precipitation: 0.4,
      weather_code: 63, // Moderate rain
      wind_speed_10m: 14.2,
    },
    daily: {
      time: ['2026-10-31', '2026-11-01', '2026-11-02', '2026-11-03', '2026-11-04', '2026-11-05'],
      weather_code: [63, 80, 3, 0, 2, 61],
      temperature_2m_max: [19.1, 17.4, 15.8, 16.2, 14.9, 15.3],
      temperature_2m_min: [11.2, 10.4, 9.1, 8.7, 7.9, 9.4],
      precipitation_probability_max: [80, 65, 20, 5, 10, 70],
    },
  },

  expected: {
    placeHeading: 'London, United Kingdom',
    currentTempC: '18°C',
    currentTempF: '65°F',
    condition: 'Moderate rain',
    feelsLike: 'Feels like',
    humidity: '72%',
    wind: '14 km/h',
    precipitation: '0.4 mm',
    forecastItems: 5,
    firstForecastDay: 'Today',
  },
} as const;

/** A query that matches no city — Open-Meteo omits the `results` key entirely. */
export const UNKNOWN_CITY = {
  query: 'Xyzzyville',
  geocodingResponse: {},
  expected: {
    errorTitle: 'No weather found for “Xyzzyville”',
    errorHint: 'Check the spelling',
  },
} as const;
