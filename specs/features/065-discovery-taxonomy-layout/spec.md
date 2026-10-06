# Spec — 065 Découvrir : présentation par taxonomie et POI sans photo

## Metadata

```yaml
id: 065-discovery-taxonomy-layout
title: "Organiser /decouvrir selon la taxonomie admin et publier les POI sans photo"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 041-public-local-discovery
  - 022-admin-poi-management
bounded_context: public-discovery
amends:
  - "041 BR-04 (photo obligatoire), BR-05 (dépublication à la perte de photo)"
implementation_gate: "Spec approuvée par le PO le 2026-10-06 (« c'est parfait » ; OQ-01 Urgences masquée, OQ-02 3 cartes ; AC-02-05 retiré : « Aux alentours » inchangé)."
```

---

## Context

Constat PO du 2026-10-06 : sur `/decouvrir/{ville}/shopping`, un loueur de ski
apparaît au milieu d'une épicerie fine. Les pages publiques ignorent la taxonomie
construite dans Admin › Taxonomie :

- la page catégorie est une liste à plat triée par distance ; les sous-catégories
  sont calculées par la requête mais jamais affichées ;
- la page ville affiche une icône générique (`MapPinned`) au lieu de l'icône choisie
  pour la catégorie, puis toutes les adresses mélangées ;
- l'ordre (`sort_order`) n'est utilisé que pour les catégories.

Par ailleurs, la photo est obligatoire pour publier (041 BR-04), alors que le guide
dispose d'images de remplacement par type de lieu (`getPoiFallbackImage`,
`public/fallback/`). Au 2026-10-06 : 96 POI actifs, 21 publiés, **23 bloqués
uniquement par l'absence de photo** (descriptions de 184 à plus de 300 caractères).
La règle actuelle dépublie aussi automatiquement une fiche dont la dernière photo
devient un lien mort.

Décision PO du 2026-10-06 : publier sans photo avec garde-fous (option A) et
construire le menu de `/decouvrir` à partir de la taxonomie admin.

---

## Glossary References

- **Taxonomie** — `Category` (nom, slug, icône, `sort_order`, `is_active`) et
  `SubCategory` (nom, slug, `sort_order`, `is_active`), gérées dans Admin › Taxonomie.
- **POI publié** — `discovery_status = PUBLISHED` et éligible (spec 041).
- **Image de remplacement** — image `public/fallback/*` choisie par
  `getPoiFallbackImage(categorie, sous-categorie)`.
- **Zones** — principale (≤ 15 km) et « Aux alentours » (15–30 km), règle globale.

---

## User Stories

### US-01 — Une page ville organisée par la taxonomie

**As a** visiteur de `/decouvrir/{ville}`

**I want to** voir les catégories avec leur icône et des adresses regroupées par catégorie

**So that** je trouve rapidement le type de lieu qui m'intéresse

#### Acceptance Criteria

- **AC-01-01**: Given une ville avec des POI publiés, When la page s'affiche, Then
  chaque catégorie publique apparaît dans l'ordre `sort_order` de la taxonomie, avec
  l'icône Lucide configurée dans l'admin (`LUCIDE_ICON_COMPONENTS`), son nom et son
  nombre d'adresses. Icône inconnue → icône par défaut actuelle.
- **AC-01-02**: Given la carte d'une catégorie, When elle s'affiche, Then elle liste
  sous le nom les sous-catégories publiques de cette catégorie dans la ville
  (ordre `sort_order`, 3 au maximum, puis « … »).
- **AC-01-03**: Given la section « Nos adresses », When elle s'affiche, Then les
  adresses sont regroupées par catégorie (ordre `sort_order`), avec le titre de la
  catégorie, au plus 3 cartes par catégorie et un lien « Voir les N adresses » vers
  la page catégorie lorsqu'il y en a davantage.

### US-02 — Une page catégorie découpée par sous-catégorie

**As a** visiteur de `/decouvrir/{ville}/{categorie}`

**I want to** voir les adresses rangées par sous-catégorie, avec un menu pour y accéder

**So that** un loueur de ski n'est pas mélangé aux boutiques de produits régionaux

