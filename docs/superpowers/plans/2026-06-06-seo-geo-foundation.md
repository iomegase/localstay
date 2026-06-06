# SEO & GEO Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans or subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Make StayLocal discoverable and citable — give every public page real metadata, a sitemap, robots rules, structured data (Schema.org), and clean canonicals, so cities/POIs/trails rank in classic search AND get surfaced by generative engines (ChatGPT/Perplexity/Google AI).

**Architecture:** SEO logic lives in a dedicated `src/features/seo` feature as **pure, unit-tested builders** (metadata objects, JSON-LD objects, sitemap entries). Next.js file conventions (`robots.ts`, `sitemap.ts`, `generateMetadata`) and a shared `<JsonLd>` server component are thin glue that call those builders. Pages stay server-rendered (already the case) so content + metadata + JSON-LD ship in the initial HTML.

**Tech Stack:** Next 16 App Router (`MetadataRoute`, `Metadata`, `generateMetadata`), Prisma, Jest. Base URL from `NEXT_PUBLIC_BASE_URL`.

**Standing constraints:** TDD (red→green). **User commits code** — leave diffs staged, do NOT `git commit` source. THIS plan file is committed immediately (project convention). Quote the trailing-space path. Verify: `npx tsc --noEmit 2>&1 | grep -v "tests/" | grep "error TS"` and `npx jest <pattern>`.

---

## Audit summary (current state)
- Only ONE `metadata` export (root [layout.tsx](src/app/layout.tsx)); no `generateMetadata` anywhere → every page shares the same title.
- No `sitemap.ts`, no `robots.ts`, no `metadataBase`, no Open Graph, no JSON-LD.
- City guide page has no `<h1>` (hardcoded `<h2>Le guide`, city name commented out).
- Query-param URLs (`?lodging=`, `?sort=`) create duplicate-content variants with no canonical.
- Pages ARE server-rendered (good baseline) — POI/city/trail content is in the HTML.

## File structure
**New (feature, pure + tested):**
- `src/features/seo/lib/site.ts` — `SITE` constants (name, base url helper, default description, locale).
- `src/features/seo/lib/metadata.ts` — `poiMetadata`, `cityMetadata`, `categoryMetadata` → `Metadata`.
- `src/features/seo/lib/structured-data.ts` — `organizationSchema`, `websiteSchema`, `breadcrumbSchema`, `localBusinessSchema`, `touristAttractionSchema`.
- `src/features/seo/lib/sitemap.ts` — pure `buildSitemapEntries(input)`.
- `src/features/seo/queries/sitemap-data.ts` — Prisma fetch for sitemap.
- `src/shared/components/JsonLd.tsx` — renders one `<script type="application/ld+json">`.

**New (Next conventions / glue):**
- `src/app/robots.ts`, `src/app/sitemap.ts`, `src/app/manifest.ts`.

**Modified:**
- `src/app/layout.tsx` — `metadataBase`, `title.template`, default OG/Twitter, Organization+WebSite JSON-LD.
- `src/features/categories/queries/poi-detail.ts` — add `city {name, slug, region, postal_code}` to selection + `PoiDetail.city`.
- POI / city / category / trail-start `page.tsx` — `generateMetadata` + `<JsonLd>` + breadcrumb.
- `src/app/(public)/guide/[city-slug]/page.tsx` — real `<h1>{city.name}`.

**Tests:** `tests/unit/seo.metadata.test.ts`, `seo.structured-data.test.ts`, `seo.sitemap.test.ts`, `seo.robots.test.ts`.

---

## LOT 1 — robots + sitemap

### Task 1.1 robots.ts
- [ ] **RED** `tests/unit/seo.robots.test.ts`: default export returns rules allowing `/`, disallowing `/admin`,`/dashboard`,`/api`,`/merchant`, and `sitemap` ending `/sitemap.xml`.
- [ ] **GREEN** `src/app/robots.ts`:
```ts
import type { MetadataRoute } from 'next'
import { siteBaseUrl } from '@/features/seo/lib/site'
export default function robots(): MetadataRoute.Robots {
  const base = siteBaseUrl()
  return {
    rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/dashboard', '/api', '/merchant'] }],
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
```
- [ ] Stage for commit.

