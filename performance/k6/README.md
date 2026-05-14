# Phoenix Express k6 Performance Tests

This k6 suite covers the mandatory performance and load testing scenarios:

- Read-heavy workloads: incident/operations listing through `/api/admin/reports` when admin login succeeds, otherwise `/api/orders`.
- Write-heavy workloads: report submissions through `/api/feedbacks` plus customer order creation through `/api/orders`.
- Mixed workloads: read listing plus admin/customer/employee reads and periodic report submissions.
- Full-system workload: auth, public content, admin dashboard/reporting, customer profile/orders/notifications, employee dashboard/orders/wallet, shipment tracking, reports, order creation, newsletter subscription/status.
- Spike testing: sudden traffic jump on the mixed workload.
- Sustained load / soak testing: long-running full-system workload.

## Prerequisites

1. Install k6: https://grafana.com/docs/k6/latest/set-up/install-k6/
2. Start the backend locally:

```bash
cd backend
npm start
```

3. Make sure the database has seed data. The default credentials used by the script are:

```text
Admin:    admin@phoenix.ps / 12345
Employee: ahmad.employee@phoenix.ps / Password123!
Customer: nablus.supplies@phoenix.ps / Password123!
Fallback customer: lama.customer@phoenix.ps / Password123!
```

## Coverage

The `full-system` profile exercises:

```text
Auth:          POST /api/auth/login
Admin:         /api/admin/dashboard, /api/admin/reports, /api/admin/regions,
               /api/admin/delegates, /api/admin/merchants,
               /api/admin/parcel-distribution, /api/admin/returned-shipments,
               /api/admin/handover-requests
Customer:      /api/customers/profile/me, /api/orders/me,
               /api/customers/settlements/me, /api/notifications/me,
               /api/notifications/unread-count
Employee:      /api/employees/dashboard, /api/employees/profile,
               /api/employees/orders, /api/employees/wallet
Operations:    /api/orders, /api/shipments, /api/orders/regions,
               /api/feedbacks/summary, /api/wallets
Tracking:      /api/tracking/number/:trackingNumber
Public:        /, /api/articles, /api/photogalleries,
               /api/site-content/about, /api/vehicles
Writes:        POST /api/feedbacks, POST /api/orders,
               POST /api/newsletter/subscribe
Newsletter:    /api/newsletter/employee/status
```

The mandatory profiles are still available separately:

```text
read-heavy
write-heavy
mixed
spike
soak
```

Default admin credentials:

```text
admin@phoenix.ps
12345
```

## Run The Tests

Run from the repository root:

```bash
k6 run -e PROFILE=smoke performance/k6/phoenix-load-test.js
k6 run -e PROFILE=read-heavy performance/k6/phoenix-load-test.js
k6 run -e PROFILE=write-heavy performance/k6/phoenix-load-test.js
k6 run -e PROFILE=mixed performance/k6/phoenix-load-test.js
k6 run -e PROFILE=full-system performance/k6/phoenix-load-test.js
k6 run -e PROFILE=spike performance/k6/phoenix-load-test.js
k6 run -e PROFILE=soak performance/k6/phoenix-load-test.js
```

Or use npm scripts:

```bash
npm run perf:smoke
npm run perf:read
npm run perf:write
npm run perf:mixed
npm run perf:full
npm run perf:spike
npm run perf:soak
```

To save machine-readable result files for documentation:

```bash
k6 run -e PROFILE=smoke --summary-export performance/k6/results-smoke.json performance/k6/phoenix-load-test.js
k6 run -e PROFILE=read-heavy --summary-export performance/k6/results-read-heavy.json performance/k6/phoenix-load-test.js
k6 run -e PROFILE=write-heavy --summary-export performance/k6/results-write-heavy.json performance/k6/phoenix-load-test.js
k6 run -e PROFILE=mixed --summary-export performance/k6/results-mixed.json performance/k6/phoenix-load-test.js
k6 run -e PROFILE=spike --summary-export performance/k6/results-spike.json performance/k6/phoenix-load-test.js
k6 run -e PROFILE=soak --summary-export performance/k6/results-soak.json performance/k6/phoenix-load-test.js
```

For a shorter soak test during demos:

```bash
k6 run -e PROFILE=soak -e SOAK_DURATION=5m -e SOAK_VUS=10 performance/k6/phoenix-load-test.js
```

