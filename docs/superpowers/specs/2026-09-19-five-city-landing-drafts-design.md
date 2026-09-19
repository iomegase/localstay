# Five-city local landing drafts

## Objective

Create complete draft content for the three local SEO intentions of five existing cities:

- Saint-Gervais-les-Bains
- Saint-Nicolas-de-Véroce
- Megève
- Combloux
- Les Contamines-Montjoie

Each city receives a Conciergerie, Séminaires, and Locations de vacances page. All five destinations remain inactive after the operation, so none of the fifteen pages is published, indexed, or added to the sitemap.

## Editorial approach

The four reviewed legacy catalogues for Saint-Gervais-les-Bains, Saint-Nicolas-de-Véroce, Megève, and Combloux are the source for their existing editorial material. The content is adapted to the current `LocalLandingPage` schema without rewriting already reviewed claims.

Les Contamines-Montjoie receives bespoke copy in the same MyStay voice. Local claims must be limited to stable facts supported by official municipal or tourism sources. The copy must not invent accommodation inventory, prices, availability, capacity, partnerships, service coverage, or operational guarantees.

Across all cities, the pages share a coherent structure but avoid replacing local paragraphs with simple city-name substitutions. Each page must contain:

- SEO title and meta description;
- eyebrow, H1, hero title, hero copy, and optional reassurance;
- primary editorial section;
- locally specific section;
- CTA label and safe internal or `mailto:` target;
- highlights, steps, and FAQ for Conciergerie and Séminaires;
- an honest empty-state message for Locations de vacances.

## Content rules by intent

### Conciergerie

Describe MyStay's real service model: traveller coordination, arrival information, turnover preparation, cleaning and linen coordination, property follow-up, and the MyStay traveller guide. Local copy may discuss access patterns and geography, but must not promise permanent coverage at every address.

CTA: `/confier-mon-logement`.

### Séminaires

Describe a tailored coordination service based on the client brief and the actual availability of accommodation, meeting spaces, meals, transfers, and activities. Avoid claiming ownership of venues or guaranteed partner availability.

CTA: `mailto:bonjour@mystay.city?subject=Organisation%20d%27un%20s%C3%A9minaire%20MyStay`.

### Locations de vacances

Describe only properties actually published by MyStay at runtime. The draft content introduces the destination and provides a truthful empty state; it does not create fictional listings or availability claims.

CTA: `/decouvrir`.

## Persistence and publication

The existing PostgreSQL models remain the source of truth. The operation uses one transaction and targets cities by their stable slugs.

For each city:

1. Resolve the active, non-deleted `City`.
2. Reuse the current non-deleted `LocalLandingDestination` when present, or create it when absent.
3. Force `LocalLandingDestination.is_active = false`.
4. Upsert exactly one non-deleted page for each of the three intents.
5. Preserve the City, Lodging, POI, Blog, review, and guide records.

No public route, sitemap entry, canonical, or publication status is activated by this operation.

## Validation and failure handling

All fifteen page payloads are validated with `landingPageInputSchema` before the database transaction begins. The write is aborted if:

- one of the five city slugs is missing or inactive;
- a destination cannot be resolved safely;
- any required field is empty or contains a placeholder;
- a repeatable block exceeds the schema limits;
- a CTA is neither an internal path nor an accepted `mailto:` target;
- the final set does not contain exactly five destinations and fifteen pages.

The transaction prevents partial installation. Existing content is updated only for the five named destinations.

## Verification

After writing, a read-only verification must confirm:

- five non-deleted landing destinations exist for the requested city slugs;
- all five destinations are inactive;
- every destination has exactly the three required intents;
- all fifteen payloads pass the publication content schema;
- the publication resolver reports Conciergerie, Séminaires, and Locations de vacances as unpublished;
- no page appears in the generated local landing sitemap paths.

No deployment or Git push is part of this work.
