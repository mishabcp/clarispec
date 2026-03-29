# Performance events report (`perf_events`)

**Generated:** 2026-03-29 (UTC)  
**Dataset:** 884 rows from `public.perf_events`  
**Window:** `2026-03-28T18:25:53Z` → `2026-03-29T13:04:50Z` (approx. 19 hours)

This report summarizes **latency and Web Vitals** captured by the app’s perf logging (server API timings, edge proxy, client fetch wrapper, and Next.js Web Vitals). Durations are in **milliseconds (ms)** unless noted.

---

## How to read these numbers


| Field   | Meaning                                                                                      |
| ------- | -------------------------------------------------------------------------------------------- |
| **avg** | Arithmetic mean of `duration_ms` for that group.                                             |
| **p50** | Median: half of events are faster than this.                                                 |
| **p95** | Rough tail: 95% of events are at or below this (approximate percentile on discrete samples). |
| **max** | Single slowest event in the group.                                                           |


**Web Vitals** (`LCP`, `FCP`, `TTFB`, etc.): `duration_ms` is the **metric value** reported by the browser (e.g. LCP ≈ time to largest contentful paint), not the time taken to run a logging function.

**Server `api` rows** and **client `fetch` rows**: wall time for the HTTP request as instrumented.

---

## Overall


| Metric               | Value                                                        |
| -------------------- | ------------------------------------------------------------ |
| Total events         | 884                                                          |
| Slowest single event | **11,376 ms** — `LCP` on `/login` (Web Vital, rating `poor`) |


---

## Average duration by `source`

Sorted by **average** (slowest sources first).


| source | count | avg (ms) | p50 (ms) | p95 (ms) | max (ms) |
| ------ | ----- | -------- | -------- | -------- | -------- |
| server | 34    | 1,188.0  | 1,119.2  | 1,859.9  | 2,121.9  |
| client | 466   | 1,067.5  | 413.9    | 4,164.0  | 11,376.0 |
| edge   | 384   | 32.4     | 26.9     | 89.5     | 848.5    |


**Takeaway:** **Server** API timings cluster around **~1.1–1.2 s** median. **Client** averages are pulled up by **Web Vitals** (multi-second LCP/FCP). **Edge proxy** is usually fast; the **848 ms** max is worth occasional investigation.

---

## Average duration by `kind`


| kind       | count | avg (ms) | p50 (ms) | p95 (ms) | max (ms) |
| ---------- | ----- | -------- | -------- | -------- | -------- |
| web-vital  | 289   | 1,309.4  | 732.0    | 5,320.0  | 11,376.0 |
| api        | 34    | 1,188.0  | 1,119.2  | 1,859.9  | 2,121.9  |
| fetch      | 118   | 996.1    | 1,086.1  | 2,200.1  | 3,987.5  |
| proxy      | 384   | 32.4     | 26.9     | 89.5     | 848.5    |
| navigation | 59    | 25.3     | 25.0     | 40.2     | 114.2    |


---

## Average duration by `name` (every distinct name)

Sorted by **average duration** (slowest first). Low-sample routes (n = 1–4) are noisy; treat them as signals to re-measure under load.


