# Spec — 070 Médiathèque des images de remplacement et nettoyage du stockage

## Metadata

```yaml
id: 070-fallback-image-library
title: "Images de remplacement gérées dans l'admin, attribuées sans doublon, et suppression des photos inutilisées"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 017-admin-taxonomy
  - 022-admin-poi-management
  - 063-poi-photo-mirroring
  - 065-discovery-taxonomy-layout
bounded_context: media
amends:
  - "063 BR-05 (aucune suppression physique des copies)"
  - "065 AC-03-03 (choix de l'image de remplacement)"
implementation_gate: "PO 2026-10-06 : images classées par sous-catégorie ; import en masse puis classement dans l'admin ; photos retirées supprimées à l'enregistrement + script tous les 7 jours (sauf images de remplacement) ; périmètre étendu aux logements."
```

---

## Context

Les images de remplacement sont 35 PNG 1024×1024 (35 Mo) dans `public/fallback`,
choisies par mots-clés codés en dur (`getPoiFallbackImage`) : une seule image par type
de lieu, donc tous les cafés sans photo d'un village ont la même image. Ajouter une
image impose un commit et un déploiement.

Par ailleurs, aucun code ne supprime de fichier du stockage Supabase : au
2026-10-06, `guide-photos/pois/` contient 254 fichiers (29,1 Mo) dont 71 orphelins
(5,8 Mo, copies spec 063 de photos retirées des fiches).

Le bucket `guide-photos` reste le stockage de toutes les images envoyées (POI,
logements, Journal, cartes transport) et des copies spec 063.

---

## Glossary References

- **Image de remplacement** — illustration affichée pour un lieu sans photo
  exploitable ; jamais présentée comme photo du lieu (065 BR-05).
- **Médiathèque** — page admin qui gère ces images.
- **Image non classée** — image envoyée sans catégorie.
- **Fichier orphelin** — fichier du stockage qu'aucune donnée active ne référence.

---

## User Stories

### US-01 — Importer en masse puis classer

#### Acceptance Criteria

- **AC-01-01**: Given la page Admin › Images de remplacement, When l'admin dépose
  plusieurs fichiers (glisser-déposer ou sélection multiple), Then chacun est converti
  en WebP (service d'envoi existant) dans `guide-photos/fallbacks/` et apparaît dans
  « Non classées ».
- **AC-01-02**: Given des images sélectionnées (cases à cocher), When l'admin choisit
  une catégorie et, si besoin, une sous-catégorie de cette catégorie puis « Classer »,
  Then toutes reçoivent ce classement ; une image classée peut être reclassée.
- **AC-01-03**: Given la médiathèque, When elle s'affiche, Then elle est filtrable
  (Non classées · par catégorie · par sous-catégorie) et chaque vignette indique le
  nombre de lieux qui l'utilisent.
- **AC-01-04**: Given une image, When l'admin la retire, Then elle est masquée
  (soft delete), son fichier est conservé (BR-06), et les lieux qui l'utilisaient
  reçoivent une autre image (US-02).

### US-02 — Attribuer une image différente à chaque lieu sans photo

#### Acceptance Criteria

- **AC-02-01**: Given un lieu actif sans photo exploitable, When une image lui est
  attribuée, Then elle est choisie parmi les images de sa sous-catégorie, à défaut de
  sa catégorie, en prenant la **moins utilisée dans sa ville** (égalité : la plus
  ancienne), et enregistrée sur la fiche (`fallback_image_id`).
- **AC-02-02**: Given des images en nombre suffisant, When plusieurs lieux d'une même
  ville et sous-catégorie sont sans photo, Then aucun n'a la même image.
- **AC-02-03**: Given une attribution, When le lieu est réaffiché (guide, `/decouvrir`,
  admin), Then il garde la même image tant qu'elle reste valide (non retirée, toujours
  classée dans sa sous-catégorie ou catégorie).
