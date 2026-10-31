# SkyCast QA 🧪

> A professional end-to-end (E2E) UI test suite for [SkyCast](https://github.com/jurie24102/skycast), built with **Playwright** and **TypeScript**.

[![E2E Tests](https://github.com/jurie24102/skycast-qa/actions/workflows/e2e.yml/badge.svg)](https://github.com/jurie24102/skycast-qa/actions/workflows/e2e.yml)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Browser](https://img.shields.io/badge/browsers-Chromium%20·%20Firefox%20·%20WebKit-blue)

---

## What this repo demonstrates

- **Critical user journeys automated** — search, render verification, unit switching, geolocation, recent-search persistence, keyboard-only usage
- **Failure-mode testing** — the suite *forces* city-not-found responses, HTTP 500s and dead networks, then proves the UI degrades gracefully and recovers
- **Industry-standard structure** — Page Object Model, typed test-data fixtures, route-based API mocking, and zero hardcoded sleeps (everything relies on Playwright's auto-waiting with explicit timeouts as a safety net)
- **Cross-browser coverage** — Chromium, Firefox and WebKit in CI
- **Accessibility gates** — axe-core scans fail the build on critical/serious violations

The application under test lives in the sibling repo
**[skycast](https://github.com/jurie24102/skycast)** (vanilla JS weather app,
deployed at https://jurie24102.github.io/skycast/). Together they demonstrate
the full build-it → break-it → prove-it loop.

## Test coverage matrix

| User journey | Test file | Key assertions |
| --- | --- | --- |
| App boots cleanly, no JS errors | `smoke.spec.ts` | Title, core UI visible, zero uncaught page errors |
| Search a city → weather renders | `search.spec.ts` | Place name, temp, condition, 5 forecast rows, detail values |
| Recent search saved + survives reload | `search.spec.ts` | Chip exists before/after reload |
| Recent chip re-runs the search | `search.spec.ts` | Full result renders without typing |
| Empty input rejected inline | `search.spec.ts` | Validation message, no request side-effects |
| °C → °F conversion + persistence | `search.spec.ts` | Converted display, `aria-pressed` state, localStorage |
| Keyboard-only journey | `search.spec.ts` | Skip link focus, Enter submits, results render |
| Geolocation journey | `search.spec.ts` | Granted permissions → weather without search |
| Unknown city | `errors.spec.ts` | Friendly error, app still usable afterwards |
| HTTP 500 from forecast API | `errors.spec.ts` | Recoverable error card, no crash |
| Network offline | `errors.spec.ts` | "Connection problem" + Try again |
| Recovery after network restore | `errors.spec.ts` | Retry button completes the *same* journey successfully |
| Failed attempts don't corrupt state | `errors.spec.ts` | localStorage untouched |
| Accessibility (empty + result states) | `a11y.spec.ts` | Zero critical/serious axe violations |
| Live Open-Meteo contract | `live/live-api.spec.ts` | Real API renders; nonsense query handled |

## Strategy

### Mocked by default, live on demand
Journey and error tests intercept Open-Meteo with `page.route()` and serve
recorded payloads. This makes the suite **deterministic, fast, and able to
reproduce failures on demand** — you cannot reliably test a 500 response by
waiting for a real outage. The `@live` tagged tests hit the real API to verify
the integration contract, and are opt-in:

```bash
npm run test:live   # RUN_LIVE_TESTS=1 playwright test --grep @live
```

### Page Object Model
Specs contain **zero selectors**. All locators live in
[`page-objects/home-page.ts`](page-objects/home-page.ts) and are user-facing
(`getByRole`, `getByLabel`) — the same attributes screen readers use — so a UI
redesign means editing one file, not twenty tests.

### Dynamic waits, not sleeps
There is not a single `waitForTimeout` in this suite. Playwright auto-waits
for elements to be actionable, `expect()` polls assertions with a 7-second
budget, and explicit `actionTimeout`/`navigationTimeout` values act purely as
failure detectors.

### Reproducible failures
`fixtures/api-mocks.ts` encodes each failure mode:

| Mock | Reproduces |
| --- | --- |
| `mockCityNotFound` | Search matching zero cities |
| `mockForecastServerError` | Forecast API returning HTTP 500 |
| `simulateOffline` | Dead network (`route.abort`) |
| `mockCityFound` + `mockForecastSuccess` | The happy path |

## Getting started

**Prerequisites:** Node.js 20+ (22 recommended).

```bash
git clone https://github.com/jurie24102/skycast-qa.git
cd skycast-qa
npm install
npx playwright install          # browser binaries
```

> The suite expects the `skycast` app repo cloned **as a sibling folder**
> (`../skycast`) — the built-in static server serves it automatically.
> To test a deployed instance instead: `BASE_URL=https://jurie24102.github.io/skycast npx playwright test`

### Run it

| Command | What it does |
| --- | --- |
| `npm test` | Full suite, headless, all 3 browsers |
| `npm run test:headed` | Watch the browser while tests run |
| `npm run test:ui` | Playwright UI mode (trace, time travel, watch mode) |
| `npm run test:chromium` | Chromium only (quick local loop) |
| `npm run test:quick` | Chromium + WebKit (skips Firefox — handy on macOS betas) |
| `npm run test:live` | The `@live` tests against the real Open-Meteo API |
| `npm run report` | Open the HTML report from the last run |

## Project structure

```
skycast-qa/
├── tests/
│   ├── smoke.spec.ts          # Boot + zero-JS-error checks
│   ├── search.spec.ts         # Critical journeys (search, toggle, geolocation)
│   ├── errors.spec.ts         # Failure modes + recovery
│   ├── a11y.spec.ts           # axe-core accessibility gates
│   └── live/live-api.spec.ts  # Real-API contract tests (@live, opt-in)
├── page-objects/
│   └── home-page.ts           # Single source of truth for locators/actions
├── fixtures/
│   └── api-mocks.ts           # Route interception for every failure mode
├── test-data/
│   └── cities.ts              # Typed, single-source-of-truth fixtures
├── scripts/
│   └── static-server.mjs      # Dependency-free server for the app under test
├── playwright.config.ts       # Retries, traces, projects, webServer
└── .github/workflows/e2e.yml  # CI: 3 browsers, artifact report on failure
```

## Configuration highlights

| Setting | Value | Why |
| --- | --- | --- |
| `retries` | 2 in CI, 0 locally | Flakiness is surfaced locally, absorbed in CI |
| `trace` | `retain-on-failure` | Every failure ships with a full time-travel trace |
| `reporter` | `list` + `html` | Terminal feedback locally, rich report in CI |
| `forbidOnly` | `true` in CI | Prevents `test.only` slipping into main |
| `fullyParallel` | `true` | Fast suites; each test gets an isolated context |
| `webServer` | Auto-starts `../skycast` | One command runs everything |

## CI

The [E2E workflow](.github/workflows/e2e.yml) runs on every push and PR:
checks out the app repo alongside the suite, installs dependencies and all
three browser engines, executes the suite, and uploads the HTML report
(+ traces, screenshots, videos of failures) as a workflow artifact.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| Firefox won't launch (`Could not find profile folder` / invalid code signature) | Upstream Playwright Firefox build issue on some macOS betas. Run `npm run test:quick` locally; CI runs Firefox on Ubuntu. |
| `EADDRINUSE` on port 4173 | Stop whatever holds the port, then re-run. |
| Live tests show as skipped | By design — they're opt-in: `npm run test:live`. |

## Roadmap

- [ ] Visual regression checks (screenshot diffs on the current-conditions card)
- [ ] Open-Meteo contract tests at the API layer (schema validation)
- [ ] Performance budget check via Lighthouse in CI
- [ ] Test tagging split for a nightly full-matrix run
