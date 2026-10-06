# Spec — 086 Fiche logement publique : FAQ et équipements

## Metadata

```yaml
id: 086-lodging-public-faq-amenities-ui
title: "FAQ sur 2 colonnes et équipements sur 2 à 3 colonnes sur la fiche logement publique"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 028-lodging-showcase-seo
  - 082-lodging-faq-library
bounded_context: lodging-showcase
implementation_gate: "PO 2026-10-06 : « refonte UI des FAQ sur 2 colonnes et refonte des amenities sur 2 ou 3 colonnes »."
```

## User Stories

- **AC-01**: Given la FAQ d'un logement, When l'écran est ≥ md, Then les questions sont réparties
  sur 2 colonnes (moitié gauche puis moitié droite, ordre conservé sur mobile en une colonne).
- **AC-02**: Given une réponse de FAQ en markdown (`**16 h**`), When elle s'ouvre, Then elle est
  mise en forme (gras, listes, liens), sans astérisques visibles.
- **AC-03**: Given les équipements et services, When l'écran est ≥ sm, Then ils s'affichent en
  cases sur 2 colonnes, 3 à partir de lg (1 colonne en mode compact).
- **AC-04**: Given un équipement du catalogue, When il s'affiche, Then il porte une icône dédiée
  (lave-vaisselle, climatisation, chauffage, ski, bébé, animaux, bien-être, cinéma, sport…),
  l'icône générique ne restant qu'en dernier recours.

## Business Rules / Data Model / API Contract

Aucun changement de données.

## Out of Scope

- Contenu de la FAQ ; autres sections de la fiche.

## Open Questions

Aucune.
