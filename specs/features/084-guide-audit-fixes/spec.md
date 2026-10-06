# Spec — 084 Audit du guide voyageur : corrections

## Metadata

```yaml
id: 084-guide-audit-fixes
title: "Photo de couverture, lisibilité de l'accueil et lien du point de tri dans le guide privé"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 034-private-guide-app
  - 077-owner-lodgings-guide-ui
  - 080-lodging-structured-address
bounded_context: guide-app
implementation_gate: "PO 2026-10-06 : « audit bien le guide stp et répare les erreurs » (point de tri, photo, étapes d'arrivée non pris en compte)."
```

## Context

Audit du 2026-10-06 sur « Le 305 » : aucune personnalisation n'était enregistrée (le serveur de
développement utilisait un client Prisma antérieur aux colonnes d'adresse de la spec 080 ;
résolu par un redémarrage). Le guide présentait en plus trois défauts d'affichage.

## User Stories

- **AC-01**: Given un logement sans photo dans la page Guide, When le guide s'affiche, Then la
  photo de couverture de la page Logement (sinon sa première photo) est utilisée avant l'image
  générique MyStay.
- **AC-02**: Given l'accueil du guide, When la photo est claire, Then le titre reste lisible
  (dégradé sombre en bas de l'image).
- **AC-03**: Given un point de tri contenant déjà un code postal ou la ville, When le voyageur
  ouvre « Voir le point de tri », Then la recherche Maps n'ajoute pas la ville une seconde fois.

## Business Rules

- **BR-01**: La photo de la page Guide reste prioritaire.

## Data Model / API Contract

Aucun changement.

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01 | Couverture : Guide > Logement > générique | unit |
| AC-02 | Dégradé de lisibilité | integration |
| AC-03 | Ville non dupliquée dans la recherche | unit |

## Out of Scope

- Refonte de l'accueil du guide.

## Open Questions

Aucune.
