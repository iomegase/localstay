# Spec — 068 Édition des POI dans un panneau latéral

## Metadata

```yaml
id: 068-admin-poi-edit-panel
title: "Modifier un POI depuis la liste admin sans changer de page"
status: review
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 022-admin-poi-management
  - 041-public-local-discovery
  - 065-discovery-taxonomy-layout
bounded_context: admin-ui
amends:
  - "022 UI Behaviour /admin/pois et /admin/pois/{id} (navigation)"
implementation_gate: "Ne pas coder avant status: approved et réponse PO aux Open Questions."
```

---

## Context

Retour PO du 2026-10-06 : « c'est un enfer ». Pour modifier un POI dans
`/admin/pois?city_id=…&category_id=…&status=…`, l'admin quitte la liste pour
`/admin/pois/{id}`, puis revient par « Retour aux POI », qui ne conserve que
`city_id` : la recherche, la catégorie et les filtres de statut sont perdus. Corriger
dix fiches à la suite impose vingt changements de page et autant de reconstitutions de
filtres.

La fiche contient : formulaire `AdminPoiEditForm` (Identité publique, Classification
& Localisation, Tags, Médias & Photos, Données randonnée, Tracé), carte de publication
`AdminPoiDiscoveryCard`, actions de statut `AdminPoiStatusActions`.

Le projet utilise déjà les routes interceptées Next.js pour ouvrir une fiche en modale
(`src/app/(public)/guide/[city-slug]/[category-slug]/@modal/(.)[poi-slug]`).

Hors périmètre ici : le cadre général de l'admin (spec 067).

---

## Glossary References

- **Liste POI** — `/admin/pois` avec ses filtres d'URL.
- **Panneau** — tiroir latéral (Sheet) ouvert par-dessus la liste.
- **Fiche POI** — contenu d'édition actuel de `/admin/pois/{id}`.

---

## User Stories

### US-01 — Ouvrir un POI dans un panneau, sans quitter la liste

**As a** Admin

**I want to** cliquer sur un POI de la liste et le modifier dans un panneau latéral

**So that** je garde ma liste et mes filtres sous les yeux

#### Acceptance Criteria

- **AC-01-01**: Given la liste filtrée, When l'admin clique sur « Modifier » ou sur le
  nom d'un POI, Then un panneau latéral s'ouvre par-dessus la liste avec la fiche
  complète (formulaire, publication, statut), sans rechargement de la page.
- **AC-01-02**: Given le panneau ouvert, When l'URL s'affiche, Then elle vaut
  `/admin/pois/{id}` suivie des filtres de la liste ; la copier et l'ouvrir dans un
  nouvel onglet affiche la fiche en pleine page (comportement actuel conservé).
- **AC-01-03**: Given un écran ≥ 1024 px, When le panneau est ouvert, Then il occupe
  au plus 760 px à droite et la liste reste visible derrière un voile ; sur mobile
  (375 px), il occupe tout l'écran.
- **AC-01-04**: Given le panneau, When il s'affiche, Then un en-tête fixe montre le
  nom, la ville, la catégorie, le statut, le statut Découvrir, « Voir public » et les
  actions de statut ; des onglets d'ancre (Identité · Lieu · Photos · Publication ·
  Randonnée si applicable) mènent aux sections d'un formulaire unique.

### US-02 — Fermer et revenir exactement à la liste

#### Acceptance Criteria

- **AC-02-01**: Given le panneau ouvert, When l'admin appuie sur Échap, clique sur la
  croix ou sur le voile, Then le panneau se ferme et la liste réapparaît avec les
  mêmes filtres, la même page et la même position de défilement.
- **AC-02-02**: Given des modifications non enregistrées, When l'admin ferme le
  panneau ou passe à un autre POI, Then une confirmation « Abandonner les
  modifications ? » est demandée.
- **AC-02-03**: Given la fiche en pleine page, When l'admin clique sur « Retour aux
  POI », Then il retrouve tous les filtres présents dans l'URL (pas seulement la ville).

### US-03 — Enregistrer sans quitter le panneau

#### Acceptance Criteria

- **AC-03-01**: Given une modification, When l'admin enregistre, Then le panneau reste
  ouvert, un message « Modifications enregistrées » s'affiche, et la ligne
  correspondante de la liste se met à jour (nom, catégorie, statuts, badge
  « Sans photo ») sans perdre filtres ni position.
- **AC-03-02**: Given une erreur de validation ou d'API, When l'enregistrement échoue,
  Then le message d'erreur s'affiche dans le panneau et rien n'est perdu.