| name                                                        | n   | avg (ms) | p50 (ms) | p95 (ms) | max (ms) |
| ----------------------------------------------------------- | --- | -------- | -------- | -------- | -------- |
| LCP                                                         | 71  | 2,847.3  | 2,700.0  | 5,780.0  | 11,376.0 |
| /api/admin/users                                            | 4   | 2,546.4  | 1,752.1  | 2,872.6  | 3,987.5  |
| FCP                                                         | 72  | 2,186.2  | 2,012.0  | 4,164.0  | 11,288.0 |
| /api/admin/projects/fdf84388-3fed-4f5a-8f54-a7564ae53c32    | 3   | 2,156.2  | 2,348.6  | 2,348.6  | 2,433.5  |
| /api/admin/stats                                            | 4   | 2,119.1  | 1,890.8  | 1,935.9  | 2,769.1  |
| /api/projects/12ca0380-a049-4c27-bc4f-10f34390f242/messages | 1   | 1,962.7  | 1,962.7  | 1,962.7  | 1,962.7  |
| GET /api/admin/stats                                        | 4   | 1,723.0  | 1,579.0  | 1,637.5  | 2,121.9  |
| /api/admin/projects/12ca0380-a049-4c27-bc4f-10f34390f242    | 1   | 1,719.3  | 1,719.3  | 1,719.3  | 1,719.3  |
| GET /api/admin/projects/[projectId]                         | 4   | 1,669.2  | 1,422.5  | 1,826.7  | 2,085.1  |
| /api/admin/auth/login                                       | 1   | 1,630.6  | 1,630.6  | 1,630.6  | 1,630.6  |
| /api/admin/projects                                         | 6   | 1,613.2  | 1,394.7  | 1,889.4  | 2,255.4  |
| GET /api/admin/users                                        | 4   | 1,466.1  | 1,329.9  | 1,364.1  | 1,859.9  |
| GET /api/projects/[projectId]/messages                      | 1   | 1,398.6  | 1,398.6  | 1,398.6  | 1,398.6  |
| /api/admin/documents                                        | 4   | 1,296.7  | 1,106.9  | 1,136.3  | 1,857.5  |
| GET /api/admin/projects                                     | 6   | 1,286.2  | 1,119.2  | 1,622.9  | 1,676.9  |
| /api/admin/messages                                         | 4   | 1,219.8  | 1,112.8  | 1,150.4  | 1,511.0  |
| /api/projects/12ca0380-a049-4c27-bc4f-10f34390f242          | 1   | 1,207.7  | 1,207.7  | 1,207.7  | 1,207.7  |
| /api/admin/document-selections                              | 3   | 1,205.4  | 1,095.5  | 1,095.5  | 1,476.2  |
| /api/admin/auth/session                                     | 1   | 1,132.5  | 1,132.5  | 1,132.5  | 1,132.5  |
| POST /api/admin/auth/login                                  | 1   | 1,051.0  | 1,051.0  | 1,051.0  | 1,051.0  |
| GET /api/admin/documents                                    | 4   | 914.4    | 810.6    | 833.5    | 1,216.1  |
| GET /api/admin/messages                                     | 4   | 821.5    | 815.9    | 823.8    | 838.6    |
| GET /api/admin/document-selections                          | 3   | 814.1    | 803.3    | 803.3    | 864.0    |
| /api/admin/auth/logout                                      | 1   | 798.3    | 798.3    | 798.3    | 798.3    |
| /api/perf/events                                            | 84  | 721.4    | 607.8    | 1,359.0  | 2,200.1  |
| GET /api/projects/[projectId]                               | 1   | 577.6    | 577.6    | 577.6    | 577.6    |
| GET /api/admin/auth/session                                 | 1   | 574.5    | 574.5    | 574.5    | 574.5    |
| POST /api/admin/auth/logout                                 | 1   | 255.1    | 255.1    | 255.1    | 255.1    |
| TTFB                                                        | 73  | 248.9    | 49.6     | 778.8    | 8,885.9  |
| INP                                                         | 7   | 67.4     | 64.0     | 96.0     | 120.0    |
| proxy                                                       | 384 | 32.4     | 26.9     | 89.5     | 848.5    |
| route-painted                                               | 59  | 25.3     | 25.0     | 40.2     | 114.2    |
| FID                                                         | 66  | 3.0      | 2.8      | 10.5     | 14.1     |


---

## Slowest individual events (top 15)


| duration_ms | kind      | name | path                                                    | notes                     |
| ----------- | --------- | ---- | ------------------------------------------------------- | ------------------------- |
| 11,376      | web-vital | LCP  | /login                                                  | `rating: poor`            |
| 11,288      | web-vital | FCP  | /login                                                  | `rating: poor`            |
| 8,885.9     | web-vital | TTFB | /login                                                  | `rating: poor`            |
| 8,064       | web-vital | FCP  | /login                                                  | `rating: poor`            |
| 5,780       | web-vital | LCP  | /dashboard, /documents, /guide, /settings, /projects, … | multiple rows; all `poor` |


