# Spec — 077 Espace propriétaire : logements et guide simplifiés

## Metadata

```yaml
id: 077-owner-lodgings-guide-ui
title: "Refonte UI de /dashboard/lodgings et de l'édition du guide ; retrait du message d'accueil et des bacs à poubelles"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 010-dashboard-owner
  - 013-guide-customization
  - 054-private-guide-stay
bounded_context: dashboard-owner
implementation_gate: "PO 2026-10-06 : refonte UI /dashboard/lodgings (« Personnaliser » → « Guide », « Vitrine » → « Logement ») ; message d'accueil plus utilisé (module et route effacés) ; poubelles : seule la localisation est conservée ; refonte UI de la page guide."
```

---

## Context

La liste des logements aligne cinq boutons textuels par ligne. La page « Personnaliser »
empile des sections sans repère, dont deux sont obsolètes : le **message d'accueil**
(n'est plus affiché aux voyageurs) et les **bacs à poubelles** (jaune, verte, bordeaux,
marron, bleue). Seule la localisation du point de tri reste utile.

---

## User Stories

### US-01 — Liste des logements

- **AC-01-01**: Given /dashboard/lodgings, When elle s'affiche, Then chaque logement est une
  carte (nom, ville, statut actif/inactif, QR généré/manquant, nombre de scans) avec les
  actions principales « Guide » (`/customize`), « Logement » (`/showcase`), « QR code », et
  les actions secondaires « Modifier » et « Désactiver » en icônes avec libellé accessible.
- **AC-01-02**: Given un logement désactivé, When il s'affiche, Then il est signalé et
  « Désactiver » est indisponible.

### US-02 — Message d'accueil retiré

- **AC-02-01**: Given l'édition du guide, When elle s'affiche, Then il n'y a plus de section
  « Message d'accueil ».
- **AC-02-02**: Given l'API de personnalisation, When un `welcome_message` est envoyé, Then il
  est ignoré (non validé, non enregistré, non renvoyé).
- **AC-02-03**: Given le guide voyageur (privé, ancien guide en séjour, traductions), When il
  s'affiche, Then le message d'accueil n'est plus lu ni affiché (accroche : « Bienvenue à
  <ville> »).

### US-03 — Poubelles : localisation seule

- **AC-03-01**: Given l'édition du guide, When elle s'affiche, Then seul le champ
  « Point de tri (adresse ou lien Google Maps) » subsiste ; les bacs disparaissent.
- **AC-03-02**: Given l'API, When `trash_bins` ou `trash_info` sont envoyés, Then ils sont
  ignorés.
- **AC-03-03**: Given le guide voyageur, When la section départ s'affiche, Then seul le lien
  « Voir le point de tri » est proposé si une localisation existe.

### US-04 — Page Guide

- **AC-04-01**: Given /dashboard/lodgings/<id>/customize, When elle s'affiche, Then le titre est
  « Guide » et les contenus sont regroupés en sections numérotées avec un sommaire fixe
  (ancres) : Le logement (photo, vidéo, adresse), Arrivée (code boîte à clés, instructions),
  Sur place (Wi-Fi, point de tri, numéros utiles, blocs personnalisés), Recommandations
  (ordre des catégories, coups de cœur, autres villes).
- **AC-04-02**: Given une modification, When elle n'est pas enregistrée, Then la barre fixe
  indique « Modifications non enregistrées » ; sinon elle indique l'état enregistré. Quitter
  avec des modifications demande confirmation.
- **AC-04-03**: Given la page « Logement » (`/showcase`), When elle s'affiche, Then son
  surtitre est « Logement » (au lieu de « Vitrine publique »).

---

## Business Rules

- **BR-01**: Aucune donnée supprimée : les colonnes `welcome_message`, `trash_bins`,
  `trash_info` restent en base, inutilisées (aucune migration).
- **BR-02**: Les URL `/customize` et `/showcase` sont conservées (seuls les libellés changent).
- **BR-03**: Les autres règles de personnalisation (013/054/061) sont inchangées.

---

## Data Model

Aucun changement de schéma.

---

## API Contract

`PUT /api/dashboard/lodgings/{id}/customization` : champs `welcome_message`, `trash_bins`,
`trash_info` retirés du schéma (ignorés s'ils sont envoyés) et de la réponse.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..02 | Cartes logements, libellés Guide / Logement | integration |
| AC-02-01..03 | Message d'accueil retiré (UI, API, guide) | contract + unit + integration |
| AC-03-01..03 | Poubelles : localisation seule | contract + unit + integration |
| AC-04-01..03 | Page Guide en sections + sommaire, barre d'état, libellé Logement | integration |

---

## Out of Scope

- Renommer les URL `/customize` et `/showcase`.
- Supprimer les colonnes en base.

---

## Open Questions

Aucune.
