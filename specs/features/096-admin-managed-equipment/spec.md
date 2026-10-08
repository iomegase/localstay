# Spec — 096 Équipements gérés par l'admin (photo verrouillée côté propriétaire)

## Metadata

```yaml
id: 096-admin-managed-equipment
title: "Équipements : bibliothèque seule, photo / icône / vidéo gérées par l'admin, nom et texte ajustables par l'Owner"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-08
updated_at: 2026-10-08
depends_on:
  - 095-equipment-library
bounded_context: guide-customization
supersedes: "095 AC-02-01, AC-02-02, AC-02-04 (alimentation par les propriétaires), AC-04-02 (copie libre), AC-04-03 (nom libre)"
implementation_gate: "PO 2026-10-08 : « éviter que les propriétaires uploadent n'importe quoi : équipements éditables côté admin, le propriétaire ne peut pas changer la photo, seul le texte pourra être ajusté » ; choix : bibliothèque seule (plus de création libre) ; l'Owner modifie nom et texte ; photo / icône / vidéo liées à la bibliothèque (mise à jour partout) ; les 9 équipements existants sont repris (leur photo devient celle de la bibliothèque)."
```

## Context

Spec 095 laissait chaque propriétaire créer ses équipements et y téléverser n'importe quelle photo.
Le PO veut une présentation homogène et maîtrisée : l'admin gère le catalogue des équipements (nom,
icône, texte par défaut, photo, vidéo) ; le propriétaire choisit dans ce catalogue et n'ajuste que le
nom et le texte.

## Glossary refs
Équipement (bloc de la section « Équipements » du guide) ; Bibliothèque d'équipements
(`EquipmentTemplate`) ; Owner ; Admin.

## User Stories

### US-01 — L'admin gère le catalogue
- **AC-01-01**: Given `/admin/equipment-library`, When l'admin clique « Nouvel équipement » et
  renseigne nom, icône, texte, photo (optionnelle) et vidéo YouTube (optionnelle), Then l'équipement
  est créé directement « validé » (proposable).
- **AC-01-02**: L'admin modifie nom, icône, texte, photo (téléversement ou retrait) et vidéo de tout
  équipement ; « Valider » / « Refuser » restent disponibles (095 AC-03-02).
- **AC-01-03**: La liste reste triée : à valider, validés, refusés (095 AC-03-01).

### US-02 — L'Owner choisit dans la bibliothèque
- **AC-02-01**: Given la section Équipements, When l'Owner clique « Ajouter un équipement », Then la
  bibliothèque validée s'ouvre (recherche par nom, sans casse ni accents ; cases à cocher ; icône,
  photo miniature, début du texte), privée des équipements déjà présents dans le logement (même
  équipement de bibliothèque) ; « Ajouter (N) » les ajoute avec le nom et le texte par défaut.
  Il n'existe plus de création d'équipement en saisie libre.
- **AC-02-02**: Sans équipement validé disponible : « Aucun équipement disponible pour l'instant. »
- **AC-02-03**: Sur chaque équipement, l'Owner modifie le **nom** et le **texte** ; l'icône, la
  photo et la vidéo sont affichées en lecture seule (« Photo et icône gérées par MyStay »), sans
  téléversement.
- **AC-02-04**: L'Owner peut retirer un équipement de son guide (suppression douce) et réordonner.

### US-03 — Contrôle serveur
- **AC-03-01**: À l'enregistrement de la page Guide, un nouvel équipement doit référencer un
  équipement de bibliothèque **validé** ; sinon 400 `EQUIPMENT_NOT_AVAILABLE` et rien n'est écrit.
- **AC-03-02**: L'équipement de bibliothèque d'un équipement existant ne change jamais ; les valeurs
  `icon`, `photo_url`, `video_url` envoyées par l'Owner sont ignorées (le serveur conserve celles en
  base).
- **AC-03-03**: Les enregistrements de l'Owner n'alimentent plus la bibliothèque (fin de 095 AC-02-01).

### US-04 — Affichage voyageur
- **AC-04-01**: Dans le guide du séjour et la page `/le-logement`, un équipement lié à la bibliothèque
  affiche l'icône, la photo et la vidéo **actuelles** de la bibliothèque (une modification admin se
  répercute partout) avec le nom et le texte du logement. Un équipement non lié (historique) garde ses
  propres valeurs.
- **AC-04-02**: Un équipement de bibliothèque refusé après coup n'est plus proposé mais reste affiché
  dans les guides qui l'utilisent déjà.

### US-05 — Reprise de l'existant
- **AC-05-01**: `scripts/link-equipment-library.ts` (dry-run par défaut, `--apply`) : chaque équipement
  de logement non lié est rattaché à l'équipement de bibliothèque de même nom (095 `equipmentTitleKey`),
  créé « à valider » s'il n'existe pas ; un équipement de bibliothèque sans photo reçoit la photo
  (et la vidéo) du premier équipement de logement qui en a une. Les photos des logements ne sont pas
  effacées en base (BR-03).

## Business Rules
- **BR-01**: Seul l'admin téléverse ou change la photo d'un équipement.
- **BR-02**: La photo d'un équipement de bibliothèque est une référence active pour le nettoyage du
  stockage (spec 070) : elle n'est jamais supprimée tant que l'équipement existe.
- **BR-03**: Aucune donnée n'est supprimée physiquement (suppression douce, colonnes conservées).
- **BR-04**: Les traductions (spec 061) portent toujours sur le nom et le texte du logement.

## Data Model

```prisma
model EquipmentTemplate {
  // … champs spec 095 …
  photo_url String?
  video_url String?
  blocks    LodgingPracticalBlock[]
}

model LodgingPracticalBlock {
  // … champs existants …
  equipment_template_id String?
  equipment_template    EquipmentTemplate? @relation(fields: [equipment_template_id], references: [id])
  @@index([equipment_template_id])
}
```

## API Contract
- `POST /api/admin/equipment-library` (admin) : `{ title, icon, body?, photo_url?, video_url? }` (Zod)
  → 201 `{ data }` (status `approved`) ; 409 `TITLE_ALREADY_EXISTS`.
- `PATCH /api/admin/equipment-library/{id}` (admin) : ajoute `photo_url?`, `video_url?` (null pour
  retirer) → 200 `{ data }` ; 404 `NOT_FOUND` ; 409 `TITLE_ALREADY_EXISTS`.
- `POST /api/admin/equipment-library/photo` (admin) : multipart `file` → 201 `{ url }`.
- `PUT /api/dashboard/lodgings/{id}/customization` : chaque `practical_blocks[]` porte
  `equipment_template_id` ; 400 `EQUIPMENT_NOT_AVAILABLE` (AC-03-01).

## UI Behaviour
- Owner : bouton unique « Ajouter un équipement » → panneau bibliothèque (recherche + cases) ; chaque
  ligne : poignée, miniature photo et icône en lecture seule, champ Nom, champ Texte, Supprimer.
- Admin : bouton « Nouvel équipement » (formulaire en tête de liste) ; chaque ligne ajoute photo
  (téléverser / retirer) et vidéo YouTube.

## Acceptance Criteria
AC-01-01 à AC-05-01, BR-01 à BR-04.

## Out of Scope
Photos multiples par équipement ; traduction des équipements de bibliothèque ; demande d'équipement
par l'Owner depuis le dashboard ; suppression des équipements de bibliothèque (refus seulement).

## Open Questions
Aucune.
