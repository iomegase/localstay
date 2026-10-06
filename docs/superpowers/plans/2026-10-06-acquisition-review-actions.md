# Plan — Spec 071 Actions de revue des candidats (modifier, rejeter mémorisé, exclure)

Spec : `specs/features/071-acquisition-review-actions/spec.md` (approved). Inline, TDD.

1. **Données** — `PoiAcquisitionMemory`, compteurs `skipped_rejected` / `skipped_excluded`
   sur le run ; migration additive `20261006180000_acquisition_review_memory`. Application
   en base : **par le PO** (`npx prisma migrate deploy`), jamais de commande destructive.
2. **Mémoire** — `src/features/poi-acquisition/lib/review-memory.ts` (pur : filtrage des
   candidats Google par mémoire) + `queries/review-memory.ts` (lecture par ville,
   création, réintégration).
3. **Rejeter** — `rejectCandidate` crée la mémoire `rejected` (catégorie du run).
4. **Exclure** — `excludeCandidate` + route `candidates/{id}/exclude` ; candidat `excluded`
   masqué de la revue.
5. **Modifier** — `updateCandidate` + `PATCH candidates/{id}` (Zod, catégorie /
   sous-catégorie, regéocodage Mapbox si adresse changée) ; fenêtre d'édition.
6. **Pipeline** — filtre après le filtre village, compteurs ; résumé du run.
7. **Recherche par nom** — badges « Rejeté (catégorie) » / « Exclu ».
8. **Liste « Lieux exclus ou rejetés »** — routes `memories` + section sur la page
   Acquisition, « Réintégrer ».
9. **Clôture** — traçabilité, suite complète, build.