- **AC-03-03**: Given une publication ou une action de statut dans le panneau, When
  elle réussit, Then la liste se met à jour de la même façon.

### US-04 — Passer au POI suivant ou précédent

#### Acceptance Criteria

- **AC-04-01**: Given le panneau ouvert depuis la liste, When il s'affiche, Then il
  indique la position (« 3 / 25 ») dans la page courante de la liste filtrée et
  propose « Précédent » / « Suivant ».
- **AC-04-02**: Given « Suivant » sur le dernier POI de la page, When il est
  désactivé, Then aucune navigation inter-pages n'est faite (OQ-03).
- **AC-04-03**: Given le panneau, When l'admin utilise Alt+← / Alt+→ hors d'un champ de
  saisie, Then il passe au POI précédent / suivant (avec AC-02-02 si non enregistré).

---

## Business Rules

- **BR-01**: Aucune règle métier de la fiche ne change : mêmes validations, mêmes
  routes API, même éligibilité Découvrir (041/065), même verrouillage randonnée et
  revendication (022). Seule la navigation change.
- **BR-02**: La fiche pleine page `/admin/pois/{id}` reste disponible (lien direct,
  rechargement, ouverture dans un nouvel onglet).
- **BR-03**: Les filtres de la liste sont portés par l'URL ; ouvrir, fermer ou
  naviguer entre POI ne les modifie jamais.
- **BR-04**: Le panneau est accessible : focus piégé, retour du focus sur la ligne
  d'origine à la fermeture, titre annoncé, fermeture au clavier.
- **BR-05**: Aucune modification du schéma de base de données ni des routes API.

---

## Data Model

Aucun changement.

---

## API Contract

Aucune nouvelle route. Les routes existantes de la spec 022 sont réutilisées
(`PATCH /api/admin/pois/{id}`, publication Découvrir, actions de statut).

---

## UI Behaviour

- Route interceptée `src/app/admin/pois/@panel/(.)[id]/page.tsx` + slot `@panel` dans
  le layout de `/admin/pois` ; `src/app/admin/pois/[id]/page.tsx` reste la pleine page.
- Composant `Sheet` (Radix Dialog, déjà présent via `dialog.tsx`) côté droit.
- Le contenu de la fiche est extrait dans un composant partagé utilisé par la pleine
  page et le panneau (aucune duplication du formulaire).
- Liste : bouton « Modifier » et nom cliquables ; la ligne ouverte est surlignée.
- Shadcn/ui, Lucide, Tailwind ; mobile-first.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01 | Clic → panneau avec fiche complète, sans rechargement | integration |
| AC-01-02 | URL partageable, pleine page sur chargement direct | integration + e2e |
| AC-01-03 | Largeur desktop / plein écran mobile | integration |
| AC-01-04 | En-tête fixe + onglets d'ancre | integration |
| AC-02-01 | Fermeture → liste, filtres et défilement intacts | e2e |
| AC-02-02 | Confirmation si modifications non enregistrées | integration |
| AC-02-03 | « Retour aux POI » conserve tous les filtres | unit |
| AC-03-01 | Enregistrer : panneau ouvert, message, ligne mise à jour | integration |
| AC-03-02 | Erreur affichée dans le panneau | integration |
| AC-03-03 | Publication / statut mettent à jour la liste | integration |
| AC-04-01 | Position et Précédent / Suivant | integration |
| AC-04-02 | Pas de navigation inter-pages | unit |
| AC-04-03 | Raccourcis Alt+← / Alt+→ | integration |

---

## Out of Scope

- Cadre de l'admin, navigation latérale et accueil (spec 067).
- Édition en ligne directement dans le tableau (cellules modifiables).
- Modifications en masse (plusieurs POI à la fois).
- Refonte du contenu du formulaire (champs, validations).
- Revue des candidats d'acquisition (spec 018/066).

---

## Open Questions

- **OQ-01** — `pending` — « Créer un POI » s'ouvre-t-il aussi dans le panneau
  (recommandé : oui, même mécanisme) ou reste-t-il une page ?
- **OQ-02** — `pending` — Ajouter dans la liste un interrupteur « Publié sur
  Découvrir » par ligne, pour publier/dépublier sans ouvrir le panneau ?
  (recommandé : oui, c'est l'action la plus fréquente ; refusé avec le motif si la
  fiche est incomplète)
- **OQ-03** — `pending` — « Suivant » sur le dernier POI de la page : s'arrêter
  (recommandé, simple) ou charger la page suivante de la liste ?
