# Spec — 093 Descriptions plus développées (120 à 300 mots)

## Metadata

```yaml
id: 093-longer-descriptions
title: "Descriptions générées plus développées : 120 à 300 mots, 300 mots au maximum"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-08
updated_at: 2026-10-08
depends_on:
  - 049-poi-description-assistance
  - 073-acquisition-google-types
  - ADR-006 (Gemini : découverte + rédaction de descriptions uniquement)
bounded_context: content-generation
implementation_gate: "PO 2026-10-08 : « développer un peu plus les descriptions avec une limite de 300 mots » ; périmètre : acquisition POI, bouton « Proposer une description », randonnées ; cible 120 à 300 mots."
```

## Context

Les descriptions générées font 2 à 5 phrases : trop courtes pour une fiche /decouvrir utile.

## User Stories

- **AC-01**: Given un run d'acquisition POI, When Gemini rédige la description d'un candidat, Then le
  texte vise 120 à 300 mots en 2 à 3 paragraphes, sans jamais dépasser 300 mots.
- **AC-02**: Given le bouton « Proposer une description » de l'édition admin d'un POI, When une
  proposition est générée, Then elle suit la même règle ; l'éditeur affiche « n / 300 mots » et refuse
  l'application au-delà de 300 mots.
- **AC-03**: Given une randonnée (description individuelle d'un sentier), When Gemini la rédige, Then
  même règle (la liste de découverte reste un résumé court).
- **AC-04**: Given un texte généré de plus de 300 mots, When il est reçu, Then il est coupé à la
  dernière phrase complète qui tient dans 300 mots (jamais au milieu d'une phrase).

## Business Rules

- **BR-01**: Si les sources fiables ne suffisent pas pour 120 mots, un texte plus court est préféré à du
  remplissage générique (règles existantes : aucun fait inventé, ni prix, horaires, GPS, distances).
- **BR-02**: Limite de stockage des descriptions portée à 2 500 caractères (300 mots en français).
- **BR-04** (révision PO 2026-10-08) : une description rédigée ou modifiée à la main dans l'admin (POI,
  candidats POI et randonnées) peut atteindre 5 000 caractères (markdown : titres, listes) ; compteur sous
  le champ et message « La description dépasse 5 000 caractères. » au lieu de « Invalid input ». Les textes
  générés restent limités à 300 mots.
- **BR-05** (révision PO 2026-10-08 : « proposer une description Markdown ») : les trois générateurs
  rédigent en Markdown — **gras** sur 2 à 4 éléments clés, 1 ou 2 intertitres « ## » au-delà de 150 mots,
  au plus une courte liste ; ni titre « # », ni tableau, lien ou emoji. Le compteur de mots ignore les
  marqueurs ; la coupe à 300 mots ne laisse pas d'intertitre orphelin. La meta description et le JSON-LD
  des POI reçoivent le texte sans Markdown.
- **BR-03**: Les descriptions existantes ne sont pas régénérées automatiquement.

## Data Model / API Contract

Aucun changement de schéma. Validation Zod `description` : 2 000 → 2 500 caractères (admin POI,
candidats d'acquisition POI et randonnées, assistance description).

## UI Behaviour

Compteur de mots dans l'assistant de description (AC-02).

## Acceptance Criteria

AC-01 à AC-04.

## Out of Scope

Régénération en masse des descriptions existantes ; descriptions des logements et de la découverte
d'établissements héritée (gemini-fetch).

## Open Questions

Aucune.
