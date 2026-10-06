# Spec — 076 Admin Landing pages : refonte de l'interface

## Metadata

```yaml
id: 076-admin-landing-pages-ui
title: "Refonte UI de /admin/landing-pages : liste claire + page d'édition par ville"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 046-local-seo-city-cluster
  - 047-admin-local-landing-reviews
  - 048-admin-local-landing-management
bounded_context: local-seo
implementation_gate: "PO 2026-10-06 : « refonte UI … c'est une horreur à utiliser » ; option « Page dédiée par ville » choisie."
```

---

## Context

L'écran actuel (048) mélange tout sur une page : tableau des villes, éditeur ouvert
sous la ligne (accordéon de 15 champs bruts sans regroupement), bouton d'enregistrement
en bas d'un très long formulaire, et un bloc d'avis collé sous le tableau pour une ville
choisie implicitement. Aucun indicateur de modifications non enregistrées, aucun lien vers
la page publique, des champs sans rapport avec la page (ex. « Texte sans logement » sur la
conciergerie) et des champs invalides non signalés.

Aucune règle métier ni contrat d'API ne change : seule l'interface admin est refaite.

---

## User Stories

### US-01 — Liste des villes

- **AC-01-01**: Given /admin/landing-pages, When elle s'affiche, Then chaque ville montre ses
  trois pages sous forme de pastilles (Publiée / Non publiée / Aucun logement), son nombre
  d'avis, l'interrupteur d'activation et les actions « Modifier » (lien vers la page de la
  ville) et « Supprimer » (confirmation inchangée).
- **AC-01-02**: Given une pastille, When on clique dessus, Then la page d'édition de la ville
  s'ouvre sur l'onglet de cette page.
- **AC-01-03**: Given « Ajouter une ville » (en tête de page), When une ville est créée, Then
  l'admin est redirigé vers sa page d'édition.

### US-02 — Page d'édition par ville `/admin/landing-pages/<ville>`

- **AC-02-01**: Given la page d'une ville, When elle s'affiche, Then elle propose un retour à
  la liste, l'interrupteur d'activation et des onglets « Conciergerie », « Séminaires »,
  « Locations de vacances », « Avis (N) » ; l'onglet est conservé dans l'URL (`?onglet=`).
- **AC-02-02**: Given un onglet de page, When il s'affiche, Then les champs sont regroupés en
  blocs suivant la page publique : Référencement, Bandeau, Section principale (+ points
  forts), Étapes, Ancrage local, Appel à l'action, Sans logement (Locations de vacances
  uniquement), FAQ.
- **AC-02-03**: Given le bloc Référencement, When l'admin saisit, Then un compteur de
  caractères (recommandé : titre ≤ 60, description ≤ 160) et un aperçu du résultat Google
  (URL publique, titre, description) se mettent à jour.
- **AC-02-04**: Given une page, When l'admin clique « Voir la page », Then la page publique
  s'ouvre dans un nouvel onglet.
- **AC-02-05**: Given des contenus invalides ou incomplets (issues de validation existantes),
  When la page s'affiche, Then chaque champ concerné porte « À compléter » et l'onglet
  affiche le nombre de champs à compléter.
- **AC-02-06**: Given une modification, When elle n'est pas enregistrée, Then une barre fixe
  en bas indique « Modifications non enregistrées » avec « Annuler » et « Enregistrer » ;
  quitter la page demande confirmation.
- **AC-02-07**: Given l'onglet Avis, When il s'affiche, Then il contient la gestion des avis
  de la ville (047, inchangée).

---

## Business Rules

- **BR-01**: Contrats d'API, validation, publication et suppression inchangés (046/047/048).
- **BR-02**: Les trois pages restent enregistrées ensemble (un seul `PATCH`).
- **BR-03**: Un champ masqué (ex. « Texte sans logement » hors Locations de vacances) conserve
  sa valeur.

---

## Data Model

Aucun changement.

---

## API Contract

Inchangé. Nouvelle requête serveur interne : destination admin par slug de ville.

---

## UI Behaviour

Shadcn/ui + Tailwind, mobile 375 px : onglets défilables, blocs empilés, barre fixe pleine
largeur.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..03 | Liste, pastilles, création → redirection | integration |
| AC-02-01..07 | Page ville, onglets, blocs, SEO, lien public, à compléter, barre fixe, avis | unit + integration |

---

## Out of Scope

- Réordonner points forts / étapes / FAQ.
- Aperçu complet de la page publique dans l'admin.
- Toute modification des pages publiques.

---

## Open Questions

Aucune.