- **AC-02-04**: Given une attribution invalide (image retirée ou reclassée, lieu changé
  de catégorie) ou absente, When l'attribution est recalculée, Then une nouvelle image
  est choisie selon AC-02-01. Le recalcul a lieu après chaque enregistrement de fiche,
  publication de candidat, création manuelle, et après chaque envoi / classement /
  retrait dans la médiathèque.
- **AC-02-05**: Given un lieu qui reçoit une vraie photo, When il est affiché, Then la
  photo remplace l'image de remplacement (l'attribution est retirée).
- **AC-02-06**: Given aucune image disponible pour la sous-catégorie ni la catégorie,
  When le lieu est affiché, Then l'ancienne correspondance par mots-clés
  (`public/fallback`) sert de repli jusqu'à la fin de la transition (BR-07), puis
  l'image MyStay par défaut.

### US-03 — Supprimer les photos retirées des fiches

#### Acceptance Criteria

- **AC-03-01**: Given l'enregistrement d'une fiche POI, When des photos ont été
  retirées, Then chaque photo retirée hébergée dans `guide-photos/pois/` et sa copie
  spec 063 sont supprimées du stockage, si aucune autre donnée active ne les
  référence ; la ligne `PoiPhotoMirror` correspondante est marquée supprimée.
- **AC-03-02**: Given un logement, When une photo de la vitrine est retirée, la
  couverture remplacée, ou une photo d'un bloc pratique / d'une instruction d'arrivée
  retirée, Then le fichier hébergé dans `guide-photos/lodgings/` est supprimé s'il
  n'est plus référencé.
- **AC-03-03**: Given un échec de suppression du fichier, When l'enregistrement a lieu,
  Then la fiche est enregistrée normalement (échec journalisé, repris par US-04).

### US-04 — Nettoyage hebdomadaire des fichiers inutilisés

#### Acceptance Criteria

- **AC-04-01**: Given la tâche hebdomadaire (Vercel Cron), When elle s'exécute, Then
  elle parcourt `guide-photos/pois/` et `guide-photos/lodgings/` et supprime tout
  fichier qu'aucune donnée active ne référence.
- **AC-04-02**: Given `guide-photos/fallbacks/`, When la tâche s'exécute, Then aucun de
  ses fichiers n'est jamais supprimé.
- **AC-04-03**: Given un fichier créé depuis moins de 24 h, When la tâche s'exécute,
  Then il n'est pas supprimé (envoi en cours, fiche pas encore enregistrée).
- **AC-04-04**: Given la tâche, When elle se termine, Then elle renvoie le nombre de
  fichiers examinés, supprimés et la taille libérée ; un mode « simulation » liste sans
  supprimer.
