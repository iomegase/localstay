# Admin Analytics Intraday Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `GA4 aujourd'hui` admin block, keep `Live Vercel` separate, and preserve delayed `GSC` SEO reporting.

**Architecture:** Historical KPIs remain backed by Prisma daily snapshots. Intraday GA4 is read directly from the GA4 Data API at request time, while the Vercel live block is routed through a dedicated server-side service boundary that returns supported live data when available and degrades cleanly otherwise.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma, Zod, Jest, Google Analytics Data API

---

### Task 1: Add the GA4 Today server contract

**Files:**
- Modify: `src/features/admin-analytics/types.ts`
- Modify: `src/features/admin-analytics/queries/dashboard.ts`
- Create: `src/app/api/admin/analytics/ga4-today/route.ts`
- Test: `tests/contract/admin-analytics.api.test.ts`
- Test: `tests/unit/admin-analytics.dashboard-queries.test.ts`

- [ ] **Step 1: Write the failing contract and query tests**

```ts
expect(mockGetGa4Today).toHaveBeenCalled()
await expect(ga4TodayRes.json()).resolves.toEqual({
  status: 'connected',
  window_label: "Aujourd'hui",
  sessions: 42,
  users: 31,
  page_views: 88,
  engagement_rate: 0.61,
})
```

- [ ] **Step 2: Run tests to verify failure**

Run: `npm test -- tests/contract/admin-analytics.api.test.ts tests/unit/admin-analytics.dashboard-queries.test.ts --runInBand`
Expected: FAIL because `getAdminAnalyticsGa4TodayBlock` and the route do not exist.

- [ ] **Step 3: Add the new block type and query export**

```ts
export type AdminAnalyticsGa4TodayBlock = {
  status: AnalyticsBlockStatus
  window_label: string | null
  sessions: number | null
  users: number | null
  page_views: number | null
  engagement_rate: number | null
}
```

- [ ] **Step 4: Add the route**

```ts
export async function GET(): Promise<NextResponse> {
  const session = await getSessionAdmin()
  if (session.error) return session.error

  const data = await getAdminAnalyticsGa4TodayBlock()
  return NextResponse.json(data)
}
```

- [ ] **Step 5: Re-run tests**

Run: `npm test -- tests/contract/admin-analytics.api.test.ts tests/unit/admin-analytics.dashboard-queries.test.ts --runInBand`
Expected: PASS for the new route/query wiring assertions.

### Task 2: Implement GA4 today direct-read service

**Files:**
- Modify: `src/features/admin-analytics/services/google-analytics.ts`
- Test: `tests/unit/admin-analytics.ga4-today.test.ts`
- Test: `tests/unit/admin-analytics.dashboard-queries.test.ts`

- [ ] **Step 1: Write the failing GA4 today service test**

```ts
expect(result).toEqual({
  window_label: "Aujourd'hui",
  sessions: 42,
  users: 35,
  page_views: 88,
  engagement_rate: 0.64,
})
```

- [ ] **Step 2: Run the service test to verify failure**

Run: `npm test -- tests/unit/admin-analytics.ga4-today.test.ts --runInBand`
Expected: FAIL because the today fetcher is missing.

- [ ] **Step 3: Implement the minimal GA4 today fetcher**

```ts
export async function fetchGoogleAnalyticsTodayMetrics(): Promise<{
  window_label: string
  sessions: number
  users: number
  page_views: number
  engagement_rate: number | null
} | null> {
  const range = { startDate: 'today', endDate: 'today' }
  const rows = await runGa4Report({
    accessToken,
    propertyId,
    startDate: range.startDate,
    endDate: range.endDate,
    dimensions: [],
    metrics: ['sessions', 'totalUsers', 'screenPageViews', 'engagementRate'],
  })
}
```

- [ ] **Step 4: Map the service into a dashboard block**

```ts
export async function getAdminAnalyticsGa4TodayBlock(): Promise<AdminAnalyticsGa4TodayBlock> {
  try {
    const metrics = await fetchGoogleAnalyticsTodayMetrics()
    if (!metrics) return { status: 'no_data', window_label: "Aujourd'hui", sessions: null, users: null, page_views: null, engagement_rate: null }
    return { status: 'connected', ...metrics }
  } catch (error) {
    return mapGa4TodayError(error)
  }
}
```

- [ ] **Step 5: Re-run unit tests**

Run: `npm test -- tests/unit/admin-analytics.ga4-today.test.ts tests/unit/admin-analytics.dashboard-queries.test.ts --runInBand`
Expected: PASS

### Task 3: Refactor the Vercel live block behind a real service boundary

