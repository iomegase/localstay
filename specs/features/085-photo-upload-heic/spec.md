# Spec — 085 Téléversement de photos fiable (smartphone, HEIC)

## Metadata

```yaml
id: 085-photo-upload-heic
title: "Accepter les photos de smartphone : format HEIC et fichiers lourds"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 012-practical-info
  - 028-lodging-showcase-seo
  - 077-owner-lodgings-guide-ui
bounded_context: shared
implementation_gate: "PO 2026-10-06 : « impossible d'uploader des photos, il faudrait aussi accepter le format HEIC »."
```

## Context

Les envois échouent pour les photos de smartphone : format HEIC (iPhone) refusé par le sélecteur
et le serveur ; fichiers de 4 à 8 Mo bloqués par la limite de requête Vercel (4,5 Mo) ou la
limite serveur (5 Mo), avec un message générique « Téléversement impossible ».

## User Stories

- **AC-01**: Given une photo HEIC/HEIF, When elle est choisie (Guide : couverture, étapes,
  blocs ; Logement : photos), Then elle est convertie en JPEG dans le navigateur puis envoyée.
- **AC-02**: Given une photo de plus de 2560 px ou de plus de 3,5 Mo, When elle est choisie,
  Then elle est réduite dans le navigateur (≤ 2560 px, JPEG qualité 0,85) avant l'envoi.
- **AC-03**: Given le sélecteur de fichiers, When il s'ouvre, Then les fichiers HEIC/HEIF sont
  sélectionnables.
- **AC-04**: Given un HEIC reçu tel quel par le serveur (navigateur sans conversion), When il
  est traité, Then il est décodé puis stocké en WebP comme les autres formats.
- **AC-05**: Given un échec, When il survient, Then le message est précis (format non pris en
  charge, photo trop lourde, conversion impossible).

## Business Rules

- **BR-01**: Stockage inchangé : WebP ≤ 2560 px (012 BR-26).
- **BR-02**: Les bibliothèques HEIC sont chargées à la demande (pas d'impact sur les pages
  sans envoi de photo).

## Data Model / API Contract

Aucun changement de schéma. Les routes d'envoi acceptent en plus `image/heic` et `image/heif`.

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01..03, AC-05 | Préparation côté navigateur, sélecteur, messages | unit + integration |
| AC-04 | HEIC décodé côté serveur | unit |

## Out of Scope

- Vidéos ; photos des commerçants et de l'admin blog (inchangées).

## Open Questions

Aucune.
