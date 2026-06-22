# Admin Analytics Vercel Live Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a first-party Vercel live analytics pipeline so `/admin/analytics` can show recent traffic for `mystay.city` through a supported server-side path.

**Architecture:** Vercel Web Analytics Drains post recent events into a protected internal ingestion route. StayLocal stores these events in a dedicated append-only Prisma model, then exposes a protected internal aggregation route that the existing admin live adapter can call via `VERCEL_ANALYTICS_LIVE_ENDPOINT`.

**Tech Stack:** Next.js 16 App Router, TypeScript, Prisma, Zod, Jest, Vercel Web Analytics Drains

---

### Task 1: Add route contracts and failing tests

**Files:**
- Create: `tests/contract/admin-analytics.vercel-drain-api.test.ts`
- Create: `tests/contract/admin-analytics.vercel-live-api.test.ts`
- Create: `tests/unit/admin-analytics.vercel-drain.test.ts`
- Create: `tests/unit/admin-analytics.vercel-live-aggregate.test.ts`

- [ ] **Step 1: Write the failing drain contract test**

```ts
expect(res.status).toBe(200)
await expect(res.json()).resolves.toEqual({ status: 'ok', ingested: 1 })
expect(mockIngestVercelDrainPayload).toHaveBeenCalledWith([
  expect.objectContaining({ eventType: 'pageview', path: '/guide/annecy' }),
])
```

- [ ] **Step 2: Write the failing live contract test**

```ts
expect(res.status).toBe(200)
await expect(res.json()).resolves.toEqual({
  status: 'connected',
  window_label: 'Last 30 minutes',
  visitors: 2,
  page_views: 3,
  top_pages: [{ page_path: '/guide/annecy', page_views: 2 }],
  top_referrers: [{ referrer: 'google.com', visitors: 1 }],
})
```

- [ ] **Step 3: Write the failing drain unit test**

```ts
expect(mockUpsertLiveEvent).toHaveBeenCalledWith(expect.objectContaining({
  where: { dedupe_key: expect.any(String) },
}))
```

- [ ] **Step 4: Write the failing live aggregation unit test**

```ts
expect(result).toEqual({
  status: 'connected',
  window_label: 'Last 30 minutes',
  visitors: 2,
  page_views: 3,
  top_pages: [{ page_path: '/guide/annecy', page_views: 2 }],
  top_referrers: [{ referrer: 'google.com', visitors: 1 }],
})
```

- [ ] **Step 5: Run tests to verify failure**

Run: `npm test -- tests/contract/admin-analytics.vercel-drain-api.test.ts tests/contract/admin-analytics.vercel-live-api.test.ts tests/unit/admin-analytics.vercel-drain.test.ts tests/unit/admin-analytics.vercel-live-aggregate.test.ts --runInBand`
Expected: FAIL because the routes and services do not exist yet.

### Task 2: Add Prisma model and analytics schemas

**Files:**
- Modify: `prisma/schema.prisma`
- Modify: `src/features/admin-analytics/schemas.ts`

- [ ] **Step 1: Add the Prisma model**

```prisma
model AnalyticsVercelLiveEvent {
  id                String   @id @default(uuid())
  created_at        DateTime @default(now())
  updated_at        DateTime @updatedAt
  deleted_at        DateTime?

  dedupe_key        String   @unique
  schema_name       String
  source_event_type String
  event_name        String?
  occurred_at       DateTime
  project_id        String
  owner_id          String?
  session_id        String?
  device_id         String?
  origin            String?
  page_path         String?
  referrer          String?
  payload_json      Json?

  @@index([occurred_at])
  @@index([source_event_type, occurred_at])
  @@index([page_path, occurred_at])
}
```

- [ ] **Step 2: Add drain payload schemas**

```ts
export const vercelAnalyticsDrainEventSchema = z.object({
  schema: z.string().min(1),
  eventType: z.string().min(1),
  eventName: z.string().min(1).optional().nullable(),
  eventData: z.unknown().optional().nullable(),
  timestamp: z.coerce.number().int().nonnegative(),
  projectId: z.string().min(1),
  ownerId: z.string().optional().nullable(),
  sessionId: z.union([z.string(), z.number().int()]).optional().nullable(),
  deviceId: z.union([z.string(), z.number().int()]).optional().nullable(),
  origin: z.string().optional().nullable(),
  path: z.string().optional().nullable(),
  referrer: z.string().optional().nullable(),
})
```

- [ ] **Step 3: Add array and auth schemas**

```ts
export const vercelAnalyticsDrainPayloadSchema = z.union([
  vercelAnalyticsDrainEventSchema,
  z.array(vercelAnalyticsDrainEventSchema),
])
```

- [ ] **Step 4: Regenerate Prisma client**

