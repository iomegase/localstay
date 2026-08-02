# Private Guide Practical Information Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer `/sejour/logement/informations-pratiques` avec la vue pratique partagée et les données privées du séjour.

**Architecture:** Ajouter une page App Router qui rend `PrivateGuidePage({ initialView: 'practical' })`, puis remplacer la destination `practical` historique dans la route map privée.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS, Jest/Testing Library.

---

### Task 1: Page Informations pratiques

**Files:**
- Create: `tests/integration/private-guide-practical-info.AC-01-01-04.page.test.tsx`
- Modify: `tests/integration/private-guide-lodging-home.AC-01-01-04.page.test.tsx`
- Modify: `tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`
- Create: `src/app/(public)/sejour/logement/informations-pratiques/page.tsx`
- Modify: `src/features/guide-app/components/PrivateGuidePage.tsx`

- [x] Écrire les tests exigeant la vue `practical`, les données privées et la nouvelle destination.
- [x] Exécuter les tests et constater l'échec attendu.
- [x] Créer la page et mettre à jour la route map.
- [x] Exécuter les tests ciblés et obtenir un résultat vert.

### Task 2: Traçabilité et vérification

**Files:**
- Modify: `docs/traceability-matrix.md`

- [x] Relier les critères de la spec 038 aux sources et tests.
- [x] Exécuter tests, TypeScript, lint et build.
- [x] Contrôler le diff sans inclure `next-env.d.ts`.
