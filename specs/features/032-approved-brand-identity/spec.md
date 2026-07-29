# Spec — 032 Approved Brand Identity

## Metadata

```yaml
id: 032-approved-brand-identity
title: "Déploiement transversal du logo MyStay approuvé"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-07-29
updated_at: 2026-07-29
depends_on:
  - 009-auth-owner
  - 010-dashboard-owner
  - 016-dashboard-superadmin
  - 031-public-marketing-site
bounded_context: shared-ui
asset_reference: public/mystay-logo-approved
implementation_gate: "Choix explicite du Product Owner du 2026-07-29 : option globale recommandée"
```

## Context

Le kit de marque approuvé se trouve dans
`public/mystay-logo-approved`. Le frontend marketing et les favicons utilisent
déjà ces fichiers, mais l'authentification, les dashboards et certains headers
utilisent encore `/logo.png` ou une représentation de remplacement.

La marque doit être cohérente dans toutes les interfaces sans altérer leurs
dimensions, leurs routes, leur authentification ou leurs fonctions.

## Glossary References

Aucun nouveau terme métier. Cette spec concerne uniquement l'interface
partagée.

## User Stories

### US-01 — Reconnaître MyStay sur toutes les interfaces

**As a** utilisateur MyStay  
**I want to** retrouver le logo approuvé sur chaque surface  
**So that** l'identité de marque reste cohérente du site public aux dashboards

#### Acceptance Criteria

- **AC-01-01**: Given un fond clair suffisamment large, When le logo MyStay est
  rendu, Then la version horizontale couleur approuvée est utilisée sans
  déformation.
- **AC-01-02**: Given un fond sombre suffisamment large, When le logo MyStay
  est rendu, Then la version horizontale blanche approuvée est utilisée sans
  filtre CSS de recoloration.
- **AC-01-03**: Given un emplacement circulaire compact de dashboard, When la
  marque est rendue, Then le monogramme approuvé est utilisé à la place du logo
  horizontal.
- **AC-01-04**: Given le header du GuideApp, When il s'affiche en mode privé ou
  démonstration, Then le monogramme approuvé est affiché seul dans un format
  plus imposant, sans mot-symbole, tout en conservant la ville.
- **AC-01-05**: Given le code source actif, When les références de marque sont
  contrôlées, Then aucune occurrence active de `/logo.png` ne subsiste.
- **AC-01-06**: Given une largeur mobile ou desktop, When une surface concernée
  s'affiche, Then le changement de logo n'introduit aucun débordement
  horizontal ni déplacement structurel du layout.

## Business Rules

- **BR-01**: Les seuls assets autorisés proviennent de
  `public/mystay-logo-approved`.
- **BR-02**: Un composant partagé `MyStayLogo` centralise la résolution des
  variantes et utilise `next/image`.
- **BR-03**: Les formes autorisées sont `horizontal` et `mark`; les tons
  autorisés sont `standard` et `reversed`.
- **BR-04**: Les dimensions d'affichage sont fournies par les consommateurs en
  classes Tailwind ; le composant conserve le ratio intrinsèque des fichiers.
- **BR-05**: Aucun `filter`, `brightness`, `invert`, `zoom` ou
  `transform: scale()` n'est utilisé pour produire une variante de marque.
- **BR-06**: Les favicons déjà configurés dans `src/app/layout.tsx` restent
  inchangés.
- **BR-07**: Aucun comportement d'authentification, contrôle d'accès, route,
  donnée ou API n'est modifié.

## Data Model

Aucune modification Prisma ou base de données.

## API Contract

Aucune route API créée ou modifiée.

## UI Behaviour

- Le logo reste non interactif lorsqu'il l'était.
- Les liens d'accueil existants conservent leur destination et leur libellé
  accessible.
- Le header du GuideApp conserve son action de retour à l'accueil interne.
- Les variantes sémantiques sont choisies explicitement par chaque surface.

## Acceptance Criteria

| ID | Vérification |
|---|---|
| AC-01-01 | Test du logo horizontal standard sur surface claire |
| AC-01-02 | Test du logo horizontal inversé sur surface sombre |
| AC-01-03 | Test du monogramme dans les dashboards |
| AC-01-04 | Test du header GuideApp avec ville et monogramme approuvé |
| AC-01-05 | Test statique interdisant `/logo.png` dans le code actif |
| AC-01-06 | Test responsive et absence de débordement horizontal |

## Out of Scope

- Redessiner ou recolorer les fichiers approuvés.
- Modifier la taille des sidebars ou panneaux. Le header partagé du GuideApp
  peut atteindre 68 px pour équilibrer le monogramme approuvé.
- Modifier les avatars utilisateurs.
- Modifier les e-mails ou documents hors application.

## Open Questions

Aucune. Le Product Owner a validé l'approche globale recommandée.
