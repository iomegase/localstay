# Admin Local Landing Reviews Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre au Super-admin de gérer les avis publiés immédiatement sur les landings conciergerie locales.

**Architecture:** Une table Prisma dédiée stocke les avis par slug de destination. Les queries `local-seo` séparent la lecture publique limitée à trois avis de la lecture/mutation Admin ; des routes API authentifiées et un écran client mobile-first assurent le CRUD avec soft delete et revalidation.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Prisma/PostgreSQL, Zod, Tailwind, Lucide, Jest.

---

### Task 1: Persistance et validation

**Files:**
- Modify: `prisma/schema.prisma`
- Create: `prisma/migrations/20260908180000_add_local_landing_reviews/migration.sql`
- Create: `src/features/local-seo/schemas/landing-reviews.ts`
- Test: `tests/unit/local-landing-reviews.validation.test.ts`

- [ ] Écrire les tests invalidant un slug inconnu, une note hors 1–5 et un texte trop court.
- [ ] Exécuter `npm test -- tests/unit/local-landing-reviews.validation.test.ts --runInBand` et constater l'échec par module absent.
- [ ] Ajouter `LocalLandingReviewSource`, `LocalLandingReview`, la migration et les schémas Zod stricts.
- [ ] Relancer le test et obtenir `PASS`.
- [ ] Committer `feat(local-seo): persist landing reviews`.

### Task 2: Queries publiques et Admin

**Files:**
- Create: `src/features/local-seo/queries/landing-reviews.ts`
- Modify: `src/features/local-seo/content/guest-reviews.ts`
- Test: `tests/unit/local-landing-reviews.queries.test.ts`

- [ ] Tester que la lecture publique filtre `{ destination_slug, deleted_at: null, is_active: true }`, trie par ordre/date et prend trois lignes.
- [ ] Vérifier l'échec du test.
- [ ] Implémenter `listPublicLandingReviews`, `listAdminLandingPages`, `create`, `update`, `archive` et `restore` avec mapping de dates ISO.
- [ ] Relancer le test et obtenir `PASS`.
- [ ] Committer `feat(local-seo): add landing review queries`.

### Task 3: Contrat API Admin

**Files:**
- Create: `src/app/api/admin/landing-page-reviews/route.ts`
- Create: `src/app/api/admin/landing-page-reviews/[id]/route.ts`
- Create: `src/app/api/admin/landing-page-reviews/[id]/restore/route.ts`
- Test: `tests/contract/local-landing-reviews.admin-api.test.ts`

- [ ] Tester l'auth Admin, les erreurs Zod, les statuts 201/200/404 et la revalidation de la landing concernée.
- [ ] Vérifier l'échec du test.
- [ ] Implémenter les handlers avec `getSessionAdmin`, `apiError` et `revalidatePath`.
- [ ] Relancer le test et obtenir `PASS`.
- [ ] Committer `feat(admin): expose landing review api`.

### Task 4: Interface Admin mobile-first

**Files:**
- Modify: `src/app/admin/layout.tsx`
- Create: `src/app/admin/landing-pages/page.tsx`
- Create: `src/features/local-seo/components/AdminLandingPages.tsx`
- Test: `tests/integration/local-landing-reviews.admin-page.test.tsx`

- [ ] Tester la présence de l'onglet, des quatre villes, des champs et actions.
- [ ] Vérifier l'échec du test.
- [ ] Ajouter l'entrée `Landing pages`, la page serveur protégée et l'éditeur client responsive.
- [ ] Relancer le test et obtenir `PASS`.
- [ ] Committer `feat(admin): manage local landing reviews`.

### Task 5: Connexion à la landing publique

**Files:**
- Modify: `src/app/(public)/conciergerie/[city-slug]/page.tsx`
- Modify: `src/features/local-seo/components/GuestReviews.tsx`
- Test: `tests/integration/local-landing-reviews.public-page.test.tsx`
- Modify: `docs/traceability-matrix.md`

- [ ] Tester le chargement asynchrone par slug, le maximum de trois, les notes et l'absence de section à vide.
- [ ] Vérifier l'échec du test.
- [ ] Remplacer le catalogue statique par la query Prisma et rendre les champs facultatifs sans JSON-LD d'avis.
- [ ] Mettre à jour la matrice pour AC-01-01 à AC-03-04.
- [ ] Exécuter les tests ciblés, `npx prisma validate`, `npm run lint` et `npm run build`.
- [ ] Committer `feat(seo): publish managed local reviews`.

