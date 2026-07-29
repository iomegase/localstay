# Guide Featured Bento Cards

**Date:** 2026-07-29  
**Status:** approved by Product Owner in conversation  
**Scope:** the three featured POI cards on the shared GuideApp home

## Goal

Refine only the three “Nos coups de cœur” cards on the GuideApp home by using
the existing private-guide bento visual language, while preserving the current
horizontal interaction.

## Layout

The section keeps a horizontally scrollable row. The scroll remains available
to touch, trackpad, mouse wheel and keyboard users, but the visual scrollbar is
hidden in Firefox, Chromium and Safari.

The three featured cards:

- use the same width;
- use exactly the same height;
- use horizontal scroll snapping;
- retain the existing click action that opens the internal POI sheet;
- never render a white text-only variant.

## Card Design

Each card reuses the visual language of the private guide bento:

- full-bleed image;
- strongly rounded corners;
- subtle elevation shadow;
- dark bottom gradient for legibility;
- POI name and distance over the image;
- compact type sized for the smartphone frame.

The three cards use the same component variant and dimensions. No card receives
special emphasis through a different width or height.

## Image Priority

The `GuidePoi.photos` array follows the existing admin contract:

1. when an admin selects a hero image, it is moved to `photos[0]`;
2. when a real gallery exists, the card renders `photos[0]`;
3. a category fallback may occupy `photos[0]` only when the POI has no real
   gallery;
4. the card never replaces an available admin-selected hero with a fallback.

The public demo remains isolated from private APIs and authentication. Its
static POI snapshot stores public hero image URLs already selected in the
admin data. No database query is added when opening the modal.

## Shared Boundaries

The change stays in the shared GuideApp data contract and presentation. Private
route access and the public demo modal remain unchanged. The full favorites
page, map and POI sheets continue to consume the same `GuidePoi` objects.

## Testing

- the home row remains horizontally scrollable and hides its scrollbar;
- exactly three featured cards render;
- all three cards have the same width and height classes;
- all three cards use full-image bento presentation;
- a POI with a real gallery uses its first/admin-selected hero image;
- a POI without a gallery uses its category fallback;
- clicking a card still opens the internal POI view without changing the URL.

## Out of Scope

- redesigning the full “Coups de cœur” page;
- modifying the private recommendation route or its links;
- changing the POI admin photo ordering workflow;
- adding a public database request to the demo;
- changing the modal, header, bottom navigation or map.
