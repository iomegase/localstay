# Spec — 102 Randonnées candidates : compléter les données manquantes

## Metadata

```yaml
id: 102-trail-candidate-completion
title: "Randonnées à revoir : destination, tracé calculé, dénivelé, durée, photos et titre complet récupérés depuis Camptocamp, IGN, OpenRouteService et Wikimedia Commons"
status: approved
mvp: 1
owner: "Product Owner"
created_at: 2026-10-17
updated_at: 2026-10-17
depends_on:
  - 019-trails-acquisition
  - 101-poi-open-sources
bounded_context: trails-acquisition
implementation_gate: "PO 2026-10-17 : « j'ai 20 randos sur les Contamines non validées. Tout faire pour récupérer les données manquantes » (capture : Lac de l'Etape — géométrie et élévation manquantes, aucune photo)."
```

## Context

Aux Contamines-Montjoie, 30 randonnées attendent la revue. Les 8 proposées par Gemini n'ont ni tracé
ni dénivelé ; 13 itinéraires Camptocamp n'ont pas de tracé détaillé (souvent ni départ) ; aucune n'a
de photo. Camptocamp fournit pourtant, pour ces itinéraires, le point d'accès et la destination
(coordonnées), la longueur, le dénivelé et le titre complet (« Refuge de Tête Rousse : Depuis
Bionnassay » — l'import ne gardait que « Depuis Bionnassay »). L'IGN situe les lacs, cols et sommets
par leur nom ; OpenRouteService (profil `foot-hiking`, réseau de sentiers OSM) relie départ et
destination.

## Glossary refs
Randonnée candidate (`TrailCandidate`) ; Tracé ; Dénivelé positif ; Revue admin.

## User Stories

### US-01 — Compléter une randonnée à revoir
- **AC-01-01**: Given une randonnée candidate « à revoir » issue de Camptocamp, When on la complète, Then
  la fiche Camptocamp est relue : titre complet (préfixe de destination + titre, s'il manquait), départ
  (point d'accès) s'il manque, destination (premier lieu associé qui n'est pas un accès), longueur
  (`route_length`) et dénivelé (`height_diff_up`) s'ils manquent.
- **AC-01-02**: Given une randonnée issue de Gemini, Then sa destination est cherchée à l'IGN
  (Géoplateforme, index des lieux) par son titre : nom identique (sans casse ni accents), à 15 km au
  plus du départ.
- **AC-01-03**: Sans tracé, avec un départ et une destination, le tracé est calculé par
  OpenRouteService (`foot-hiking`, rattachement aux sentiers jusqu'à 1 km) du départ à la destination ;
  il est enregistré avec `geometry_status = needs_review` (tracé indicatif, publication par « Publier
  incomplet ») et la source « openrouteservice.org — © contributeurs OpenStreetMap ».
- **AC-01-04**: Distance absente : aller-retour = 2 × la longueur du tracé calculé (`loop_type =
  out_and_back` s'il est vide). Dénivelé absent : profil IGN du tracé (montée). Durée absente :
  ORS / Naismith (existant).
- **AC-01-05**: Sans photo : Geotrek, office de tourisme, Camptocamp (existant), puis Wikimedia Commons
  (spec 101 : licences libres, nom de la destination ou du titre, crédits auteur + licence).
- **AC-01-06**: Les valeurs déjà présentes ne sont jamais écrasées (sauf le titre complété, AC-01-01).
- **AC-01-07**: Le rapport donne le temps de route (Mapbox, spec 100) du centre de la ville au départ ;
  au-delà de 45 min, la randonnée est signalée « hors zone » ; ce signalement ne la rejette pas
  (elle est complétée comme les autres, la revue décide).
- **AC-01-08**: Une boucle (`loop_type = loop`, ou titre contenant « tour », « boucle », « circuit ») n'a
  pas de tracé calculé : un aller-retour vers un point ne la représente pas.
- **AC-01-09**: Un tracé calculé dont l'aller dépasse la distance annoncée par la source est écarté ;
  la durée d'un tracé calculé vient de Naismith sur la distance aller-retour et le dénivelé.

### US-02 — Lancer la complétion
- **AC-02-01**: `scripts/complete-trail-candidates.ts --city <slug>` liste, pour chaque randonnée à
  revoir, ce qui serait complété ; rien n'est écrit sans `--apply`.

## Business Rules
- **BR-01**: Données géographiques issues de Camptocamp, IGN, OpenRouteService / OpenStreetMap
  uniquement ; jamais de Gemini (ADR-006).
- **BR-02**: Chaque donnée ajoutée garde sa source dans `source_refs` (`used_for`).
- **BR-03**: Les randonnées publiées, rejetées ou supprimées ne sont pas touchées.

## Data Model
Aucun changement (champs existants de `TrailCandidate`).

## API Contract
Aucune nouvelle route.

## UI Behaviour
Inchangée : la revue affiche les nouvelles valeurs ; un tracé calculé reste « à vérifier ».

## Acceptance Criteria
AC-01-01 à AC-02-01 (dont AC-01-08, AC-01-09), BR-01 à BR-03.

## Out of Scope
Bouton de complétion dans l'admin ; tracé en boucle calculé ; rejet automatique des randonnées hors zone.

## Open Questions
Aucune.
