# Local SEO City Cluster — Design

**Date:** 2026-09-07  
**Status:** Approved by the Product Owner  
**Feature:** `046-local-seo-city-cluster`

## Objective

Create a factual, mobile-first local acquisition cluster for three distinct search
intents: owners looking for a local concierge, companies looking for a seminar,
and travelers looking for a vacation rental that may link to Airbnb.

## Chosen approach

Use three explicit namespaces rather than one overloaded destination page:

- `/conciergerie/[city-slug]`
- `/seminaires/[city-slug]`
- `/locations-vacances/[city-slug]`

Saint-Gervais-les-Bains and Saint-Nicolas-de-Véroce are the only service areas
published in the first release. Megève and Combloux remain present in the typed
destination catalogue but their concierge and seminar routes return 404 until a
future Product Owner decision activates them.

Vacation-rental pages use real `LodgingPublicProfile` data. A known destination
without published inventory renders a useful 200 page with `noindex, follow`; it
enters the sitemap and becomes indexable automatically once at least one eligible
lodging exists.

## Architecture

A new `local-seo` bounded frontend module owns:

- a typed, reviewed catalogue of the four destinations;
- route and publication helpers;
- metadata builders for each intent;
- structured data builders limited to visible facts;
- shared mobile-first presentation components.

The lodging query is extended only to expose the already validated external booking
URL and platform on marketing cards. No schema or API change is required.

Each App Router page remains a Server Component. Unknown or inactive service routes
call `notFound()`. The locations route queries eligible published inventory and uses
that result both for rendering and for its robots decision.

## SEO graph

The public hubs link to the local pages:

- `/confier-mon-logement` → active concierge pages;
- `/seminaires` → active seminar pages;
- `/logements` → destination rental pages.

Active local pages link back to their hub, to the relevant destination rental page,
and to other useful public content. The sitemap contains only active service pages
and rental pages backed by published inventory.

Every indexable page receives a unique title, description, canonical, Open Graph
entry, one H1, a visible breadcrumb trail and JSON-LD. Service pages emit `Service`
with the stable MyStay Organization provider. Rental pages emit `ItemList` with
short canonical lodging URLs.

## Content and trust boundaries

Copy is reviewed and unique per intent and destination. The pages never invent
prices, availability, reviews, performance promises, capacities or unsupported
service areas.

Airbnb is described only as an outbound booking option. `Voir sur Airbnb` appears
only when an eligible profile contains `external_booking_platform = airbnb` and an
HTTPS URL already accepted by the lodging publication workflow. MyStay does not
claim an official Airbnb relationship.

## Visual system

All pages reuse `MarketingShell`, the existing MyStay sans-serif typography,
container widths, pink accent, slate buttons, rounded cards and responsive
breakpoints. Layout starts as one column at 375 px and progressively becomes a grid;
there is no new visual language, zoom or scale transform.

## Verification

Tests cover catalogue publication, route 404 behavior, metadata and robots,
published-only lodging queries, conditional Airbnb CTAs, structured data, sitemap
eligibility, hub links and mobile-first class contracts. Final verification includes
targeted Jest suites, TypeScript, ESLint and a production build.
