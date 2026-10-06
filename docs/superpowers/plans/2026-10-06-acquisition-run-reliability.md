# Plan — Spec 072 Lancements d'acquisition fiables

Spec : `specs/features/072-acquisition-run-reliability/spec.md` (approved). Inline, TDD.

1. Données : `source_url`, `pending_places` (Json), `processed_count` sur `PoiAcquisitionRun` ;
   migration additive `20261006200000_acquisition_run_batches` (appliquée par le PO).
2. `lib/pending-places.ts` : sérialisation / désérialisation des candidats Google en attente.
3. `services/process-run.ts` : `processPendingCandidates(runId, { deadline, now })` — lots de 5
   en parallèle, mise à jour après chaque lot, statut final completed / partial.
4. `createAcquisitionRun` : recherche + filtres → `pending_places` → traitement borné.
5. `resumeAcquisitionRun` + route `runs/{id}/resume` ; `markStalledRuns` (> 10 min) appelé à la lecture.
6. UI : badge PARTIEL, « N lieux restent à traiter » + « Reprendre ».
7. Traçabilité, suite complète, build.
