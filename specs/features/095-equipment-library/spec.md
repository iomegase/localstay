# Spec — 095 Équipements du guide et bibliothèque partagée

## Metadata

```yaml
id: 095-equipment-library
title: "« Blocs personnalisés » renommés « Équipements », bibliothèque partagée validée par l'admin"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-08
updated_at: 2026-10-08
amended: "PO 2026-10-08 : select sur le nom (AC-04-03) + reprise des équipements existants à valider (AC-02-04)"
depends_on:
  - 077-owner-lodgings-guide-ui
  - 082-lodging-faq-library
bounded_context: guide-customization
implementation_gate: "PO 2026-10-08 : « renommer les blocs personnalisés en Équipements et les enregistrer dans Supabase au fur et à mesure afin de les proposer aux autres logements comme pour les FAQ, avec la possibilité de les éditer » ; choix : proposés à tous après validation admin ; titre + icône + texte ; copie libre pour l'Owner, bibliothèque modifiable dans l'admin."
```

## Context

Les « blocs personnalisés » de la page Guide décrivent les équipements du logement (machine à café,
télévision…) ; le guide voyageur les affiche déjà sous « Équipements ». Chaque propriétaire les
réécrit de zéro alors que beaucoup sont communs à tous les logements.

## User Stories

### US-01 — Renommage
- **AC-01-01**: La section s'intitule « Équipements » (« Ajoutez les équipements du logement : nom,
  icône, texte, photo. »), le bouton « Ajouter un équipement », le champ « Nom de l'équipement ».

### US-02 — Alimentation de la bibliothèque
- **AC-02-01**: Given un Owner qui enregistre sa page Guide, When un équipement porte un nom absent de
  la bibliothèque (comparaison sans casse, accents ni espaces superflus), Then il y est ajouté « à
  valider » avec son nom, son icône et son texte (ni photo ni vidéo), sans bloquer l'enregistrement.
- **AC-02-02**: Un nom déjà présent (validé, à valider ou refusé) n'est jamais ajouté deux fois ni
  écrasé. Le tri des déchets (icône `recycle`) n'est pas un équipement et n'est pas ajouté.
- **AC-02-04** (PO 2026-10-08) : une reprise unique (`scripts/backfill-equipment-library.ts`, dry-run
  par défaut, `--apply` pour écrire) verse les équipements déjà saisis des logements dans la
  bibliothèque « à valider », selon les mêmes règles qu'AC-02-01/02.

### US-03 — Validation par l'admin
- **AC-03-01**: Given `/admin/equipment-library`, When l'admin l'ouvre, Then il voit les équipements
  à valider en premier, puis validés, puis refusés, et peut modifier nom, icône et texte.
- **AC-03-02**: « Valider » rend l'équipement proposable à tous ; « Refuser » le retire des
  propositions (et empêche qu'il revienne) ; « Enregistrer » sauvegarde les modifications.

### US-04 — Ajout depuis la bibliothèque
- **AC-04-01**: Given la section Équipements, When l'Owner clique « Ajouter depuis la bibliothèque »,
  Then les équipements validés absents de son logement (même nom) s'affichent avec case à cocher,
  icône et début du texte, et « Ajouter (N) ».
- **AC-04-03** (PO 2026-10-08) : le champ « Nom de l'équipement » est une liste déroulante avec
  recherche : au focus (ou via le chevron) il liste les équipements validés absents des autres
  équipements du logement, filtrés par le texte saisi ; choisir une entrée remplit le nom et l'icône,
  et le texte uniquement s'il est vide (aucun texte saisi n'est écrasé). La saisie d'un nom libre
  reste possible. Sans bibliothèque validée, le champ reste un simple champ texte.
- **AC-04-02**: Les équipements ajoutés sont des copies : l'Owner les modifie ou supprime librement ;
  la bibliothèque n'est pas modifiée par ces changements.

## Business Rules
- **BR-01**: Aucun équipement n'est proposé aux autres logements sans validation admin (données
  personnelles possibles : codes, noms, téléphones).
- **BR-02**: Photos et vidéos restent propres à chaque logement.
- **BR-03**: Les équipements existants des logements ne sont pas modifiés.

## Data Model

```prisma
model EquipmentTemplate {
  id                String    @id @default(uuid())
  created_at        DateTime  @default(now())
  updated_at        DateTime  @updatedAt
  deleted_at        DateTime?
  title             String
  title_key         String    @unique
  icon              String
  body              String?
  status            String    @default("pending") // pending | approved | rejected
  source_lodging_id String?
  reviewed_by       String?
  reviewed_at       DateTime?
  @@index([status, deleted_at])
}
```

## API Contract
- `PATCH /api/admin/equipment-library/{id}` (admin) : `{ title?, icon?, body?, status? }` (Zod) → 200
  `{ data }` ; 404 `NOT_FOUND` ; 409 `TITLE_ALREADY_EXISTS`.
- La liste validée est fournie à la page Guide côté serveur (pas d'API publique).

## Acceptance Criteria
AC-01-01 à AC-04-02, BR-01 à BR-03.

## Out of Scope
Traduction des modèles ; photos de bibliothèque ; validation automatique des équipements repris
(AC-02-04 : ils restent « à valider »).

## Open Questions
Aucune.
