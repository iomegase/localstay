# ADR-001 — Choix de Mapbox vs Leaflet + OpenStreetMap

## Statut

`accepted`

---

## Contexte

L'application nécessite une carte interactive affichant des POI, des clusters de markers, une mini-carte statique dans les fiches, et potentiellement des tracés GPX pour les randonnées. Le rendu doit être optimal sur mobile. La solution doit être viable commercialement à l'échelle.

---

## Décision

**Mapbox GL JS** est retenu comme solution cartographique principale.
Les mini-cartes de fiches POI utilisent **Mapbox Static Images API** (pas de Map Load).

---

## Options considérées

### Option A — Mapbox GL JS
- ✅ Rendu WebGL haute qualité, fluide sur mobile
- ✅ 50 000 Map Loads/mois gratuits
- ✅ Clustering natif, styles personnalisables
- ✅ Static Images API pour mini-cartes sans Map Load
- ✅ SLA et support commercial disponibles
- ❌ Payant au-delà de 50k loads/mois (5$/1000)
- ❌ Token exposé côté client (à restreindre par domaine)

### Option B — Leaflet + OpenStreetMap (tuiles publiques)
- ✅ Open source, gratuit
- ✅ Large écosystème de plugins
- ❌ Tuiles OSM publiques non recommandées pour usage commercial scalable (pas de SLA)
- ❌ Risque de blocage si usage jugé trop important (OSM Foundation)
- ❌ Qualité de rendu inférieure à Mapbox sur mobile

### Option C — Leaflet + Tuiles payantes (Stadia, Thunderforest)
- ✅ Open source côté Leaflet
- ✅ Tuiles avec SLA
- ❌ Combinaison moins intégrée que Mapbox
- ❌ Clustering moins performant

---

## Justification

À 100 consultations/jour, le volume reste sous les 3 000 loads/mois → 0€ Mapbox.
La qualité de rendu et l'intégration native du clustering et des Static Images sont déterminantes pour l'UX mobile. L'option OSM publique est exclue pour des raisons commerciales.

---

## Conséquences

- Le token `NEXT_PUBLIC_MAPBOX_TOKEN` doit être restreint aux domaines autorisés dans le dashboard Mapbox
- Mettre en place un suivi mensuel des Map Loads (alerte à 40 000/mois)
- Les mini-cartes utilisent Static Images API → pas comptabilisées en Map Loads
- Lazy loading obligatoire pour la carte plein écran (Intersection Observer)

---

## Date

2026-05-20

## Auteur

Product Owner