### Task 1.2 site constants
- [ ] `src/features/seo/lib/site.ts`: `SITE = { name: 'StayLocal', locale: 'fr_FR', defaultTitle, defaultDescription }`, `siteBaseUrl()` = `(NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000').replace(/\/+$/, '')`.

### Task 1.3 pure sitemap builder
- [ ] **RED** `tests/unit/seo.sitemap.test.ts`: `buildSitemapEntries({ baseUrl, cities, pois, staticPaths })` returns entries for `/`, each static path, `/guide/{city}`, each `/guide/{city}/{cat}/{poi}`, and distinct `/guide/{city}/{cat}` derived from pois; `lastModified` from `updated_at`.
- [ ] **GREEN** `src/features/seo/lib/sitemap.ts`:
```ts
import type { MetadataRoute } from 'next'
type City = { slug: string; updated_at: Date }
type Poi = { slug: string; updated_at: Date; city_slug: string; category_slug: string }
export function buildSitemapEntries(input: {
  baseUrl: string; cities: City[]; pois: Poi[]; staticPaths: string[]
}): MetadataRoute.Sitemap {
  const { baseUrl, cities, pois, staticPaths } = input
  const url = (p: string) => `${baseUrl}${p}`
  const entries: MetadataRoute.Sitemap = []
  entries.push({ url: url('/'), changeFrequency: 'daily', priority: 1 })
  for (const p of staticPaths) entries.push({ url: url(p), changeFrequency: 'monthly', priority: 0.5 })
  for (const c of cities) entries.push({ url: url(`/guide/${c.slug}`), lastModified: c.updated_at, changeFrequency: 'daily', priority: 0.9 })
  const seenCat = new Set<string>()
  for (const poi of pois) {
    const catPath = `/guide/${poi.city_slug}/${poi.category_slug}`
    if (!seenCat.has(catPath)) { seenCat.add(catPath); entries.push({ url: url(catPath), changeFrequency: 'weekly', priority: 0.7 }) }
    entries.push({ url: url(`/guide/${poi.city_slug}/${poi.category_slug}/${poi.slug}`), lastModified: poi.updated_at, changeFrequency: 'weekly', priority: 0.6 })
  }
  return entries
}
```
- [ ] Stage for commit.

### Task 1.4 sitemap data + route
- [ ] `src/features/seo/queries/sitemap-data.ts`: `getSitemapData()` → `{ cities, pois }` from Prisma (active, `deleted_at: null`; pois join city.slug + category.slug, `category.is_active`, `city.is_active`).
- [ ] `src/app/sitemap.ts`: `export default async function sitemap() { const d = await getSitemapData(); return buildSitemapEntries({ baseUrl: siteBaseUrl(), staticPaths: ['/contact'], ...d }) }`.
- [ ] tsc + stage.

---

## LOT 2 — metadataBase + per-page metadata

### Task 2.1 root metadataBase + template
- [ ] In [layout.tsx](src/app/layout.tsx) metadata: add `metadataBase: new URL(siteBaseUrl())`, `title: { default: SITE.defaultTitle, template: '%s | StayLocal' }`, `description`, `openGraph` (type website, locale fr_FR, siteName), `twitter: { card: 'summary_large_image' }`, `alternates: { canonical: '/' }`.

### Task 2.2 pure metadata builders
- [ ] **RED** `tests/unit/seo.metadata.test.ts`:
  - `poiMetadata({ poi, citySlug, categorySlug })` → `title` contains poi.name + city; `description` from poi.description (truncated ~155) else fallback; `alternates.canonical === /guide/{city}/{cat}/{poi}`; `openGraph.images` = first photo when present.
  - `cityMetadata({ city })` → title contains city.name (+ region); canonical `/guide/{slug}`.
  - `categoryMetadata({ city, category, citySlug })` → title contains category + city; canonical `/guide/{city}/{cat}`.
- [ ] **GREEN** `src/features/seo/lib/metadata.ts` (pure; truncate helper; no Prisma).
- [ ] Stage.