**Files:**
- Create: `src/features/admin-analytics/services/vercel-live.ts`
- Modify: `src/features/admin-analytics/queries/dashboard.ts`
- Test: `tests/unit/admin-analytics.dashboard-queries.test.ts`

- [ ] **Step 1: Write the failing live-block test**

```ts
expect(live).toEqual({
  status: 'not_configured',
  window_label: null,
  visitors: null,
  page_views: null,
  top_pages: [],
  top_referrers: [],
})
```

- [ ] **Step 2: Run the query test to verify failure**

Run: `npm test -- tests/unit/admin-analytics.dashboard-queries.test.ts --runInBand`
Expected: FAIL once the test expects delegation to a dedicated live service.

- [ ] **Step 3: Implement a Vercel live service with supported-path fallback**

```ts
export async function fetchVercelLiveMetrics(): Promise<AdminAnalyticsLiveBlock> {
  const endpoint = process.env.VERCEL_ANALYTICS_LIVE_ENDPOINT
  if (!endpoint) return emptyLive('not_configured')

  const response = await fetch(endpoint, { headers: buildAuthHeaders() })
  if (!response.ok) return emptyLive('failed')
  return normalizeVercelLivePayload(await response.json())
}
```

- [ ] **Step 4: Wire the dashboard query to that service**

```ts
export async function getAdminAnalyticsLiveBlock(): Promise<AdminAnalyticsLiveBlock> {
  return fetchVercelLiveMetrics()
}
```

- [ ] **Step 5: Re-run the live query test**

Run: `npm test -- tests/unit/admin-analytics.dashboard-queries.test.ts --runInBand`
Expected: PASS with clean degraded behavior when no supported endpoint is configured.

### Task 4: Render the new GA4 today block in admin

**Files:**
- Modify: `src/app/admin/analytics/page.tsx`
- Test: `tests/integration/admin-analytics.page.test.tsx`

- [ ] **Step 1: Write the failing page integration test**

```tsx
expect(screen.getByText("GA4 aujourd'hui")).toBeInTheDocument()
expect(screen.getByText('42')).toBeInTheDocument()
```

- [ ] **Step 2: Run the page test to verify failure**

Run: `npm test -- tests/integration/admin-analytics.page.test.tsx --runInBand`
Expected: FAIL because the new block is not rendered.

- [ ] **Step 3: Render the block**

```tsx
<section className="rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm">
  <div className="mb-4 flex items-center justify-between">
    <h2 className="text-lg font-bold text-neutral-900">GA4 aujourd&apos;hui</h2>
    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
      {STATUS_LABELS[ga4Today.status]}
    </span>
  </div>
  <Ga4TodayBlock block={ga4Today} />
</section>
```

- [ ] **Step 4: Re-run the page test**

Run: `npm test -- tests/integration/admin-analytics.page.test.tsx --runInBand`
Expected: PASS

### Task 5: Full verification and traceability

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Update traceability**

```md
| AC-02-06/AC-05-06 | Bloc `GA4 aujourd'hui` séparé + live Vercel distinct | `src/app/api/admin/analytics/ga4-today/route.ts`<br>`src/features/admin-analytics/services/google-analytics.ts`<br>`src/features/admin-analytics/services/vercel-live.ts`<br>`src/features/admin-analytics/queries/dashboard.ts`<br>`src/app/admin/analytics/page.tsx` | `tests/unit/admin-analytics.ga4-today.test.ts`<br>`tests/unit/admin-analytics.dashboard-queries.test.ts`<br>`tests/contract/admin-analytics.api.test.ts`<br>`tests/integration/admin-analytics.page.test.tsx` | ✅ done |
```

- [ ] **Step 2: Run the focused test suite**

Run: `npm test -- tests/unit/admin-analytics.ga4-today.test.ts tests/unit/admin-analytics.dashboard-queries.test.ts tests/contract/admin-analytics.api.test.ts tests/integration/admin-analytics.page.test.tsx --runInBand`
Expected: PASS

- [ ] **Step 3: Run the production build**

Run: `npm run build`
Expected: successful Next.js production build

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/analytics/ga4-today/route.ts src/app/admin/analytics/page.tsx src/features/admin-analytics/types.ts src/features/admin-analytics/queries/dashboard.ts src/features/admin-analytics/services/google-analytics.ts src/features/admin-analytics/services/vercel-live.ts tests/unit/admin-analytics.ga4-today.test.ts tests/unit/admin-analytics.dashboard-queries.test.ts tests/contract/admin-analytics.api.test.ts tests/integration/admin-analytics.page.test.tsx docs/traceability-matrix.md
git commit -m "feat: add intraday admin analytics blocks"
```