#### Acceptance Criteria

- **AC-02-01**: Given une catégorie dont les POI publiés de la ville relèvent d'au
  moins 2 groupes (sous-catégories, ou sous-catégorie + « sans sous-catégorie »),
  When la page s'affiche, Then une section par sous-catégorie apparaît dans l'ordre
  `sort_order`, avec le nom de la sous-catégorie en titre (`h2`) et une ancre égale à
  son slug (`#location-de-ski`).
- **AC-02-02**: Given ces sections, When la page s'affiche, Then un menu de pastilles
  en haut de page (un lien d'ancre par section, nom + nombre d'adresses) reste
  visible au défilement sur mobile et défile horizontalement s'il déborde.
- **AC-02-03**: Given des POI sans sous-catégorie, When la page est découpée, Then
  ils apparaissent dans une dernière section « Autres adresses ».
- **AC-02-04**: Given un seul groupe, When la page s'affiche, Then ni pastilles ni
  titres de section : la liste reste simple, comme aujourd'hui.
- **AC-02-05**: Given des POI de la zone « Aux alentours », When la page s'affiche,
  Then la section « Aux alentours » reste inchangée (spec 041 AC-02-03 : liste
  séparée, triée par distance, affichée seulement si non vide), sans regroupement.
- **AC-02-06**: Given une sous-catégorie ou une catégorie désactivée ou supprimée dans
  la taxonomie, When la page s'affiche, Then elle n'apparaît pas (comportement 041
  inchangé : ses POI ne sont pas publics).

### US-03 — Publier un POI sans photo

**As a** Admin

**I want to** publier un POI complet même sans photo

**So that** les bonnes adresses ne restent pas invisibles faute d'image

#### Acceptance Criteria

- **AC-03-01**: Given un POI remplissant toutes les conditions de 041 BR-04 sauf la
  photo, When sa description fait au moins 150 caractères après trim, Then il est
  éligible à la publication.
- **AC-03-02**: Given un POI sans photo exploitable dont la description fait moins de
  150 caractères, When l'admin tente de le publier, Then la publication est refusée
  avec le motif « description trop courte pour une fiche sans photo ».
- **AC-03-03**: Given un POI publié sans photo, When sa carte ou sa fiche s'affiche,
  Then l'image est `getPoiFallbackImage(categorie, sous-categorie)`, à défaut l'image
  MyStay par défaut, avec un texte alternatif neutre (« Illustration : {sous-catégorie
  ou catégorie} ») et sans crédit photo.
- **AC-03-04**: Given un POI publié sans photo, When ses métadonnées sont générées,
  Then le JSON-LD n'a pas de propriété `image` et `og:image` reprend l'image de
  partage par défaut du site, jamais l'image de remplacement.
- **AC-03-05**: Given un POI publié qui perd sa dernière photo exploitable, When sa
  description fait au moins 150 caractères, Then il reste publié (remplace la
  dépublication automatique de 041 BR-05 pour ce motif).
- **AC-03-06**: Given la liste Admin › POI, When un POI publié n'a pas de photo
  exploitable, Then il porte un badge « Sans photo ».

---

## Business Rules

- **BR-01**: La taxonomie admin est la seule source de l'ordre, des libellés et des
  icônes de `/decouvrir`. Aucun libellé ni ordre n'est codé en dur.
- **BR-02**: Une catégorie ou sous-catégorie n'apparaît dans le menu d'une ville que
  si elle contient au moins 1 POI publié dans cette ville (041 BR-06 inchangé).
- **BR-03**: Les pastilles sont des ancres internes à la page catégorie. Aucune
  nouvelle URL n'est créée et le sitemap est inchangé.
- **BR-04**: Éligibilité (amende 041 BR-04) : la condition « au moins une photo
  exploitable » devient « au moins une photo exploitable **ou** description ≥ 150
  caractères ». Toutes les autres conditions sont inchangées.
- **BR-05**: L'image de remplacement est décorative : jamais déclarée comme photo du
  lieu dans les données structurées ni dans `og:image`.
