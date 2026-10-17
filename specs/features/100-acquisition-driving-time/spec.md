# Spec — 100 Acquisition des POI : lieux à plus de 20 min en voiture écartés

## Metadata

```yaml
id: 100-acquisition-driving-time
title: "Acquisition : un lieu proche à vol d'oiseau mais à plus de 20 min en voiture du centre de la ville est écarté avant traitement"
status: approved
mvp: 1
owner: "Product Owner"
created_at: 2026-10-17
updated_at: 2026-10-17
depends_on:
  - 066-acquisition-village-scope
  - 071-acquisition-review-actions
  - 057-guide-travel-times
bounded_context: poi-acquisition
implementation_gate: "PO 2026-10-17 : Cafés des Contamines-Montjoie → cafés de Bourg-Saint-Maurice (22,5 km à vol d'oiseau, ~1 h 40 par la route) ; option retenue B : « temps de trajet en voiture au-delà d'un seuil → rejeté » ; seuil ramené à 20 min (« even less, short it down to 20 mn »)."
```

## Context

La recherche Google couvre 30 km autour du centre de la ville (AGENTS §10). En montagne, un lieu
peut être à moins de 30 km à vol d'oiseau mais de l'autre côté d'un col (Bourg-Saint-Maurice pour
Les Contamines-Montjoie). Le filtre « autre village » (spec 066) ne l'écarte que si ce village est
une City active de MyStay. Ces lieux arrivent donc en revue et doivent être rejetés à la main.

## Glossary refs
Run d'acquisition ; Candidat ; City ; Zone principale / Aux alentours (AGENTS §10).

## User Stories

### US-01 — Écarter les lieux trop loin par la route
- **AC-01-01**: Given un run d'acquisition par catégorie, When les lieux Google sont retenus (après le
  filtre « autre village » et la mémoire de revue), Then le temps de trajet **en voiture** depuis le
  centre de la ville est calculé par Mapbox Matrix pour chaque lieu localisé ; un lieu à **plus de
  20 min** est écarté avant tout traitement payant et n'est pas enregistré comme candidat.
- **AC-01-02**: La page du run affiche « N lieu(x) à plus de 20 min en voiture » quand N > 0.
- **AC-01-03**: Un lieu sans itinéraire routier (refuge, restaurant d'altitude : durée nulle) ou sans
  position Google est conservé.
- **AC-01-04**: Si Mapbox est indisponible (erreur, délai dépassé, jeton absent), les lieux sont
  conservés et le run continue (avertissement d'une ligne dans les logs).

## Business Rules
- **BR-01**: Seuil : 20 min (1 200 s) de trajet en voiture, centre de la ville → lieu.
- **BR-02**: Temps de trajet issus de Mapbox uniquement (jamais de Gemini, ADR-006) ; appels groupés
  par 24 lieux (limite Matrix API).
- **BR-03**: Le choix explicite d'un lieu par son nom (spec 066 BR-05) n'est pas filtré.
- **BR-04**: Les zones par distance (≤ 15 km, 15–30 km, > 30 km) restent inchangées.

## Data Model

```prisma
model PoiAcquisitionRun {
  // … champs existants …
  skipped_too_far_by_road Int @default(0)
}
```

## API Contract
Aucune nouvelle route. Le détail d'un run (`AcquisitionRunDetail`) ajoute `skipped_too_far_by_road: number`.

## UI Behaviour
Page `/admin/poi-acquisition/runs/{id}` : ligne « N lieux à plus de 20 min en voiture » dans la liste
des lieux écartés.

## Acceptance Criteria
AC-01-01 à AC-01-04, BR-01 à BR-04.

## Out of Scope
Recalcul des candidats et POI existants ; seuil configurable ; recherche par nom (spec 066).

## Open Questions
Aucune.
