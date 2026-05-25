# Trail Navigation GPS Start Fix Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger les actions randonnée pour que "Rejoindre le départ" affiche une route Mapbox et que "Commencer la rando" demande le GPS explicitement, distingue le pré-départ du hors-tracé et permette le recentrage.

**Architecture:** La correction reste dans `021-trail-navigation`. Aucun schéma ni route API n'est ajouté. `TrailNavigationMap` garde la carte Mapbox plein écran, mais sépare l'état `ready` du tracking GPS actif.

**Tech Stack:** Next.js 16 App Router, React Client Component, TypeScript strict, Mapbox GL via `react-map-gl`, Jest + Testing Library.

---

### Task 1: Spec And Traceability

**Files:**
- Modify: `specs/features/021-trail-navigation/spec.md`
- Modify: `docs/traceability-matrix.md`

- [ ] Add PO decision: no automatic `watchPosition` on `/start`.
- [ ] Add `ready`, `pre_start`, explicit activation and recentering rules.
- [ ] Update traceability lines for `AC-02-03`, `AC-02-06`, `AC-03-03`, `AC-03-06`, `AC-04-01`.

### Task 2: Red Tests

**Files:**
- Modify: `tests/unit/trail-navigation.start-map.test.tsx`
- Modify: `tests/unit/trail-navigation.actions.test.tsx`

- [ ] Assert `/start` renders the map in `ready` without calling `watchPosition`.
- [ ] Assert clicking "Activer le suivi GPS" starts `watchPosition`.
- [ ] Assert first far-away GPS position shows "Vous n'êtes pas encore au départ" instead of "Vous semblez vous éloigner du tracé".
- [ ] Assert unmount clears the active `watchPosition`.
- [ ] Assert "Rejoindre le départ" calls Mapbox Directions and renders a route map after GPS consent.

### Task 3: Implementation

**Files:**
- Modify: `src/features/trail-navigation/components/TrailNavigationMap.tsx`
- Modify: `src/features/trail-navigation/components/TrailAccessActions.tsx`

- [ ] Add `ready` and `pre_start` GPS states.
- [ ] Move `watchPosition` startup behind an explicit button.
- [ ] Keep the trail visible before GPS consent.
- [ ] Track whether the user has reached the trail zone before allowing `off_track`.
- [ ] Wire "Recentrer" to the latest known user position without starting GPS implicitly.
- [ ] Replace the access-route placeholder with a Mapbox route map using Directions API and a non-blocking fallback.

### Task 4: Verification

**Commands:**
- `npm test -- tests/unit/trail-navigation.start-map.test.tsx`
- `npm test -- tests/integration/trail-navigation.public-detail.test.tsx tests/unit/trail-navigation.actions.test.tsx`

- [ ] Confirm all targeted tests pass.
- [ ] Confirm no Google Maps URL is introduced for randonnées.