If the backend is not on `http://localhost:5000`, pass `BASE_URL`:

```bash
k6 run -e BASE_URL=http://localhost:5000 -e PROFILE=mixed performance/k6/phoenix-load-test.js
```

To use different admin credentials:

```bash
k6 run -e ADMIN_EMAIL=admin@example.com -e ADMIN_PASSWORD=secret -e PROFILE=read-heavy performance/k6/phoenix-load-test.js
```

## Acceptance Thresholds

The script fails the run when:

- More than 5% of requests fail.
- Overall p95 latency is 1200ms or higher.
- Auth p95 latency is 1000ms or higher.
- Read p95 latency is 900ms or higher.
- Write p95 latency is 1500ms or higher.
- Admin/customer/employee p95 latency is 1200ms or higher.
- Tracking p95 latency is 1000ms or higher.

These thresholds are intentionally practical for a local academic project. Tighten them later when you have production-like infrastructure.

## Notes

The write workloads intentionally create test feedback records, test orders, and newsletter subscriptions. Use a development or staging database for load tests, not a production database.

## Test Results

Environment:

```text
Date: 2026-05-14
Machine: local development machine
Backend URL: http://localhost:5000
Database: local development PostgreSQL
k6 version: 1.7.1
```

Summary table:

| Scenario | Workload Purpose | Result | Failed Requests | Checks Passed | p95 Overall Latency | p95 Read | p95 Write | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| smoke | Quick end-to-end validation | PASS | 0.00% | 100.00% | 109.84ms | 110.17ms | 31.66ms | Full-system script validated before longer runs |
| read-heavy | Incident and operations listing under read load | PASS | 0.00% | 100.00% | 134.59ms | 133.91ms | N/A | Read-heavy latency improved significantly after limiting heavy list endpoints |
| write-heavy | Report and order submissions under write load | PASS | 0.00% | 100.00% | 18.89ms | N/A | 18.79ms | Created 2266 feedback reports and 567 test orders |
| mixed | Combined read/write operational journey | PASS | 0.00% | 100.00% | 229.88ms | 240.04ms | 177.58ms | Simulated normal system usage with customer and employee reads |
| spike | Sudden traffic increase | PASS | 0.00% | 100.00% | 334.32ms | 341.32ms | 186.98ms | System stayed available and responsive at 80 VUs |
| soak | Sustained full-system load | STABLE / READ LATENCY THRESHOLD EXCEEDED | 0.00% | 100.00% | 1.09s | 1096.64ms | 25.44ms | 5-minute soak at 10 VUs stayed available; read p95 remained slightly above the strict 900ms target |

Detailed run metrics:

| Scenario | Max VUs | Duration | HTTP Requests | Iterations | Data Received | Key Observations |
| --- | ---: | ---: | ---: | ---: | ---: | --- |
| smoke | 1 | 10s | 293 | 9 | 9.5 MB | All full-system checks passed |
| read-heavy | 25 | 2m | 16986 | 1306 | 111 MB | Read p95 stayed well below the 900ms target |
| write-heavy | 18 | 2m | 2841 | 1133 | 3.3 MB | Write path remained fast and stable |
| mixed | 25 | 3m | 9344 | 2155 | 939 MB | Normal mixed use remained within thresholds |
| spike | 80 | 1m55s | 18340 | 4231 | 130 MB | Spike workload passed all thresholds after endpoint limiting and dashboard tuning |
| soak | 10 | 5m | 33451 | 1060 | 1.0 GB | No failed requests during sustained load; only read p95 exceeded the strict read target |

Interpretation:

- Functional stability was strong across all runs: every scenario reported 0.00% failed requests and 100.00% successful checks.
- Read-heavy improved from a previous p95 of about 1.16s to 133.91ms after limiting heavy list endpoints.
- Smoke, read-heavy, write-heavy, mixed, and spike workloads stayed within the configured latency thresholds.
- Spike improved from a previous p95 of about 3.33s to 334.32ms after endpoint limiting and dashboard tuning.
- The 5-minute soak test confirmed availability at 10 VUs; only read p95 remained above the strict 900ms target.
- Recommended next optimization areas: cache admin dashboard/report summaries, add database indexes for frequently sorted/filterable columns, and keep full-system soak traffic weighted toward realistic user journeys.
