# Clarispec — portfolio page (copy for external site)

> **Note:** Live demo URL and GitHub visibility are **TBD**—update the Links / CTA section before publishing.

---

## Hero

**Clarispec — AI-assisted requirements gathering and spec documents**

Turn structured discovery conversations into versioned Markdown specs (BRD, SRS, user stories, architecture, and more), with exports and a separate operator admin surface.

**Stack tags:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS · Supabase (auth + data) · Groq + Google Gemini · Recharts / Framer Motion

---

## Overview / Problem

**Problem:** Early product work often lives in scattered notes and ad hoc chats, so **scope, stakeholders, and acceptance criteria** stay fuzzy until late.

**Who it’s for:** Teams that need **repeatable requirements capture** and **shareable specification artifacts**—aligned with the app’s focus on **projects, briefs, requirement areas, and generated documents**.

**How Clarispec addresses it:** Users **sign up / sign in** with Supabase, **create projects** with an **initial brief** and **depth** (quick / standard / deep), run an **AI-guided gather chat** that tracks **requirement coverage and score**, then **select document types** and **generate** Markdown specs from the full thread. They can **view, manually edit, AI-edit with inline diff**, and **export** PDF or Markdown.

---

## Tech Stack + Architecture

- **Frontend:** Next.js **App Router** with route groups **`(auth)`**, **`(dashboard)`**, **`(admin)`**; React **19**, Tailwind, **Framer Motion**, **Lucide**, **Recharts** (dashboard charts), **react-markdown** + **remark-gfm** for document rendering.
- **Edge / routing:** Root **`proxy.ts`** records **edge `proxy`** perf events, enforces **admin cookie** gate for `/admin`, and delegates app traffic to **`updateSession`** in `lib/supabase/middleware.ts` (Supabase **`getAll` / `setAll`** cookies for chunked auth cookies).
- **API layer:** **`app/api/projects/**`**, **`app/api/ai/**`**, **`app/api/perf/events`**, **`app/api/admin/**`** — many routes wrapped with **`runTimedApiRoute`** for **server-side API latency** logging.
- **Data & auth:** **Supabase** — browser client, server client with cookies, **service role** for admin client and **perf insert**. **Admin** uses **`superadmins`** + **`admin_sessions`** and **`ADMIN_SESSION_SECRET`**-signed cookies.
- **AI:** **`lib/ai/provider.ts`** — **Groq** primary when `GROQ_API_KEY` is set, **Gemini** if not, and **Gemini on Groq 429** for shared `generateText` paths. Prompts under **`lib/ai/prompts/`** (`questioner`, `analyzer`, `system`, `editDocument`, **`documents/*`** per doc type). **Document generation** sequences selected types with a **1s delay** between calls for rate limits. **`/api/ai/edit-document`** calls **Groq only** (no Gemini fallback in that route).
- **Documents:** **`diff`** for inline diff UI; **jspdf** + **html2canvas** for PDF export.
- **Browser security headers:** **CSP**, **HSTS**, **X-Frame-Options**, **Referrer-Policy**, etc., in **`next.config.mjs`** (including **`connect-src`** for Supabase, Groq, Google Generative Language API).

---

## Features

- **Account & session:** Login/signup under **`(auth)`**; protected dashboard routes; **proxy** + session helper redirects **guests → `/login`**, **signed-in users at `/` → `/dashboard`**. Root **`/`** does not render marketing UI (`app/page.tsx` returns `null`).
- **Projects:** List, create, overview with **brief**, **requirement areas**, **progress** toward depth thresholds.
- **Gather / requirements chat:** **`/projects/[projectId]/gather`** — messages via **`/api/projects/.../messages`**, initial **brief analysis** via **`POST /api/ai/analyze`**, ongoing **question flow** via **`POST /api/ai/chat`** with **suggestions**, **category coverage**, and **completion** when the model signals done.
- **Document generation:** User selects types (BRD, SRS, user stories, architecture overview, workflow, MVP scope, feature list, timeline); **`POST /api/ai/generate`** persists **`documents`** and sets project **`status`** to **`completed`**.
- **Document workspace:** Listing and per-document pages; **AI edit bar**, **inline diff** (accept/reject hunks); **export** Markdown and **PDF**.
- **Dashboard:** Aggregated **stats**, **project cards**, **deferred** charts/widgets for client performance.
- **Admin (operator):** **`/admin/login`** and pages for **dashboard**, **users**, **projects**, **documents**, **messages**, **document selections**; APIs under **`app/api/admin/*`** guarded by admin session.

---

## Challenges & Solutions

