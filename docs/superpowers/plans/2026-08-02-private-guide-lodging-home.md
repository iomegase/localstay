# Private Guide Lodging Home Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter `/sejour/logement` avec la première vue Guide de la démonstration et les données privées du séjour.

**Architecture:** Rendre le Server Component privé partagé avec `initialView="lodging"`, puis remplacer uniquement la destination parent `lodging`. Les sous-pages historiques restent en place jusqu'à leurs incréments dédiés.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS, Jest/Testing Library.

---

### Task 1: Page parent Guide

**Files:**
- Create: `tests/integration/private-guide-lodging-home.AC-01-01-04.page.test.tsx`
- Modify: `tests/integration/private-guide-app.AC-01-01-04.home.test.tsx`
- Modify: `tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`
- Create: `src/app/(public)/sejour/logement/page.tsx`
- Modify: `src/features/guide-app/components/PrivateGuidePage.tsx`

- [x] Écrire les tests exigeant la vue `lodging`, les données privées et la route parent canonique.
- [x] Exécuter les tests et constater l'échec de la route absente et des anciennes destinations.
- [x] Créer la page et remplacer la destination parent dans les routes et le menu privés.
- [x] Exécuter les tests ciblés et obtenir un résultat vert.

### Task 2: Traçabilité et vérification

**Files:**
- Modify: `docs/traceability-matrix.md`

- [x] Relier les critères de la spec 036 aux sources et tests.
- [ ] Exécuter les tests privés, TypeScript, lint et build.
- [ ] Vérifier le rendu 375/1280, l'onglet Guide actif et l'absence de débordement.
- [ ] Contrôler le diff sans inclure les fichiers générés ou les changements utilisateur.
