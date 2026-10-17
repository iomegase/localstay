# Spec — 101 POI : position OpenStreetMap et photos Wikimedia Commons

## Metadata

```yaml
id: 101-poi-open-sources
title: "POI : position par OpenStreetMap quand Mapbox ne trouve que le code postal ; photos sous licence libre de Wikimedia Commons, créditées"
status: approved
mvp: 1
owner: "Product Owner"
created_at: 2026-10-17
updated_at: 2026-10-17
depends_on:
  - 003-poi-list
  - 063-poi-photo-mirroring
  - 066-acquisition-village-scope
bounded_context: poi-acquisition
implementation_gate: "PO 2026-10-17 : « pourquoi on n'arrive pas à récupérer des photos pour la randonnée Cascade de Combe Noire […] tant que nous ajoutons les crédits photos aux fiches, ce n'est pas un problème » ; « idem pour le géocodage » ; option A : OSM pour la position + Wikimedia Commons (licences libres seulement) pour les photos, pour tous les POI."
```

## Context

« Cascade de Combe Noire » (Les Contamines-Montjoie) : Mapbox ne connaît pas le lieu et renvoie le
centre du code postal 74170, qui est Saint-Gervais (8 km) ; la fiche n'a aucune photo car la recherche
générique ne lit que le site officiel du lieu. OpenStreetMap connaît la cascade (`waterfall`,
45.78001, 6.72253) et Wikimedia Commons en a 6 photos sous licence CC BY / CC BY-SA.

Un crédit ne suffit que pour une photo sous licence libre ; une photo prise ailleurs sur le web
reste soumise à l'autorisation de son auteur. Seul Wikimedia Commons est ajouté ici.

## Glossary refs
POI ; Géocodage ; Candidat d'acquisition ; Crédit photo.

## User Stories

### US-01 — Position par OpenStreetMap
- **AC-01-01**: Given un géocodage (acquisition, création manuelle, re-géocodage admin, tâche
  nocturne), When Mapbox ne renvoie aucun résultat, ou seulement un code postal / une commune / une
  localité, Then le **nom** du lieu est cherché dans OpenStreetMap (Overpass) à 30 km du centre de la
  ville ; un élément au nom identique (sans casse) donne la position, `geocode_status = success`,
  `geocode_provider = openstreetmap`.
- **AC-01-02**: Plusieurs éléments au même nom : le plus proche du centre de la ville est retenu.
- **AC-01-03**: Rien trouvé, ou Overpass indisponible : comportement actuel inchangé (position
  approximative « à vérifier », échec ou rejet).
- **AC-01-04**: Reprise `scripts/regeocode-approximate-pois.ts` (dry-run par défaut, `--apply`) : les POI
  actifs « à vérifier » sont cherchés par leur nom dans OpenStreetMap et repositionnés si trouvés.

### US-02 — Photos Wikimedia Commons
- **AC-02-01**: Given un POI publié **sans photo** (publication d'un candidat d'acquisition, ou reprise
  `scripts/backfill-commons-photos.ts`), When Wikimedia Commons a des images dont le titre ou la
  description contient le nom exact du lieu, Then jusqu'à 5 sont ajoutées (largeur ≥ 800 px, image
  JPEG / PNG / WebP, servie en 1 600 px).
- **AC-02-02**: Seules les licences libres sont acceptées : CC0, domaine public, CC BY, CC BY-SA
  (toutes versions) ; jamais NC (pas d'usage commercial) ni ND (pas de modification).
- **AC-02-03**: Une image géolocalisée à plus de 5 km du POI est écartée ; une image sans position n'est
  retenue que si son titre ou sa description cite aussi la ville (homonymes : « Le Terrier », « SPAR »,
  « Petit Casino » renvoyaient des œuvres ou magasins sans rapport).
- **AC-02-04**: Chaque photo garde son crédit : auteur, licence, lien vers la licence et vers la page
  du fichier sur Commons.
- **AC-02-05**: Les fiches POI (page publique, guide privé) affichent « Photos : Auteur (Licence) · … »
  avec les liens, dès qu'une photo Commons est montrée.
- **AC-02-06**: La reprise est en lecture seule par défaut (dry-run) et n'écrit qu'avec `--apply` ;
  elle ne touche que les POI actifs sans photo.

## Business Rules
- **BR-01**: Positions issues de Mapbox ou d'OpenStreetMap uniquement (jamais Gemini, ADR-006) ; la
  position Google reste réservée au filtre village (spec 066 BR-01).
- **BR-02**: Les photos d'un POI qui en a déjà ne sont jamais remplacées.
- **BR-03**: Appels Commons et Overpass bornés (10 s par appel), identifiés par un User-Agent MyStay
  sans donnée personnelle.
- **BR-04**: Suppression douce et données existantes conservées ; aucune photo n'est copiée sur un
  autre site que MyStay (le miroir de la spec 063 s'applique).

## Data Model

```prisma
model PointOfInterest {
  // … champs existants …
  // Spec 101 : crédits des photos sous licence libre — [{ photo_url, author, license, license_url, source_url }]
  photo_credits Json?
}
```

## API Contract
Aucune nouvelle route. Les données publiques d'un POI ajoutent `photo_credits: Array<{ author, license,
license_url | null, source_url }>` (page publique et guide privé).

## UI Behaviour
Sous la galerie d'une fiche POI : « Photos : » suivi des crédits, chacun « Auteur (Licence) », l'auteur
lié à la page Commons du fichier et la licence à son texte.

## Acceptance Criteria
AC-01-01 à AC-02-06 (dont AC-01-04), BR-01 à BR-04.

## Out of Scope
Autres sources de photos (Google Images, blogs, sites d'hôtels) ; recherche Commons par coordonnées
seules ; photos des logements ; remplacement des photos existantes.

## Open Questions
Aucune.
