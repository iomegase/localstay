# Blocs « Infos pratiques » personnalisés (logement)

Date : 2026-06-22

## Contexte

La page publique `/le-logement` ([src/app/(public)/le-logement/page.tsx](../../../src/app/(public)/le-logement/page.tsx))
affiche les « Infos pratiques » d'un logement à partir d'un **jeu de champs fixes** de la
table `LodgingCustomization` (adresse, Wi-Fi, parking, équipements, départ, poubelles,
règlement, urgences, services). L'owner les édite dans le dashboard via
[CustomizationForm](../../../src/features/guide-customization/components/CustomizationForm.tsx),
sauvegardé par `PUT /api/dashboard/lodgings/[id]/customization`
([route](../../../src/app/api/dashboard/lodgings/[id]/customization/route.ts) →
`saveLodgingCustomization`).

Aujourd'hui l'owner ne peut présenter que ces rubriques prédéfinies.

## Objectif

Permettre à l'owner d'ajouter des **blocs libres** dans sa section « Infos pratiques » :
chaque bloc a un **titre** (la « catégorie » créée à la volée), un **texte markdown**, une
**icône** choisie dans une liste, et une **photo optionnelle**. Nombre de blocs **illimité**.
Les blocs s'affichent **après** les sections fixes et sont **réordonnables entre eux**.

## Décisions (cadrage validé)

- Placement : après les sections fixes ; ordre libre entre blocs uniquement (pas de mélange
  avec les sections fixes).
- Icône : l'owner choisit dans un **catalogue prédéfini** de slugs Lucide.
- Contenu d'un bloc : `title` + `body` (markdown) + `icon` + 1 photo optionnelle.
- Nombre de blocs : illimité.
- Photo : réutilise le composant `ImageUpload` et l'endpoint d'upload existant
  `POST /api/dashboard/lodgings/[id]/cover-photo` (upload générique → renvoie `{ url }`).
- Édition : pas de nouvel endpoint CRUD — les blocs voyagent dans le payload du formulaire
  de customization, avec sémantique de **remplacement complet** (comme `LodgingFeaturedPoi`).

## Modèle de données

Nouvelle table Prisma `LodgingPracticalBlock`, relation 1-N avec `Lodging` (même style que
`LodgingFeaturedPoi`) :

```prisma
model LodgingPracticalBlock {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  lodging_id  String
  lodging     Lodging   @relation(fields: [lodging_id], references: [id])
  title       String
  body        String?
  icon        String
  photo_url   String?
  sort_order  Int       @default(0)

  @@index([lodging_id])
}
```

- Ajouter la relation inverse `practical_blocks LodgingPracticalBlock[]` sur `model Lodging`.
- Une migration Prisma crée la table + l'index. Le DDL live devra être appliqué par
  l'utilisateur (voir mémoire « Appliquer les migrations DB » : l'URL directe 5432 est
  injoignable depuis le sandbox).

## Catalogue d'icônes

Nouveau module `src/features/guide-customization/lib/practical-block-icons.ts` :

```ts
export interface PracticalBlockIcon {
  slug: string   // slug kebab-case Lucide (ex. 'utensils')
  label: string  // libellé FR pour le sélecteur
}

export const PRACTICAL_BLOCK_ICONS: readonly PracticalBlockIcon[] = [
  { slug: 'info', label: 'Information' },
  { slug: 'star', label: 'À ne pas manquer' },
  { slug: 'utensils', label: 'Restauration' },
  { slug: 'bed', label: 'Couchage' },
  { slug: 'bath', label: 'Salle de bain' },
  { slug: 'tv', label: 'Multimédia' },
  { slug: 'thermometer', label: 'Chauffage' },
  { slug: 'key', label: 'Accès / clés' },
  { slug: 'dog', label: 'Animaux' },
  { slug: 'baby', label: 'Enfants' },
  { slug: 'leaf', label: 'Tri / écologie' },
  { slug: 'map-pin', label: 'Lieu' },
] as const

export const PRACTICAL_BLOCK_ICON_SLUGS: ReadonlyArray<string> =
  PRACTICAL_BLOCK_ICONS.map(i => i.slug)

export const DEFAULT_PRACTICAL_BLOCK_ICON = 'info'
```

Le rendu réutilise `CategoryIcon` ([category-icon](../../../src/features/city-guide/lib/category-icon.tsx)),
qui mappe n'importe quel slug kebab → composant Lucide (fallback `MapPin`).

## Types

Dans [guide-customization/types.ts](../../../src/features/guide-customization/types.ts) :

```ts
export interface PracticalBlockInput {
  id?: string
  title: string
  body: string | null
  icon: string
  photo_url: string | null
  sort_order: number
}

export interface PracticalBlockResponse {
  id: string
  title: string
  body: string | null
  icon: string
  photo_url: string | null
  sort_order: number
}
```

- `LodgingCustomizationInput` reçoit `practical_blocks: PracticalBlockInput[]` (défaut `[]`).
- `LodgingCustomizationResponse` reçoit `practical_blocks: PracticalBlockResponse[]`.

## API

Dans la route customization, étendre le schéma Zod :

