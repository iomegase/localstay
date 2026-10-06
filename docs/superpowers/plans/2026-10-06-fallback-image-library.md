# Plan — Spec 070 Médiathèque des images de remplacement + nettoyage du stockage

Spec : `specs/features/070-fallback-image-library/spec.md` (approved 2026-10-06).
Exécution inline, TDD (test rouge → code → vert) à chaque phase.

## Phase 1 — Données
- `prisma/schema.prisma` : modèle `FallbackImage` ; `PointOfInterest.fallback_image_id`
  + relations inverses `Category.fallback_images`, `SubCategory.fallback_images`.
- Migration additive `20261006150000_fallback_image_library` ; `prisma generate` ;
  `migrate deploy` (additive, cf. mémoire reference-db-migration-apply).

## Phase 2 — Attribution (US-02)
- `src/features/fallback-images/lib/assignment.ts` (pur) : `pickFallbackImage(poi,
  images, usageByImageInCity)` → sous-catégorie, sinon catégorie ; moins utilisée ;
  égalité = plus ancienne. `isAssignmentValid(poi, image)`.
- `src/features/fallback-images/services/reassign.ts` : `reassignFallbackImages({ poiIds? | cityId? })`
  — POI actifs non supprimés : sans photo exploitable → attribution valide conservée
  sinon nouvelle ; avec photo → attribution retirée.
- Tests unit : sans doublon, stabilité, réattribution après retrait/reclassement,
  vraie photo prioritaire.

## Phase 3 — Médiathèque (US-01)
- Routes `src/app/api/admin/fallback-images/route.ts` (GET liste + usage, POST
  multipart via `uploadGuideImage(file, 'fallbacks')`), `classify/route.ts`,
  `[id]/route.ts` (DELETE soft). Zod. Appel `reassignFallbackImages` après mutation.
- Page `src/app/admin/fallback-images/page.tsx` + composant client
  `AdminFallbackImageLibrary.tsx` ; entrée de menu admin.
- Tests contract (routes) + integration (sélection, classement, filtres).

## Phase 4 — Affichage
- DTO : `fallback_image_url` ajouté aux requêtes `categories/queries/poi-cards.ts`,
  `all-poi-cards.ts`, `poi-detail.ts`, `guide-app/queries/private-guide-data.ts`,
  `public-discovery/queries/public-discovery.ts`.
- `resolveDiscoveryCardPhoto` et composants guide (`PoiCard`, `PoiDetailBody`,
  `TrailPoiDetailBody`, `guide-app/lib/poi-image.ts`) : `fallback_image_url` d'abord,
  puis `getPoiFallbackImage` (repli de transition BR-07), puis image MyStay.
- Tests : ordre de priorité, DTO.

## Phase 5 — Déclencheurs d'attribution
- Après PATCH POI, création manuelle, publication de candidat : `reassignFallbackImages({ poiIds: [id] })`.

## Phase 6 — Suppression à l'enregistrement (US-03)
- `src/features/storage-cleanup/lib/references.ts` : index des URL référencées (BR-04).
- `src/features/storage-cleanup/services/delete-files.ts` : `deleteUnreferencedFiles(urls)`
  (bucket `guide-photos`, préfixes `pois/` `lodgings/`, jamais `fallbacks/`, erreurs
  journalisées non bloquantes).
- POI PATCH : photos retirées + copies `PoiPhotoMirror` (soft delete ligne).
- Logements : retrait photo vitrine, couverture remplacée, photos blocs pratiques /
  instructions d'arrivée.

## Phase 7 — Nettoyage hebdomadaire (US-04)
- `src/app/api/internal/storage-cleanup/route.ts` (GET cron + POST `dry_run`),
  `INTERNAL_API_SECRET` comme les autres tâches ; > 24 h seulement ; rapport.
- `vercel.json` : `0 3 * * 1`.
- `scripts/cleanup-storage.ts` : simulation puis exécution (nettoyage initial).

## Phase 8 — Clôture
- Traçabilité, suite complète, `next build`, mémoire projet.
- `public/fallback` retiré seulement après import par le PO (BR-07, commit distinct).
