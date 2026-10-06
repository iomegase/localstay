# Spec — 071 Acquisition POI : modifier, rejeter (mémorisé), exclure

## Metadata

```yaml
id: 071-acquisition-review-actions
title: "Donner un sens distinct et durable aux actions de revue des candidats d'acquisition"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 018-poi-acquisition-pipeline
  - 066-acquisition-village-scope
bounded_context: poi-acquisition
amends:
  - "018 US-02 (revue des candidats) : rejet mémorisé, actions Modifier et Exclure"
implementation_gate: "PO 2026-10-06 : « je valide la spec 071 » (Modifier, Rejeter mémorisé par ville + catégorie, Exclure mémorisé par ville et réversible)."
```

---

## Context

Dans `/admin/poi-acquisition/runs/{id}`, « Rejeter » passe le candidat en `rejected`
sans rien mémoriser : la prochaine acquisition de la même catégorie le repropose. Les
boutons crayon et corbeille n'ont aucune action. Un lieu pertinent mais mal classé
(ex. Maison des Alpes proposée en Restaurant) ne peut qu'être rejeté.

---

## Glossary References

- **Candidat** — `PoiAcquisitionCandidate` en revue.
- **Mémoire de revue** — décision durable sur un lieu Google (`google_place_id`) pour
  une ville : rejet pour une catégorie, ou exclusion toutes catégories.

---

## User Stories

### US-01 — Modifier un candidat avant publication

#### Acceptance Criteria

- **AC-01-01**: Given un candidat `needs_review`, When l'admin clique sur ✏️, Then une
  fenêtre permet de modifier nom, adresse, téléphone, site web, description,
  catégorie et sous-catégorie (sous-catégories de la catégorie choisie).
- **AC-01-02**: Given un enregistrement, When l'adresse a changé, Then elle est
  regéocodée par Mapbox (statut et coordonnées mis à jour, 018 BR-03).
- **AC-01-03**: Given une sous-catégorie d'une autre catégorie ou une catégorie
  inactive, When l'admin enregistre, Then la modification est refusée (400).
- **AC-01-04**: Given un candidat modifié, When il est publié, Then le POI reprend les
  valeurs modifiées.

### US-02 — Rejeter pour cette catégorie, durablement

#### Acceptance Criteria

- **AC-02-01**: Given un candidat avec `google_place_id`, When l'admin le rejette, Then
  le rejet est mémorisé pour la ville et la catégorie du run.
- **AC-02-02**: Given une acquisition de la même ville et de la même catégorie, When un
  lieu rejeté est trouvé, Then il n'est pas recréé (aucun appel Gemini / Mapbox) et le
  compteur `skipped_rejected` du run est incrémenté.
- **AC-02-03**: Given une acquisition d'une autre catégorie, When ce lieu est trouvé,
  Then il est proposé normalement.

### US-03 — Exclure un lieu de toutes les acquisitions

#### Acceptance Criteria

- **AC-03-01**: Given un candidat `needs_review`, When l'admin clique sur « Exclure »
  (icône corbeille) et confirme, Then le candidat passe en `excluded` et disparaît de la
  liste de revue, et le lieu est mémorisé comme exclu pour la ville (toutes catégories).
- **AC-03-02**: Given une acquisition de la ville, quelle que soit la catégorie, When un
  lieu exclu est trouvé, Then il n'est pas recréé et `skipped_excluded` est incrémenté.
- **AC-03-03**: Given la liste « Lieux exclus ou rejetés » de la page Acquisition, When
  l'admin clique sur « Réintégrer », Then la mémoire est retirée (soft delete) et le lieu
  peut de nouveau être proposé.

### US-04 — Informer sans bloquer

#### Acceptance Criteria

- **AC-04-01**: Given le détail d'un run, When il s'affiche, Then le résumé indique
  « N lieux déjà rejetés pour cette catégorie » et « N lieux exclus » quand N > 0, et le
  nombre de candidats exclus masqués.
- **AC-04-02**: Given « Ajouter un lieu précis » (066 US-04), When un résultat est
  mémorisé, Then il est affiché avec un badge « Rejeté (catégorie) » ou « Exclu » ;
  l'admin peut quand même l'ajouter (choix explicite).

---

## Business Rules

- **BR-01**: La mémoire porte sur `google_place_id` + ville. Un candidat sans
  `google_place_id` n'est pas mémorisé (rejet / exclusion locale au run).
- **BR-02**: Rejet = portée catégorie ; exclusion = toutes catégories. Une exclusion
  prime sur un rejet.
- **BR-03**: Le filtrage a lieu après le filtre village (066) et avant tout traitement
  payant.
- **BR-04**: Les mémoires sont réversibles (soft delete), jamais supprimées physiquement.
- **BR-05**: Les actions sont auditées (`PoiAcquisitionAuditLog`).

---

## Data Model

```prisma
model PoiAcquisitionMemory {
  id              String    @id @default(uuid())
  created_at      DateTime  @default(now())
  updated_at      DateTime  @updatedAt
  deleted_at      DateTime?
  city_id         String
  city            City      @relation(fields: [city_id], references: [id])
  google_place_id String
  kind            String    // rejected | excluded
  category_id     String?   // rejet : catégorie ; exclusion : null
  category        Category? @relation(fields: [category_id], references: [id])
  name            String
  address         String
  created_by      String?

  @@index([city_id, google_place_id, deleted_at])
}

model PoiAcquisitionRun {
  // …existant
  skipped_rejected Int @default(0)
  skipped_excluded Int @default(0)
}
```

`PoiAcquisitionCandidate.review_status` accepte `excluded`. Migration additive.

---

## API Contract

```yaml
/api/admin/poi-acquisition/candidates/{id}:
  patch: { name?, address?, phone?, website?, description?, category_id?, subcategory_id? }
    200: { data: candidate }   400: VALIDATION_ERROR | SUBCATEGORY_CATEGORY_MISMATCH | INVALID_CATEGORY
    409: CANDIDATE_NOT_REVIEWABLE
/api/admin/poi-acquisition/candidates/{id}/exclude:
  post: {}   200: { data: candidate }   409: CANDIDATE_NOT_REVIEWABLE
/api/admin/poi-acquisition/candidates/{id}/reject:   # existant, désormais mémorisé
/api/admin/poi-acquisition/memories:
  get: { city_id? }  200: { data: [{ id, kind, name, address, city, category, created_at }] }
/api/admin/poi-acquisition/memories/{id}:
  delete: 200: { data: { id } }   404: NOT_FOUND
```

---

## UI Behaviour

- Revue d'un run : ✏️ ouvre une fenêtre d'édition ; « Rejeter » inchangé visuellement ;
  🗑️ « Exclure » avec confirmation. Résumé des lieux écartés.
- Page Acquisition : section « Lieux exclus ou rejetés » (nom, adresse, ville,
  « Exclu » ou « Rejeté — catégorie », bouton « Réintégrer »).
- Recherche par nom : badges.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..04 | Édition (dont catégorie, regéocodage, contrôles) | unit + contract + integration |
| AC-02-01..03 | Rejet mémorisé par ville + catégorie, filtré à l'acquisition | unit + integration |
| AC-03-01..03 | Exclusion toutes catégories, masquée, réversible | unit + contract + integration |
| AC-04-01..02 | Résumé du run, badges de la recherche par nom | integration |

---

## Out of Scope

- Mémoire pour les candidats sans `google_place_id`.
- Rejet / exclusion en masse.
- Effacement physique des candidats (purge 018 BR-14 inchangée).

---

## Open Questions

Aucune.
