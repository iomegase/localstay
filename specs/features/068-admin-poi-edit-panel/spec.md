# Spec — 068 Édition des POI dans un panneau latéral

## Metadata

```yaml
id: 068-admin-poi-edit-panel
title: "Modifier un POI depuis la liste admin sans changer de page"
status: approved
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
implementation_gate: "Spec approuvée par le PO le 2026-10-06 (« ok parfait » : OQ-01 oui, OQ-02 oui, OQ-03 s'arrêter)."
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
- **AC-04-02**: Given le dernier POI de la page, When le panneau s'affiche, Then
  « Suivant » est désactivé ; aucune navigation inter-pages (OQ-03).
- **AC-04-03**: Given le panneau, When l'admin utilise Alt+← / Alt+→ hors d'un champ de
  saisie, Then il passe au POI précédent / suivant (avec AC-02-02 si non enregistré).

### US-05 — Créer un POI dans le panneau (OQ-01)

#### Acceptance Criteria

- **AC-05-01**: Given la liste, When l'admin clique sur « Créer POI », Then le
  formulaire de création actuel (`/admin/pois/new`, ville pré-remplie depuis le
  filtre) s'ouvre dans le panneau ; chargement direct = pleine page.
- **AC-05-02**: Given une création réussie, When le POI est créé, Then le panneau
  affiche la fiche d'édition du nouveau POI et la liste se met à jour.

### US-06 — Publier depuis la liste (OQ-02)

#### Acceptance Criteria

- **AC-06-01**: Given une ligne de la liste, When elle s'affiche, Then un interrupteur
  « Publié sur Découvrir » reflète `discovery_status`.
- **AC-06-02**: Given l'interrupteur, When l'admin le bascule, Then la route de
  publication existante est appelée ; en cas de succès la ligne se met à jour.
- **AC-06-03**: Given une fiche incomplète, When la publication est refusée (409),
  Then l'interrupteur revient à son état et le motif s'affiche sur la ligne
  (critères manquants).

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
| AC-05-01 | « Créer POI » dans le panneau | integration |
| AC-05-02 | Après création : fiche du nouveau POI + liste à jour | integration |
| AC-06-01 | Interrupteur de publication par ligne | integration |
| AC-06-02 | Bascule → route de publication, ligne à jour | integration |
| AC-06-03 | Refus 409 → retour d'état + motif | integration |
| AC-07-01 | Actions en icônes seules, accessibles | integration |
| AC-07-02 | Interrupteur « POI actif » (désactiver / réactiver) | integration |
| AC-07-03 | « Éditer » en icône œil | integration |

---

## Amendements

- **2026-10-06 (implémentation)** — La liste `/admin/pois` est désormais triée par nom
  puis identifiant (au lieu de la date de modification décroissante). Sans cet ordre
  stable, un POI enregistré remontait en tête de liste, ce qui cassait AC-02-01
  (même position) et AC-04-01 (Précédent / Suivant).

- **2026-10-06 (Product Owner)** — Actions de ligne et de fiche plus sobres :
  - **AC-07-01** : « Enrichir photos », « Effacer » et « Restaurer » sont des boutons
    icône seuls (sans texte visible), avec `aria-label` et info-bulle.
  - **AC-07-02** : « Désactiver » devient un interrupteur « POI actif » : le
    décocher désactive le POI (route `disable` existante, après confirmation),
    le cocher le réactive (`PATCH is_active: true`). Masqué pour un POI effacé.
  - **AC-07-03** : « Éditer » est remplacé par une icône œil (`aria-label`
    « Éditer »), même lien que précédemment.

---

## Out of Scope

- Cadre de l'admin, navigation latérale et accueil (spec 067).
- Édition en ligne directement dans le tableau (cellules modifiables).
- Modifications en masse (plusieurs POI à la fois).
- Refonte du contenu du formulaire (champs, validations).
- Revue des candidats d'acquisition (spec 018/066).

---

## Open Questions

- **OQ-01** — `resolved` 2026-10-06 — « Créer un POI » s'ouvre dans le panneau (US-05).
- **OQ-02** — `resolved` 2026-10-06 — Interrupteur « Publié sur Découvrir » par ligne (US-06).
- **OQ-03** — `resolved` 2026-10-06 — « Suivant » s'arrête au dernier POI de la page.
