# Private Guide Arrival Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer la page privée `/sejour/logement/arrivee` avec la vue arrivée partagée et les données réelles du logement.

**Architecture:** Ajouter une page App Router qui appelle `PrivateGuidePage({ initialView: 'arrival' })`, puis rendre `arrival` canonique dans la route map partagée.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS, Jest/Testing Library.

---

### Task 1: Page arrivée canonique

**Files:**
- Create: `tests/integration/private-guide-arrival.AC-01-01-04.page.test.tsx`
- Modify: `tests/integration/private-guide-lodging-home.AC-01-01-04.page.test.tsx`
- Create: `src/app/(public)/sejour/logement/arrivee/page.tsx`
- Modify: `src/features/guide-app/components/PrivateGuidePage.tsx`

- [x] Écrire les tests exigeant la vue `arrival`, les données privées et la destination canonique.
- [x] Exécuter les tests et constater l'échec de la route absente.
- [x] Créer la page et mettre à jour la route map.
- [x] Exécuter les tests ciblés et obtenir un résultat vert.

### Task 2: Traçabilité et vérification

**Files:**
- Modify: `docs/traceability-matrix.md`

- [x] Relier les critères de la spec 037 aux sources et tests.
- [x] Exécuter tests, TypeScript, lint et build.
- [x] Vérifier la génération de la route privée et les contraintes de largeur couvertes par le shell partagé.