```ts
import { PRACTICAL_BLOCK_ICON_SLUGS } from '@/features/guide-customization/lib/practical-block-icons'

const practicalBlockSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(120),
  body: z.string().max(4000).nullable().optional()
    .transform(v => (v && v.trim().length > 0 ? v : null)),
  icon: z.string().trim().refine(v => PRACTICAL_BLOCK_ICON_SLUGS.includes(v), {
    message: 'Icône inconnue',
  }),
  photo_url: z.union([
    z.string().trim().url(),
    z.string().trim().length(0).transform(() => null),
    z.null(),
  ]).optional(),
  sort_order: z.number().int().min(0),
})

// dans customizationSchema :
practical_blocks: z.array(practicalBlockSchema).default([]),
```

Pas de nouveau code d'erreur métier : un payload invalide retombe sur `INVALID_BODY` (400)
déjà géré.

## Persistance

Dans `saveLodgingCustomization` ([customization.ts](../../../src/features/guide-customization/queries/customization.ts)),
à l'intérieur de la transaction existante, ajouter le **remplacement complet** des blocs
(calqué sur le bloc `LodgingFeaturedPoi`) :

1. Soft-delete de tous les blocs actifs du logement :
   `tx.lodgingPracticalBlock.updateMany({ where: { lodging_id, deleted_at: null }, data: { deleted_at: new Date() } })`.
2. Recréer une ligne par entrée de `input.practical_blocks`, dans l'ordre du tableau, en
   réindexant `sort_order` par la **position** dans le tableau (l'ordre client fait foi) :
   `title` (trim), `body` (nullé si vide), `icon`, `photo_url` (nullé si vide).
   On ne réutilise pas `id` (recréation simple, ids neufs — la page publique n'a pas besoin
   d'ids stables).

Le retour de `saveLodgingCustomization` et de `getLodgingCustomization` inclut
`practical_blocks` triés par `sort_order` croissant. `getLodgingCustomization` lit les blocs
via `prisma.lodgingPracticalBlock.findMany({ where: { lodging_id, deleted_at: null }, orderBy: { sort_order: 'asc' } })`.

## Rendu public

Dans [/le-logement/page.tsx](../../../src/app/(public)/le-logement/page.tsx) :

- Charger les blocs : `prisma.lodgingPracticalBlock.findMany({ where: { lodging_id, deleted_at: null }, orderBy: { sort_order: 'asc' } })`.
- `hasContent` devient vrai si une section fixe **ou** au moins un bloc a du contenu.
- Après la liste des sections fixes, rendre les blocs dans une carte au même style que
  `PracticalCard` :
  - icône via `<CategoryIcon iconSlug={block.icon} className="h-5 w-5" />`,
  - titre (`block.title`),
  - corps markdown via `<MarkdownText source={block.body} />` (si présent),
  - photo optionnelle via `next/image` (si `photo_url`), au-dessus ou sous le texte,
    coins arrondis cohérents avec la carte.
- Un bloc sans `body` ni `photo_url` mais avec un titre reste affiché (titre seul) — un bloc
  n'est créé que volontairement par l'owner.

## Formulaire owner

Dans [CustomizationForm.tsx](../../../src/features/guide-customization/components/CustomizationForm.tsx) :

- Nouvel état `practicalBlocks: PracticalBlockInput[]` initialisé depuis
  `initialCustomization.practical_blocks`.
- Nouvelle section « Blocs personnalisés » sous la carte Infos pratiques :
  - liste de blocs éditables ; chaque bloc = input **titre**, **sélecteur d'icône**
    (boutons/menu listant `PRACTICAL_BLOCK_ICONS`, rendu via `CategoryIcon`), **textarea**
    markdown (+ `MarkdownHint` et aperçu `MarkdownText`), **`ImageUpload`** (endpoint
    `/api/dashboard/lodgings/${lodgingId}/cover-photo`) + aperçu/suppression de la photo ;
  - bouton **« Ajouter un bloc »** (ajoute un bloc vide avec
    `icon = DEFAULT_PRACTICAL_BLOCK_ICON`) ;
  - bouton **supprimer** par bloc ;
  - **réordonnancement** via `dnd-kit` (déjà importé pour `category_order`) — `sort_order`
    recalculé à l'envoi par la position.
- `saveCustomization` ajoute `practical_blocks` au payload PUT, et réhydrate l'état depuis la
  réponse.

## Tests

- **Catalogue** : `PRACTICAL_BLOCK_ICON_SLUGS` non vide ; `DEFAULT_PRACTICAL_BLOCK_ICON` ∈
  catalogue.
- **API / Zod** : titre vide rejeté ; titre > 120 rejeté ; icône hors catalogue rejetée
  (`INVALID_BODY`) ; `photo_url` vide → `null` ; payload valide accepté.
- **Persistance** : `saveLodgingCustomization` supprime les blocs existants et recrée ceux
  fournis avec `sort_order` = position ; ownership (`FORBIDDEN`/`NOT_FOUND`) respecté ;
  `getLodgingCustomization` renvoie les blocs triés.
- **Page publique** : avec blocs, ils s'affichent après les sections fixes ; markdown et
  photo rendus ; `hasContent` vrai si seulement des blocs ; état vide inchangé sans contenu.
- **Formulaire** : « Ajouter un bloc » ajoute une ligne ; supprimer retire la ligne ; le
  payload de `saveCustomization` contient `practical_blocks` avec titre/icône/sort_order.

## Hors périmètre

- Pas de réordonnancement mixte blocs ↔ sections fixes.
- Une seule photo par bloc.
- Pas d'endpoint CRUD dédié par bloc (remplacement complet via le formulaire).
- Pas de galerie multi-photos ni de mise en page riche dans un bloc (markdown simple).