- **BR-06**: Aucune modification du schéma de base de données.
- **BR-07**: Gemini n'intervient pas (ADR-006).
- **BR-08**: La catégorie `urgences` est réservée au guide privé : ses POI ne sont
  jamais visibles sur `/decouvrir` (ville, catégorie, fiche, hub, sitemap), même
  publiés (décision PO OQ-01). Liste versionnée dans
  `src/features/public-discovery/lib/visibility.ts`.

---

## Data Model

Aucun changement. Champs utilisés : `Category.icon`, `Category.sort_order`,
`SubCategory.sort_order`, `SubCategory.name`, `SubCategory.slug`.

---

## API Contract

Pas de nouvelle route. Les DTO `DiscoveryCity` et `DiscoveryCategory` exposent en plus :

```yaml
DiscoveryCity.categories[]:
  icon: string               # déjà présent, désormais rendu
  subcategories: [{ slug, name, poi_count }]   # ordre sort_order
DiscoveryCategory:
  groups:                    # zone principale
    - subcategory: { slug, name } | null      # null = « Autres adresses »
      pois: DiscoveryPoiCard[]                # tri distance
  nearby_pois: DiscoveryPoiCard[]             # zone « Aux alentours », inchangée
DiscoveryPoiCard / DiscoveryPoi:
  photo_is_fallback: boolean
```

L'endpoint admin de publication garde son refus existant `409
DISCOVERY_PUBLICATION_INCOMPLETE` avec `details.missing: ["photo"]` ; dans l'admin, le
critère « photo » est libellé « Photo exploitable, ou description d'au moins 150
caractères » (implémentation 2026-10-06, au lieu d'un nouveau code d'erreur).

---

## UI Behaviour

- Page ville : grille des catégories (icône taxonomie, nom, nombre, sous-catégories),
  puis « Nos adresses » regroupées par catégorie (3 cartes + lien).
- Page catégorie : en-tête inchangé ; barre de pastilles collante sous l'en-tête
  (mobile : défilement horizontal, 16 px de marge) ; sections avec titre ; « Autres
  adresses » en dernier ; « Aux alentours » inchangé.
- Carte et fiche sans photo : image de remplacement en `object-cover`, sans crédit.
- Style : composants marketing existants (`MarketingShell`, `MarketingEyebrow`,
  `DiscoveryPoiCard`) ; pas de maquette dédiée.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01 | Catégories ville : ordre + icône taxonomie | integration |
| AC-01-02 | Sous-catégories listées sur la carte catégorie | integration |
| AC-01-03 | « Nos adresses » regroupées par catégorie, 3 + lien | integration |
| AC-02-01 | Sections par sous-catégorie, ordre, ancre | unit + integration |
| AC-02-02 | Pastilles d'ancre collantes | integration |
| AC-02-03 | Section « Autres adresses » | unit |
| AC-02-04 | Un seul groupe : liste simple | integration |
| AC-02-05 | « Aux alentours » inchangé, non regroupé | integration |
| BR-08 | Catégorie urgences jamais publique | unit |
| AC-02-06 | Taxonomie désactivée masquée | unit |
| AC-03-01 | Éligible sans photo si description ≥ 150 | unit |
| AC-03-02 | Refus si sans photo et description < 150 | contract |
| AC-03-03 | Image de remplacement + alt neutre, sans crédit | integration |
| AC-03-04 | Pas d'image de remplacement en JSON-LD / og:image | unit |
| AC-03-05 | Pas de dépublication à la perte de photo | unit |
| AC-03-06 | Badge « Sans photo » dans l'admin | integration |

---

## Out of Scope

- Pages dédiées par sous-catégorie (URL propres) et ajout au sitemap.
- Modification de la page Admin › Taxonomie (elle reste la source, sans évolution).
- Guide privé `/sejour` (sa navigation a sa propre spec).
- Ajout ou correction de contenus POI (travail éditorial dans l'admin).
- Nouvelles images de remplacement.

---

## Open Questions

- **OQ-01** — `resolved` 2026-10-06 — Urgences masquée de `/decouvrir` (BR-08).
- **OQ-02** — `resolved` 2026-10-06 — 3 cartes par catégorie sur la page ville.