- **AC-04-05**: Given la mise en service, When le script de nettoyage initial est lancé
  (d'abord en simulation), Then les orphelins existants sont supprimés.

---

## Business Rules

- **BR-01**: Classement par sous-catégorie ; une image classée en catégorie seule sert
  de repli à toutes ses sous-catégories.
- **BR-02**: Une sous-catégorie choisie appartient obligatoirement à la catégorie
  choisie.
- **BR-03**: Attribution par ville : l'unicité est recherchée entre lieux d'une même
  ville ; deux villes peuvent partager une image.
- **BR-04**: Références prises en compte avant toute suppression : `PointOfInterest
  .photos` (fiches non supprimées), `PoiPhotoMirror.storage_url` (copies actives dont
  l'origine est encore sur une fiche), `LodgingPhoto.url` (non supprimées),
  `LodgingCustomization.cover_photo_url`, photos des `LodgingPracticalBlock` et
  `LodgingArrivalInstruction`.
- **BR-05**: Décision PO du 2026-10-06 : les **fichiers** de stockage inutilisés sont
  supprimés physiquement (amende 063 BR-05). Les **lignes** de base restent en soft
  delete (`deleted_at`), conformément à la règle globale.
- **BR-06**: Les fichiers de `guide-photos/fallbacks/` ne sont jamais supprimés
  automatiquement.
- **BR-07**: Transition : `public/fallback` et `getPoiFallbackImage` restent en repli
  jusqu'à ce que le PO ait importé et classé les images ; leur retrait du dépôt fera
  l'objet d'un commit distinct, sur confirmation du PO.
- **BR-08**: Les images de remplacement restent décoratives : jamais en JSON-LD ni
  `og:image` (065 BR-05).
- **BR-09**: Gemini n'intervient pas (ADR-006).

---

## Data Model

```prisma
model FallbackImage {
  id             String       @id @default(uuid())
  created_at     DateTime     @default(now())
  updated_at     DateTime     @updatedAt
  deleted_at     DateTime?
  url            String
  storage_path   String       @unique
  category_id    String?
  category       Category?    @relation(fields: [category_id], references: [id])
  subcategory_id String?
  subcategory    SubCategory? @relation(fields: [subcategory_id], references: [id])
  pois           PointOfInterest[]

  @@index([category_id, subcategory_id, deleted_at])
}

model PointOfInterest {
  // …champs existants
  fallback_image_id String?
  fallback_image    FallbackImage? @relation(fields: [fallback_image_id], references: [id])
}
```

Migration additive.

---

## API Contract

```yaml
/api/admin/fallback-images:
  get:   { query: { filter?: unclassified|category|subcategory, category_id?, subcategory_id? } }
         200: { data: [{ id, url, category: {id,name}|null, subcategory: {id,name}|null, usage_count }] }
  post:  multipart files[] (1..30, formats d'envoi existants)
         201: { data: { created: [{ id, url }], rejected: [{ name, code }] } }
/api/admin/fallback-images/classify:
  post:  { image_ids: uuid[1..200], category_id: uuid|null, subcategory_id?: uuid|null }
         200: { data: { updated: number } }   400: VALIDATION_ERROR | SUBCATEGORY_CATEGORY_MISMATCH
/api/admin/fallback-images/{id}:
  delete: 200: { data: { id } }   404: NOT_FOUND
/api/internal/storage-cleanup:
  get (Vercel Cron, INTERNAL_API_SECRET) | post { dry_run?: boolean }
         200: { data: { scanned, deleted, bytes_freed, dry_run } }
```

`vercel.json` : tâche hebdomadaire `0 3 * * 1` sur `/api/internal/storage-cleanup`.

---

## UI Behaviour

- Nouvelle entrée de menu admin « Images de remplacement » (`/admin/fallback-images`).
- Zone de dépôt multi-fichiers ; grille de vignettes avec case à cocher, classement,
  nombre d'utilisations, bouton retirer ; barre d'action « Classer » (catégorie +
  sous-catégorie optionnelle) visible quand une sélection existe ; filtres.
- Shadcn/ui, Lucide, Tailwind.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01 | Envoi multiple → WebP + « Non classées » | contract |
| AC-01-02 | Classement groupé (catégorie / sous-catégorie) | contract + integration |
| AC-01-03 | Filtres + nombre d'utilisations | integration |
| AC-01-04 | Retrait = soft delete + réattribution | unit |
| AC-02-01..04 | Attribution moins utilisée, sans doublon, stable, recalculée | unit |
| AC-02-05 | Vraie photo prioritaire | unit |
| AC-02-06 | Repli mots-clés puis image MyStay | unit |
| AC-03-01 | POI : photos retirées + copies supprimées à l'enregistrement | unit |
| AC-03-02 | Logements : fichiers retirés supprimés | unit |
| AC-03-03 | Échec de suppression non bloquant | unit |
| AC-04-01..04 | Tâche hebdomadaire, fallbacks exclus, < 24 h exclus, simulation | unit + contract |
| AC-04-05 | Script de nettoyage initial | manual |

---

## Out of Scope

- Photos du Journal (`guide-photos/blog/`) et cartes transport.
- Génération d'images par IA.
- Recadrage / retouche des images dans l'admin.
- Retrait de `public/fallback` du dépôt (commit distinct après import, BR-07).

---

## Open Questions

Aucune.
