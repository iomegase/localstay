# Spec — 025 Weather

## Metadata

```yaml
id: 025-weather
title: "Page météo du guide ville"
status: approved
mvp: 1
owner: "Product Owner"
created_at: 2026-06-07
updated_at: 2026-06-07
depends_on: [001-city-guide]
```

---

## Context

Le Tourist doit pouvoir consulter la météo locale depuis le Guide d'une City sans polluer les cards POI. La météo est une page dédiée du guide ville, utile pour préparer la journée et les prochaines sorties. La première version reprend fidèlement le design mobile fourni le 2026-06-07 : interface très épurée, fond clair, grande icône météo monochrome, température centrale et prévisions horaires compactes.

---

## Glossary References

- **City** : ville ou commune référencée dans l'application
- **Guide** : ensemble des contenus affichés pour une City
- **Tourist** : utilisateur final sans compte

---

## User Stories

### US-01 — Consulter la météo d'une ville

**As a** Tourist  
**I want to** ouvrir une page météo dans le Guide ville  
**So that** je prépare ma journée sans quitter MyStay

#### Acceptance Criteria

- **AC-01-01**: Given une City active avec coordonnées, When le Tourist ouvre `/guide/[city-slug]/meteo`, Then la page affiche la date, l'heure locale, le nom de la City, la condition météo, la température actuelle et une grande icône météo monochrome.
- **AC-01-02**: Given Open-Meteo retourne des prévisions horaires, When la page s'affiche, Then les 24 prochaines heures sont affichées dans une ligne horizontale scrollable avec heure, icône et température.
- **AC-01-03**: Given Open-Meteo retourne des prévisions journalières, When la page s'affiche, Then les 7 prochains jours sont disponibles dans l'onglet `7 jours` sous forme de lignes compactes avec jour, condition, température min/max et pluie probable.
- **AC-01-04**: Given la City n'existe pas, est inactive ou soft-deleted, When la route météo est appelée, Then Next.js retourne 404.
- **AC-01-05**: Given Open-Meteo est indisponible ou retourne une réponse invalide, When la page s'affiche, Then un état d'erreur lisible est affiché sans casser le layout public.

### US-02 — Accéder à la météo depuis la navigation publique

**As a** Tourist  
**I want to** trouver la page météo depuis le menu public  
**So that** je puisse y revenir facilement depuis le Guide

#### Acceptance Criteria

- **AC-02-01**: Given le menu public connaît un `citySlug`, When il s'affiche, Then il contient un lien `Météo` vers `/guide/[citySlug]/meteo`.
- **AC-02-02**: Given la home Guide ville s'affiche, When le Tourist voit le bloc météo, Then ce bloc pointe vers `/guide/[citySlug]/meteo`.

---

## Business Rules

- **BR-01**: La météo est calculée uniquement depuis les coordonnées de la City (`latitude`, `longitude`), jamais depuis les coordonnées d'un POI.
- **BR-02**: Les pages POI et cards POI n'affichent pas la météo.
- **BR-03**: Open-Meteo est appelé côté serveur uniquement depuis une query dédiée.
- **BR-04**: Les réponses Open-Meteo sont validées avec Zod avant transformation.
- **BR-05**: Les prévisions météo sont mises en cache côté serveur pendant 30 minutes.
- **BR-06**: L'API Open-Meteo utilisée est `/v1/forecast` avec `current`, `hourly`, `daily`, `timezone=auto`, `forecast_days=7` et `forecast_hours=24`.
- **BR-07**: Aucun appel Gemini n'est autorisé pour la météo.

---

## Data Model

```prisma
// Aucun nouveau modèle Prisma.
// La météo est lue en temps quasi réel depuis Open-Meteo et cachée côté serveur.
```

---

## API Contract

```yaml
openapi: 3.1.0
info:
  title: Weather public route
  version: 1.0.0
paths: {}
```

La feature n'expose pas d'API publique MyStay. La route Next.js serveur appelle directement Open-Meteo.

---

## UI Behaviour

### Page : `/guide/[city-slug]/meteo`

- Layout mobile-first, surface météo `w-full h-screen` dans le layout public, sans carte flottante ni wrapper centré.
- Copie fidèle du screenshot météo fourni :
  - heure locale courante en haut gauche ;
  - hamburger en haut droite via le menu public existant, aligné avec les autres pages publiques ;
  - navigation toujours placée en haut de la surface météo ;
  - date centrée ;
  - nom de ville centré en grand ;
  - condition météo sous la ville ;
  - grande icône météo monochrome gris foncé avec ombre diagonale claire ;
  - famille d'icônes SVG animées pour soleil, peu nuageux, nuage, pluie, neige, brouillard, vent, orage et tempête ;
  - température actuelle sous l'icône ;
  - contenu météo principal centré verticalement entre la navigation et les prévisions ;
  - onglets `Aujourd'hui`, `24h`, `7 jours` ;
  - prévisions horaires en ligne horizontale en bas de l'écran ;
  - prévisions 7 jours visibles sans scroll quand l'onglet `7 jours` est actif.
- Palette très claire : fond `#f7f7fb`, texte gris, accents discrets.
- La page ne crée pas de carte, pas de géolocalisation navigateur, pas de météo POI.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Page météo affiche ville, date/heure, condition, température et grande icône | integration |
| AC-01-02 | Prévisions 24h en ligne horizontale | integration |
| AC-01-03 | Prévisions 7 jours disponibles | integration |
| AC-01-04 | City absente/inactive → 404 | integration |
| AC-01-05 | Erreur Open-Meteo → état d'erreur lisible | unit |
| AC-02-01 | Menu public contient lien météo quand `citySlug` existe | unit |
| AC-02-02 | Home Guide ville contient un accès vers la page météo | integration |
| BR-03/04/05/06 | Query serveur Open-Meteo validée, cachée 30 minutes, paramètres conformes | unit |

---

## Out of Scope

- Météo sur les POI ou les POI cards
- Géolocalisation météo depuis la position du Tourist
- Alertes météo push
- Météo montagne spécialisée, avalanche, webcam, enneigement station
- API publique MyStay dédiée à la météo

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | Le design doit-il être une inspiration ou une copie fidèle du screenshot ? | Product Owner | 2026-06-07 | Copie fidèle du screenshot, adaptée en français et aux données de la City. |
