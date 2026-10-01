# Sélection des logements séminaires — Implementation Plan

**Goal:** Implémenter la spec approuvée 051, de la sélection Admin aux deux surfaces publiques.
**Architecture:** Booléen sur Lodging, mutation Admin validée Zod, query publique commune filtrée par City.id. Composant de cartes partagé ; invalidation réutilise le helper existant.
**Tech Stack:** Next.js App Router, Prisma/PostgreSQL, TypeScript, Tailwind, Shadcn, Jest.

Exécution autonome dans le workspace courant selon AGENTS.md, sans modifier les artifacts existants. Ordre source → tests → traçabilité imposé par AGENTS.md prioritaire sur TDD.

- [x] Ajouter `seminar_selected Boolean @default(false)` à `prisma/schema.prisma`, produire une migration additive avec Prisma migrate diff et régénérer le client.
- [x] Créer `src/features/lodging-showcase/queries/seminar-lodgings.ts` : lecture éligible, tri titre/id et filtre facultatif City.id ; mutation atomique ne modifiant que le booléen.
- [x] Créer `src/app/api/admin/lodgings/[id]/seminar-selection/route.ts` : auth Admin, UUID/corps Zod strict, erreurs standard, résultat id/booléen.
- [x] Étendre le DTO et select de `queries/admin-public-profiles.ts`, ajouter `components/SeminarSelectionButton.tsx` et intégrer dans `AdminLodgingProfilesTable.tsx` avec titre public/nom interne.
- [x] Créer `components/SeminarLodgings.tsx` : section masquée si vide, cartes publiques responsive. Brancher `/seminaires/page.tsx` et `/seminaires/[city-slug]/page.tsx`, slot avant CTA de `LocalServiceLanding.tsx`.
- [x] Étendre `lib/revalidation.ts` pour les landings séminaires et vérifier les appels des mutations existantes.
- [x] Tests contract AC-01/02, query AC-04/05/06, UI AC-03/07/08, invalidation AC-09, migration AC-10 et scénario E2E. Adapter uniquement les fixtures touchées par le nouveau champ.
- [x] Exécuter Jest ciblé, `npx tsc --noEmit`, ESLint ciblé et Prisma validate. Appliquer seulement la migration additive via Prisma, vérifier défaut false et conservation des logements.
- [x] Vérifier les pages locales et le parcours disponible, mettre à jour `docs/traceability-matrix.md` avec résultats et limites réelles.

Validation : migration appliquée, 7 logements conservés et non sélectionnés. 273 tests réussis ; test Prisma réel exécuté séparément et intégralement annulé. TypeScript, ESLint et Prisma validate OK. Contrôle navigateur public mobile/desktop réussi. Scénario Admin E2E livré, non exécuté faute de session Admin de test. Test historique du CTA aligné sur « Nous contacter », sans modifier le changement simultané du produit.