Several **5,780 ms LCP** samples appear across authenticated routes in the same second bucket—likely a **session or batch of navigations** under similar conditions.

---

## What is slowest (ranked by concern)

1. **Login route (`/login`) — Web Vitals**
  Dominates the **max** values: **LCP ~11.4 s**, **FCP ~11.3 s**, **TTFB ~8.9 s**, all **poor**. This is end-user perceived load, not just server CPU.
2. **Admin and project APIs (server `api` + matching client `fetch`)**
  Many handlers sit in **~0.8–2.5 s** average with **p95** often **1.3–1.9 s**. Slowest named API averages include `**/api/admin/users`** (client fetch avg **2,546 ms**, n=4) and `**GET /api/admin/stats`** / related routes (~**1.7–2.1 s**).
3. **Client fetch to `/api/perf/events`**
  Average **~721 ms** (n=84): acceptable for batched telemetry but adds noise and cost; see optimizations below.
4. **Edge `proxy`**
  Typical **~26–32 ms** median; **max ~849 ms** suggests rare cold paths or contention—lower priority unless SLOs require tighter edge latency.

---

## Optimization recommendations (technical)

### 1. `/login` — LCP / FCP / TTFB (highest impact)

- **Measure in Lighthouse + Network tab**: confirm whether slowness is **HTML/TTFB**, **JS execution**, or **large images/fonts**.
- **Reduce JS on the login chunk**: dynamic import non-critical UI; audit **bundle size** for that route.
- **Fonts**: use `next/font`, subset weights, avoid invisible text periods (FOIT).
- **SSR / data**: avoid blocking the document on slow auth checks; defer non-critical work to client after paint where safe.
- **Hosting**: if TTFB is high before React, check **region**, **cold starts**, and **caching** for static shell.

### 2. Admin APIs (~1–2.5 s averages)

- **Database**: `EXPLAIN ANALYZE` on queries behind **stats**, **users**, **projects**, **documents**, **messages**; add **indexes** for filters/joins you use in production.
- **Payload**: narrow `select(...)` to required columns; avoid loading large JSON blobs by default.
- **Parallelism**: where routes fan out to multiple queries, run **independent** queries with `Promise.all` (if not already).
- **Caching**: short TTL cache for **stats** or aggregate reads if data does not need to be real-time.

### 3. Project dashboard routes (LCP ~5.8 s, `poor`)

- Treat like **heavy client routes**: chart libraries, large lists, and **client-only** effects inflate LCP.
- **Code-split** heavy widgets (e.g. charts), **virtualize** long lists, **lazy-load** below-the-fold content.

### 4. Perf ingest (`/api/perf/events`)

- **Optional**: exclude this path from the client `fetch` wrapper (or sample) to avoid **feedback** in the same table you use to tune performance.
- **Batch tuning**: current **12 s** flush is reasonable; if needed, increase batch size slightly to cut request count (trade-off: memory).

### 5. Edge proxy tail (~849 ms max)

- Correlate with **admin** vs **app** branches in `meta.branch` in future analysis; check **middleware** work (session refresh, redirects) on slow requests.

---

## Regenerating this report

1. Ensure `.env.local` has `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (read-only use recommended for scripts; never commit keys).
2. Query `perf_events` via Supabase SQL or REST with pagination (PostgREST default limits apply).
3. Recompute aggregates (avg / p50 / p95 / max) by `source`, `kind`, and `name`.

---

## Limitations

- Small **n** on several routes → averages are **indicative**, not production SLOs.
- **Client** and **server** rows for the “same” endpoint use **different** `name` shapes (e.g. `GET /api/admin/users` vs `/api/admin/users`); compare both when tuning.
- This file is a **snapshot**; new traffic will change numbers.

