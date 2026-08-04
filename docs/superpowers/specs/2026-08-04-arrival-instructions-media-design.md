# Design — Instructions d'arrivée multi (texte + vidéo + photos)

- date: 2026-08-04
- statut: validé (décisions produit prises)
- s'appuie sur la stack existante `LodgingPracticalBlock` (quasi-jumeau)

## Problème

`arrivalInstructions` du guide privé est codé en dur à `[]`
(`private-guide-data.ts`) : jamais branché au back. Le propriétaire ne peut
pas saisir d'instructions d'arrivée. On veut une vraie feature, enrichie :
plusieurs instructions, chacune avec une vidéo et une ou plusieurs photos.

## Décisions produit

- **Rendu** : 1 mini-card par instruction (numérotée), **vignettes visibles
  directement** (photos + vidéo), clic → modal (cadre blanc 5px).
- **Modal photos** : **carrousel** (swipe + flèches) pour défiler les photos de
  l'instruction. La vidéo s'ouvre en lecteur YouTube.
- **Stockage** : nouvelle table relationnelle (miroir des blocs pratiques).
- **Vidéo** : lien YouTube (réutilise `YouTubeUrlField` / `YouTubeEmbed`).
- **Photos** : upload via l'endpoint existant, stockées en `String[]`.

## Backend

### Modèle Prisma (nouvelle table, migration additive)

```prisma
model LodgingArrivalInstruction {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?
  lodging_id String
  lodging    Lodging   @relation(fields: [lodging_id], references: [id])
  text       String
  video_url  String?
  photos     String[]
  sort_order Int       @default(0)
  @@index([lodging_id, deleted_at])
}
```

`migrate deploy` (additif). DIRECT_URL = pooler session 5432 joignable.

### Types / validation / API / query

- `ArrivalInstructionInput` `{ id?, text, video_url, photos[], sort_order }` +
  `ArrivalInstructionResponse`.
- `normalizeArrivalInstructions()` (trim, drop lignes vides, clamp photos).
- Zod `arrivalInstructionSchema` + champ `arrival_instructions` dans le schéma
  de customization (API route).
- Query customization : read (`findMany`) + write (soft-delete `updateMany` +
  `createMany`), calqué sur `practical_blocks`.

## Formulaire propriétaire

Nouvel `ArrivalInstructionsEditor` (UX de `PracticalBlocksEditor`) :
- add / remove / réordonner des instructions ;
- par instruction : **texte** (textarea) + **vidéo YouTube** (`YouTubeUrlField`)
  + **photos multiples** (`ImageUpload` → append à `photos`, chaque photo
  retirable).
- Rendu dans `CustomizationForm`, à la suite des blocs pratiques.

## Guide (front)

- Adapter : sélectionner la table, mapper
  `arrivalInstructions: { text, videoUrl, photos }[]`.
- Type guide : `GuideArrivalInstruction = { text: string; videoUrl: string | null; photos: string[] }`
  ; `GuideLodging.arrivalInstructions: GuideArrivalInstruction[]`.
- `InstructionList` → `ArrivalInstructionCard` (client) : numéro + texte +
  rangée de vignettes (photos + vidéo) ; state d'ouverture du lightbox.
- Nouveau `MediaLightbox` (client) : modal cadre blanc 5px ; mode **photo** =
  carrousel scroll-snap (swipe natif) + flèches, ouvert à l'index cliqué ; mode
  **vidéo** = `YouTubeEmbed`.

## Tests (TDD)

- `normalizeArrivalInstructions` (trim, vides, photos).
- Query : câblage read/write (mock prisma).
- Adapter : `arrivalInstructions` mappé depuis la table.
- `ArrivalInstructionsEditor` : add/remove instruction, add/remove photo,
  set vidéo.
- `ArrivalInstructionCard` : mini-card numérotée, vignettes, ouverture modal.
- `MediaLightbox` : carrousel (flèches préc/suiv), ouverture à l'index, mode
  vidéo, fermeture (✕/Échap/fond), cadre 5px.
- Adapter empty → `[]` (mini-cards absentes, `<ol>` vide supprimé).

## Hors périmètre

- Réordonnancement drag-and-drop (simple monter/descendre ou ordre de saisie).
- Édition côté voyageur.
