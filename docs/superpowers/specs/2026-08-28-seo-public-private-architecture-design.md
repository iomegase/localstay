# SEO public/private architecture design

Date: 2026-08-28
Status: validated
Owner: Product Owner

## Goal

Separate MyStay's public SEO surfaces from the private lodging guide without
breaking printed QR codes or already indexed URLs.

## Decisions

### Canonical route families

```text
PUBLIC / INDEXABLE
/
/logements
/logements/[slug]
/decouvrir
/decouvrir/[ville]
/decouvrir/[ville]/[categorie]
/decouvrir/[ville]/[categorie]/[poi]
/blog/*
/concept
/seminaires
/confier-mon-logement

PRIVATE / NON INDEXABLE
/sejour/*
/guide/* when used by an active stay
/acces-reserve
/le-logement
/nos-recommandations
/map
/mes-favoris
/contact
/services-prives
```

`/guide` is no longer a public SEO namespace. Anonymous historical public URLs
redirect permanently to `/decouvrir` or `/logements` when an eligible public
equivalent exists. Private compatibility routes remain available only as long
as the stay flow requires them.

### Routing priority

1. Validate `?lodging=<UUID>` QR entry.
2. Set or refresh the stay cookie and route to `/sejour`.
3. Resolve public lodging redirects.
4. Resolve public discovery redirects.
5. Route a City-only historical QR to its public `/decouvrir` destination or
   to the discovery hub when the City has no eligible public page.
6. Apply private compatibility and access control.
7. Return 404 when no public equivalent exists.

The QR branch always wins over SEO migration logic.

### Public lodging URLs

Public profiles use `/logements/[slug]`. Slugs become globally unique after a
read-only collision audit. Existing published slugs are never renamed
automatically. Any collision requires Product Owner resolution before the
database constraint is changed.

### Indexing contract

Private surfaces emit `noindex`, `nofollow`, and `noarchive`. They remain
crawlable so crawlers can read the directive; `robots.txt` is not used as the
only protection. The sitemap contains no private route, UUID, token, or query
string. `/contact` remains private in this project increment.

### Metadata and structured data

The homepage is positioned as a Haute-Savoie concierge service. Every public
page owns its canonical. Organization uses the stable ID
`https://www.mystay.city/#organization`. Lodging schemas use the short public
URL and reference that organization. Discovery POIs use a deterministic
taxonomy-to-Schema.org mapping with `LocalBusiness` as the safe fallback.

### Content quality

Technical migration and content remediation are separated:

- spec 042 governs routing, indexing, sitemap, metadata, schema, accessibility,
  fonts, redirects, and QR compatibility;
- spec 043 governs read-only POI/lodging content audits and removal of manifest
  public placeholders.

The content audit never mass-edits records, invents copy, or resolves lodging
data contradictions automatically.

### Verification

Implementation must cover routing helpers, QR priority, private metadata,
legacy redirects, canonical URLs, sitemap exclusions, JSON-LD, slug
collisions, viewport accessibility, font loading, and complete regression
verification through lint, Jest, Next.js build, and Playwright.

## Source specifications

- `specs/features/042-seo-public-private-architecture/spec.md`
- `specs/features/043-seo-content-quality/spec.md`
