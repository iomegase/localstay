# Spec — 094 Sources des descriptions

## Metadata

```yaml
id: 094-description-sources
title: "Conserver et afficher les sources des descriptions générées (public + admin)"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-08
updated_at: 2026-10-08
depends_on:
  - 049-poi-description-assistance
  - 093-longer-descriptions
bounded_context: content-generation
implementation_gate: "PO 2026-10-08 : « il faut aussi indiquer les sources » ; choix : public + admin."
```

## Context

Les descriptions sont rédigées à partir de sources (site officiel, pages web trouvées par Gemini) que
l'assistant montre à l'admin puis oublie ; l'acquisition et les randonnées ne les gardent pas. Le
public ne sait pas d'où viennent les informations.

## User Stories

- **AC-01**: Given « Utiliser cette proposition » dans l'assistant de description, When l'admin
  enregistre la fiche, Then les sources de la proposition sont enregistrées avec la description.
- **AC-02**: Given un run d'acquisition POI, When la description d'un candidat est rédigée à partir du
  site officiel du lieu ou de la source officielle du run, Then ces pages sont ses sources ; elles
  sont visibles dans la revue et copiées sur le POI à la publication.
- **AC-03**: Given la description d'une randonnée rédigée par Gemini avec recherche web, When elle est
  enregistrée, Then les pages citées par Gemini sont ses sources, copiées sur le POI à la publication.
- **AC-04**: Given une fiche /decouvrir dont la description a des sources, When elle s'affiche, Then une
  ligne discrète « Sources : » suit la description, avec un lien par source (nouvel onglet,
  `rel="nofollow noopener noreferrer"`). Sans source, rien n'est affiché.
- **AC-05**: Given l'édition admin d'un POI, When l'admin consulte la description, Then la liste des
  sources est affichée sous le champ, chacune retirable ; elles sont enregistrées avec la fiche.

## Business Rules

- **BR-01**: Une source = `{ url, title }` ; URL http(s) uniquement, au plus 8 sources, sans doublon
  d'URL ; titre par défaut = nom de domaine.
- **BR-02**: Les liens de redirection temporaires de Google (`vertexaisearch.cloud.google.com/…`)
  dont le titre est un nom de domaine sont remplacés par `https://{domaine}` (lien durable).
- **BR-03**: Les descriptions et sources existantes ne sont pas recalculées ; une nouvelle proposition
  remplace les sources précédentes.

## Data Model

```prisma
model PointOfInterest          { description_sources Json? }  // [{ url, title }]
model PoiAcquisitionCandidate  { description_sources Json? }
model TrailCandidate           { description_sources Json? }
```

Migration additive.

## API Contract

- `PATCH /api/admin/pois/{id}` : `description_sources?: Array<{ url: string; title: string }> | null`.
- Détail public /decouvrir : `description_sources: Array<{ url, title }>` (vide si aucune).

## UI Behaviour

Voir AC-04 et AC-05.

## Acceptance Criteria

AC-01 à AC-05.

## Out of Scope

Sources des descriptions de logements ; citations dans le corps du texte ; recalcul des sources des
descriptions existantes.

## Open Questions

Aucune.
