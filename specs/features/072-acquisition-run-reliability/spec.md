# Spec — 072 Acquisition POI : lancements qui ne se coupent plus

## Metadata

```yaml
id: 072-acquisition-run-reliability
title: "Traiter les candidats en parallèle, par lots reprenables, sans lancement bloqué"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 018-poi-acquisition-pipeline
  - 066-acquisition-village-scope
  - 071-acquisition-review-actions
bounded_context: poi-acquisition
implementation_gate: "PO 2026-10-06 : « ok pour la spec 72 » (traitement parallèle, reprise, passage automatique en partiel)."
```

---

## Context

Le 2026-10-06, le lancement Saint-Gervais / Restaurant a créé 41 candidats en 4 min 40
puis a été coupé par la durée maximale d'une fonction Vercel : il est resté `running`
indéfiniment, compteurs à zéro, lieux restants jamais traités. Chaque candidat est
traité séquentiellement (site officiel, description Gemini, géocodage Mapbox,
doublons ≈ 7 s), et la pagination à 60 résultats (066) multiplie le volume.

---

## User Stories

### US-01 — Traitement parallèle et borné

#### Acceptance Criteria

- **AC-01-01**: Given un lancement, When les candidats Google retenus (après filtres
  066 / 071) sont connus, Then ils sont enregistrés comme « à traiter » sur le run
  avant tout traitement payant.
- **AC-01-02**: Given des candidats à traiter, When le traitement s'exécute, Then ils
  sont traités par lots de 5 en parallèle, et le run est mis à jour après chaque lot
  (lieux restants, nombre traités).
- **AC-01-03**: Given le budget de temps (240 s par requête, fonction à 300 s), When il
  est atteint, Then aucun nouveau lot n'est lancé ; le run passe en `partial` s'il reste
  des lieux, `completed` sinon.
- **AC-01-04**: Given l'échec d'un candidat, When le lot se termine, Then les autres
  candidats du lot sont conservés et l'erreur est ajoutée au message du run.

### US-02 — Reprendre un lancement partiel

#### Acceptance Criteria

- **AC-02-01**: Given un run `partial`, When l'admin clique sur « Reprendre », Then les
  lieux restants sont traités selon US-01, sans nouvelle recherche Google.
- **AC-02-02**: Given un run `completed`, `failed` ou `running` récent, When une reprise
  est demandée, Then elle est refusée (409 `RUN_NOT_RESUMABLE`).
- **AC-02-03**: Given le détail d'un run `partial`, When il s'affiche, Then il indique
  « N lieux restent à traiter » et propose « Reprendre ».

### US-03 — Plus de lancement bloqué

#### Acceptance Criteria

- **AC-03-01**: Given un run `running` sans mise à jour depuis plus de 10 minutes, When
  la liste ou le détail des runs est lu, Then il passe en `partial` (reprenable s'il
  reste des lieux, sinon `completed`).
- **AC-03-02**: Given la liste des runs, When un run est `partial`, Then il porte un
  badge « PARTIEL ».

---

## Business Rules

- **BR-01**: Concurrence fixe : 5 candidats simultanés.
- **BR-02**: Aucune recherche Google n'est refaite lors d'une reprise ; les filtres
  066 / 071 ont été appliqués au démarrage.
- **BR-03**: Le contexte du site officiel fourni au lancement (`source_url`) est
  conservé sur le run et réutilisé à la reprise.
- **BR-04**: Les données Google conservées en attente suivent les règles de
  conservation existantes (018 BR-05 / BR-06) : elles sont retirées du run dès que le
  candidat est créé.

---

## Data Model

```prisma
model PoiAcquisitionRun {
  // …existant
  source_url      String?
  pending_places  Json     @default("[]")   // candidats Google restant à traiter
  processed_count Int      @default(0)
}
```

`status` accepte `partial`. Migration additive.

---

## API Contract

```yaml
/api/admin/poi-acquisition/runs:
  post: # inchangé ; peut désormais répondre avec status partial
/api/admin/poi-acquisition/runs/{id}/resume:
  post: 200 { data: run }   404 NOT_FOUND   409 RUN_NOT_RESUMABLE
/api/admin/poi-acquisition/runs/{id}:
  get: 200 { data: { …, status, pending_count, processed_count } }
```

---

## UI Behaviour

- Liste des runs : badge « PARTIEL ».
- Détail d'un run partiel : « N lieux restent à traiter » + bouton « Reprendre ».

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..04 | En attente, lots parallèles, budget, échecs isolés | unit + integration |
| AC-02-01..03 | Reprise, refus, affichage | unit + contract + integration |
| AC-03-01..02 | Runs bloqués → partiel, badge | unit + integration |

---

## Out of Scope

- File d'attente ou worker hors Vercel.
- Reprise automatique sans action admin.

---

## Open Questions

Aucune.