1. **Reliable auth across SSR, API routes, and large cookies:** **Supabase SSR** with **`getAll` / `setAll`** cookie adapters avoids losing **chunked `sb-*` cookies**.
2. **AI cost and rate limits:** **Per-user, per-IP rate limits** on AI routes; **sequential document generation** with **delay** between docs; **Groq → Gemini** fallback on **`generateText`** when Groq hits **429**.
3. **Trusting model output:** **Validation** helpers, **retry** on chat parse failure, **size caps** on analyze JSON, and **prompt redaction** for common secret patterns before model calls.
4. **Safe AI edits:** **Line-based diff** UI so users **accept or reject** changes before committing.
5. **Performance visibility:** **`perf_events`** pipeline — **edge**, **server API**, **client** Web Vitals and **`fetch`** timings — with optional **Redis-backed** rate limiting and **in-memory** fallback.

---

## Performance / Security / Testing

### Performance

- **Instrumented** for **edge proxy duration**, **server route duration** (`runTimedApiRoute`), **client Web Vitals** (LCP, FCP, TTFB, INP, FID), **navigation**, and **same-origin `/api` fetch** times, batched to **`POST /api/perf/events`**. Logging: **on in development** unless `PERF_LOG=0`; production when **`PERF_LOG=1`**. Persistence needs **`SUPABASE_SERVICE_ROLE_KEY`**.
- **Documented snapshot** (`docs/perf-events-report.md`, **884 events**, ~**19 hours**): server **`api`** median ~**1.1–1.2 s**; **edge `proxy`** ~**27–32 ms** median (max ~**849 ms**); **LCP** on **`/login`** up to ~**11.4 s** (poor); ~**5.78 s** LCP on some authenticated routes in that sample. **Small n** on some routes—indicative, not SLOs.

### Security

- **Same-origin** checks on relevant routes.
- **CSP** and related headers globally.
- **Server-only secrets**; **prompt redaction** for common key/JWT patterns.
- **End-user** vs **admin** separation: Supabase session vs **signed admin cookie** + **`admin_sessions`**.
- **Rate limiting:** optional **Upstash Redis**; else **in-memory** (not distributed across instances without Redis).

### Testing

- **`npm run lint`** (ESLint) only in **`package.json`**; **no** automated test script or project test files found. Quality stance: **lint + manual validation** unless tests are added later.

---

## Deployment

- **Inferred:** Typical **Next.js on Vercel** + **Supabase**; codebase comments reference **Vercel** env alignment for Supabase (no `vercel.json` required for this claim).
- **Environment variables (names only):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `GROQ_API_KEY`, `GROQ_MODEL` (optional), `GEMINI_API_KEY`, `GEMINI_MODEL` (optional), `ADMIN_SESSION_SECRET`, `PERF_LOG` (optional), `TRUST_PROXY_HEADERS` (optional), `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` (optional).

---

## Learnings

- **Splitting discovery from artifacts**—chat state, requirement scoring, and document templates—keeps UX clear while producing **long-form specs**.
- **Provider abstraction with fallback** reduces **single-vendor 429** risk for chat and batch generation (with the caveat that **edit-document** is **Groq-only** today).
- **Unified perf telemetry** (edge + server + client) supports an **evidence-based** performance story.
- **SSR auth cookie edge cases** deserve first-class handling for production domains.

---

## Links / CTA

- **Live demo:** TBD  
- **GitHub:** TBD  
- **Case study / deep-dive:** TBD  

---

## Sources checked (for your confidence)

`package.json`, `next.config.mjs`, `tsconfig.json`, `tailwind.config.ts`, `app/layout.tsx`, `app/page.tsx`, `app/(auth)/**`, `app/(dashboard)/**`, `app/(admin)/**`, `app/api/projects/**`, `app/api/ai/**`, `app/api/perf/events/route.ts`, `app/api/admin/**`, `proxy.ts`, `lib/supabase/*`, `lib/ai/*` (including `prompts/`), `lib/documents/*`, `lib/perf-log/*`, `lib/security.ts`, `lib/validation.ts`, `lib/admin.ts`, `lib/server-config.ts`, `components/gather/*`, `components/documents/*`, `components/dashboard/*`, `components/admin/*`, `components/auth/*`, `components/perf/ClientPerfRoot.tsx`, `types/index.ts`, `docs/perf-events-report.md`, `docs/ai-provider-strategy-and-fallback.md`, `instrumentation.ts`

---

## Screenshot suggestions

1. **`/projects/[id]/gather`** — question card, suggestions, progress/score, message thread.  
2. **Document viewer** — Markdown + AI edit bar or inline diff after an edit.  
3. **`/dashboard`** — stats, project cards, charts; or **`/admin/dashboard`** for operator analytics.