### Task 2.3 extend getPoiDetail with city
- [ ] Add `city: { select: { name: true, slug: true, region: true, postal_code: true } }` to [poi-detail.ts](src/features/categories/queries/poi-detail.ts) select + return `city`; extend `PoiDetail` type. (Reused by metadata + JSON-LD.)

### Task 2.4 wire generateMetadata
- [ ] POI page, city page, category page, trail-start page: `export async function generateMetadata({ params })` fetching the same query and returning the builder output. 404 → `{ title: 'Page introuvable' }`.
- [ ] tsc + stage.

---

## LOT 3 — JSON-LD structured data

### Task 3.1 JsonLd component
- [ ] `src/shared/components/JsonLd.tsx`: `({ data }: { data: object | object[] }) => <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />`.

### Task 3.2 pure schema builders
- [ ] **RED** `tests/unit/seo.structured-data.test.ts`:
  - `organizationSchema()` → `@type Organization`, name, url.
  - `websiteSchema()` → `@type WebSite` + `potentialAction` SearchAction.
  - `breadcrumbSchema(items)` → `@type BreadcrumbList`, ordered `ListItem` with position+item.
  - `localBusinessSchema(poi)` → `@type LocalBusiness`, name, address(`PostalAddress` with addressLocality=city, postalCode, addressRegion), geo(`GeoCoordinates`), telephone, url, `openingHoursSpecification` from hours, `aggregateRating` when rating present.
  - `touristAttractionSchema(poi)` → `@type TouristAttraction`/`Place` for rando (name, geo, description).
- [ ] **GREEN** `src/features/seo/lib/structured-data.ts` (pure builders; map hours `{0..6}` → `dayOfWeek` URIs).
- [ ] Stage.

### Task 3.3 inject
- [ ] layout: `<JsonLd data={[organizationSchema(), websiteSchema()]} />`.
- [ ] POI page: `<JsonLd data={[localBusinessSchema(poi) | touristAttractionSchema(poi), breadcrumbSchema(...)]} />`.
- [ ] city/category pages: breadcrumb JSON-LD.
- [ ] tsc + stage.

---

## LOT 4 — h1 + canonical hardening
- [ ] City page: replace hardcoded `<h2>Le guide` with `<h1 className="…">{city.name}</h1>` (keep subtitle). Update/adjust [city-guide integration test](tests/integration/city-guide.AC-01-03.guide-page-renders-categories.test.tsx) if it asserts the old heading.
- [ ] Canonical: handled by `generateMetadata` (Lot 2) returning a param-free `alternates.canonical`, so `?lodging=`/`?sort=` variants point to the clean URL.
- [ ] tsc + full jest.

---

## Backlog (P1 / GEO — separate follow-up)
- [x] **DONE (2026-06-06)** `opengraph-image.tsx` via `ImageResponse` — pure tested model `og-image.ts` (`ogCard`, truncation/fallbacks, 7 tests) + shared renderer `og-card-image.tsx` + root brand card (`src/app/opengraph-image.tsx`) + per-city card (`src/app/(public)/guide/[city-slug]/opengraph-image.tsx`, « Le guide de {ville} »). Verified live: PNG 1200×630, accents OK.
- [x] **DONE (2026-06-06)** Migrate hero `<img>` → `next/image` for LCP — POI detail hero (`priority` → preload `<link>` verified live; also fixed `objobject-center` className bug), PoiCard header (lazy, fill), lodging cover hero (homepage, `priority`). All `unoptimized` for arbitrary external photo domains (user decision: no open image proxy). New test `poi-detail.hero-image.test.tsx`; existing card/home tests stay green.
- `next/font` instead of blocking Google Fonts `<link>`.
- `FAQPage` JSON-LD per city/category; `public/llms.txt`.
- Brand-name consistency (pick "StayLocal", purge "MyStay").
- hreflang if multi-region later.

## Self-review
- Coverage: robots(1.1), sitemap(1.3-1.4), metadata(2.x), JSON-LD(3.x), h1+canonical(4) → maps to audit P0/P1#6-7. ✔
- No placeholders: builders have full code. ✔
- Type consistency: `siteBaseUrl()` shared; `PoiDetail.city` added in 2.3 is consumed by 2.2 metadata + 3.2 schema. ✔
