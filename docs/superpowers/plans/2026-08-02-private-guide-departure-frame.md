# Private Guide Departure and Frame Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer la page Départ interactive et présenter tout le guide privé dans une frame smartphone blanche contrainte.

**Architecture:** Extraire `DepartureChecklist` dans le domaine partagé du GuideApp, l'utiliser dans les interfaces historique et nouvelle, puis ajouter la route departure canonique. Adapter uniquement le Server Component `PrivateGuidePage` pour encadrer toutes les routes privées.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS, Jest/Testing Library.

---

### Task 1: Checklist partagée et route Départ

**Files:**
- Create: `tests/integration/private-guide-departure.AC-01-01-05.page.test.tsx`
- Create: `tests/integration/private-guide-departure.AC-01-02-03.checklist.test.tsx`
- Modify: `tests/integration/private-guide-lodging-home.AC-01-01-04.page.test.tsx`
- Modify: `tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`
- Create: `src/features/guide-app/components/DepartureChecklist.tsx`
- Modify: `src/app/(public)/le-logement/_components/DepartureChecklist.tsx`
- Modify: `src/features/guide-app/components/GuideLodgingViews.tsx`
- Create: `src/app/(public)/sejour/logement/depart/page.tsx`
- Modify: `src/features/guide-app/components/PrivateGuidePage.tsx`

- [x] Écrire les tests exigeant la route, la checklist et sa progression locale.
- [x] Exécuter les tests et constater les échecs attendus.
- [x] Extraire la checklist, créer la route et brancher `departure`.
- [x] Exécuter les tests ciblés et obtenir un résultat vert.

### Task 2: Frame smartphone privée

**Files:**
- Create: `tests/integration/private-guide-frame.AC-02-01-04.shell.test.tsx`
- Modify: `src/features/guide-app/components/PrivateGuidePage.tsx`

- [x] Écrire le test exigeant largeur, hauteur, coins, bordure et overflow.
- [x] Exécuter le test et constater l'échec sur le shell plein écran.
- [x] Ajouter la scène extérieure et la frame smartphone.
- [x] Exécuter le test ciblé et obtenir un résultat vert.

### Task 3: Traçabilité et vérification

**Files:**
- Modify: `docs/traceability-matrix.md`

- [x] Relier les critères de la spec 039 aux sources et tests.
- [x] Exécuter les tests privés et historiques, TypeScript, lint et build.
- [x] Vérifier l'absence de fichiers générés ou non liés dans le commit.