Run: `npx prisma generate`
Expected: PASS and Prisma client regenerated with `analyticsVercelLiveEvent`.

### Task 3: Implement ingestion service and drain route

**Files:**
- Create: `src/features/admin-analytics/services/vercel-drain.ts`
- Create: `src/app/api/internal/analytics/vercel-drain/route.ts`

- [ ] **Step 1: Implement normalized ingestion input**

```ts
type VercelDrainEvent = z.infer<typeof vercelAnalyticsDrainEventSchema>
```

- [ ] **Step 2: Implement deterministic dedupe key**

```ts
function buildDedupeKey(event: VercelDrainEvent): string {
  return createHash('sha256')
    .update(JSON.stringify({
      schema: event.schema,
      eventType: event.eventType,
      eventName: event.eventName ?? null,
      timestamp: event.timestamp,
      projectId: event.projectId,
      ownerId: event.ownerId ?? null,
      sessionId: event.sessionId ?? null,
      deviceId: event.deviceId ?? null,
      origin: event.origin ?? null,
      path: event.path ?? null,
      referrer: event.referrer ?? null,
      eventData: event.eventData ?? null,
    }))
    .digest('hex')
}
```

- [ ] **Step 3: Implement idempotent persistence and retention**

```ts
await prisma.analyticsVercelLiveEvent.upsert({
  where: { dedupe_key },
  create: { ...normalized },
  update: { deleted_at: null },
})
```

- [ ] **Step 4: Implement the protected drain route**

```ts
const token = new URL(request.url).searchParams.get('token')
if (token !== process.env.VERCEL_ANALYTICS_DRAIN_SECRET) {
  return apiError('UNAUTHORIZED', 'Unauthorized', 401)
}
```

- [ ] **Step 5: Re-run drain tests**

Run: `npm test -- tests/contract/admin-analytics.vercel-drain-api.test.ts tests/unit/admin-analytics.vercel-drain.test.ts --runInBand`
Expected: PASS

### Task 4: Implement live aggregation service and internal live route

**Files:**
- Create: `src/features/admin-analytics/services/vercel-live-aggregate.ts`
- Create: `src/app/api/internal/analytics/vercel-live/route.ts`

- [ ] **Step 1: Implement the last-30-minutes reader**

```ts
const threshold = new Date(Date.now() - 30 * 60 * 1000)
const rows = await prisma.analyticsVercelLiveEvent.findMany({
  where: {
    deleted_at: null,
    occurred_at: { gte: threshold },
    source_event_type: 'pageview',
  },
})
```

- [ ] **Step 2: Implement aggregation rules**

```ts
const visitorKey = row.session_id ?? row.device_id ?? row.dedupe_key
```

- [ ] **Step 3: Implement the protected internal route**

```ts
const header = request.headers.get('authorization') ?? ''
if (header !== `Bearer ${process.env.VERCEL_ANALYTICS_LIVE_TOKEN}`) {
  return apiError('UNAUTHORIZED', 'Unauthorized', 401)
}
```

- [ ] **Step 4: Return the existing live block shape**

```ts
return NextResponse.json(await getInternalVercelLiveBlock())
```

- [ ] **Step 5: Re-run live tests**

Run: `npm test -- tests/contract/admin-analytics.vercel-live-api.test.ts tests/unit/admin-analytics.vercel-live-aggregate.test.ts tests/unit/admin-analytics.vercel-live.test.ts --runInBand`
Expected: PASS

### Task 5: Wire environment docs, traceability, and verification

**Files:**
- Modify: `.env.example`
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Add the new env vars**

```env
VERCEL_ANALYTICS_DRAIN_SECRET=change-me
VERCEL_ANALYTICS_LIVE_ENDPOINT=https://mystay.city/api/internal/analytics/vercel-live
VERCEL_ANALYTICS_LIVE_TOKEN=change-me
```

- [ ] **Step 2: Update traceability for AC-05-05/06/07**

```md
| AC-05-05/AC-05-06/AC-05-07 | Bloc `live` Vercel + ingestion drain + agrégation interne | ... | ... | ✅ done |
```

- [ ] **Step 3: Run the focused suite**

Run: `npm test -- tests/contract/admin-analytics.vercel-drain-api.test.ts tests/contract/admin-analytics.vercel-live-api.test.ts tests/unit/admin-analytics.vercel-drain.test.ts tests/unit/admin-analytics.vercel-live-aggregate.test.ts tests/unit/admin-analytics.vercel-live.test.ts tests/unit/admin-analytics.dashboard-queries.test.ts tests/contract/admin-analytics.api.test.ts tests/integration/admin-analytics.page.test.tsx --runInBand`
Expected: PASS

- [ ] **Step 4: Run the production build**

Run: `npm run build`
Expected: PASS
