# Private Guide Favorites Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer `/sejour/coups-de-coeur` avec le design partagé de la démo et les POI privés du séjour actif.

**Architecture:** Extraire le chargement et la configuration du guide privé dans un Server Component commun, puis rendre ce composant avec `initialView="home"` ou `initialView="favorites"`. Étendre la frontière proxy à `/sejour/*` et convertir l'ancienne page recommandations en redirection de compatibilité.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS, Jest/Testing Library.

---

### Task 1: Route privée et navigation canonique

**Files:**
- Create: `tests/integration/private-guide-favorites.AC-01-01-05.page.test.tsx`
- Modify: `tests/integration/private-guide-app.AC-01-01-04.home.test.tsx`
- Modify: `tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`
- Create: `src/features/guide-app/components/PrivateGuidePage.tsx`
- Modify: `src/app/(public)/sejour/page.tsx`
- Create: `src/app/(public)/sejour/coups-de-coeur/page.tsx`

- [x] Écrire les tests qui exigent `initialView="favorites"`, les données privées et `/sejour/coups-de-coeur` comme destination.
- [x] Exécuter les tests ciblés et constater l'échec dû à la route et au composant absents.
- [x] Extraire le shell serveur privé, créer la page enfant et remplacer les anciennes destinations.
- [x] Exécuter les tests ciblés et obtenir un résultat vert.

### Task 2: Frontière de layout et ancien lien

**Files:**
- Modify: `tests/unit/proxy.guest-confinement.test.ts`
- Create: `tests/unit/private-guide-favorites.AC-02-02.legacy-route.test.ts`
- Modify: `src/proxy.ts`
- Modify: `src/app/(public)/nos-recommandations/page.tsx`

- [x] Écrire les tests qui exigent le header GuideApp sur `/sejour/coups-de-coeur`, le contrôle d'accès anonyme et la redirection de l'ancien URL.
- [x] Exécuter les tests et constater leur échec sur le comportement historique.
- [x] Étendre `isGuideAppRoute` au sous-arbre et transformer l'ancienne page en redirection proxy.
- [x] Exécuter les tests ciblés et obtenir un résultat vert.

### Task 3: Traçabilité et vérification

**Files:**
- Modify: `docs/traceability-matrix.md`

- [x] Relier chaque critère de la spec 035 aux sources et tests.
- [ ] Exécuter les tests privés ciblés, TypeScript, lint et build.
- [ ] Vérifier visuellement la route à 375 px et 1280 px, l'absence de débordement et l'onglet cœur actif.
- [ ] Contrôler le diff final sans inclure `next-env.d.ts`.
