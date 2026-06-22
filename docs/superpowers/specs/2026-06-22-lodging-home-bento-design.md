# Home logement — alignement sur la landing anonyme (grille bento)

Date : 2026-06-22

## Contexte

Après scan d'un QR code logement, l'URL `/guide/{ville}?lodging={id}` pose le contexte
logement (cookie). L'onglet **« Bienvenue »** de la barre de navigation publique renvoie
sur `/`, qui rend `LodgingHome` dans [src/app/(public)/page.tsx](../../../src/app/(public)/page.tsx) :
un hero sombre arrondi (nom du logement, photo de couverture, message de bienvenue) suivi
de cartes raccourcis bento et d'une barre de navigation propre à la page.

L'objectif est que cette page **mode logement** adopte le même design que la landing
anonyme (`AnonymousLanding` dans le même fichier) : grand titre gras + grille bento de
catégories illustrées.

## Objectif

En mode logement, `/` affiche une **copie de la landing anonyme**, à deux différences près
(ville déjà connue via le contexte logement) :

- **Pas de sélecteur de ville** (menu déroulant) : la ville est celle du logement scanné.
- **Pas de bloc hôte** : on retire photo de couverture, message de bienvenue, nom du
  logement, et les raccourcis « Le logement / Nos recommandations / Vos favoris / Contact ».

Contenu cible, identique à la landing :

- Grand titre gras `t('home.title')` + intro `t('home.intro')`.
- **Grille bento** des catégories de la ville du logement : mêmes cartes que la landing
  (`CategoryBentoCard`), 1ʳᵉ carte large (`wide`), carte « Nos favoris » insérée après la
  catégorie `rando`.
- Barre de navigation du bas : celle du layout public en mode logement
  (`PublicBottomNav`), **plus** la `LodgingBottomBar` propre à la page (supprimée).

## Approche retenue (A) — extraire `CategoryBentoGrid`

Le rendu de la grille vit aujourd'hui dans
[CityCategoryExplorer](../../../src/features/city-guide/components/CityCategoryExplorer.tsx)
(client, animations framer-motion) et n'est accessible qu'après sélection de ville côté
client. On l'extrait dans un composant client réutilisable pour le partager entre la landing
anonyme et la home logement.

### Nouveau composant : `CategoryBentoGrid`

Fichier : `src/features/city-guide/components/CategoryBentoGrid.tsx` (client).

Props :

```ts
interface CategoryBentoGridProps {
  categories: CategorySummary[]
  citySlug: string
  lodgingId?: string | null
}
```

Responsabilité unique : rendre le `<motion.div>` grille + le map des `CategoryBentoCard`
avec la logique actuelle (carte `wide` quand `index % 4 === 0`, insertion de `FavoritesCard`
après la catégorie de slug `rando`). Construit les `href` `/guide/{citySlug}/{catSlug}`
(avec `?lodging=` si fourni).

`CategoryBentoCard` et `FavoritesCard` migrent dans ce fichier (ou un module voisin partagé).
La constante `CARD_IMAGE_POSITION` et les helpers `getCategoryImage` / `getFallbackGradient`
restent utilisés à l'identique.

### `CityCategoryExplorer` (refactor sans changement de comportement)

Conserve le sélecteur de ville, le fetch client `/api/cities/{slug}/categories`, et les états
`loading` / `error` / `empty`. Le bloc « rendu de la grille » (état `idle` + `categories.length > 0`)
est remplacé par `<CategoryBentoGrid categories={categories} citySlug={selected.slug} lodgingId={lodgingId} />`.
Aucun changement visuel sur la landing anonyme.

### `LodgingHome` (page serveur)

Dans [src/app/(public)/page.tsx](../../../src/app/(public)/page.tsx) :

- Le branchement `if (lodgingContext)` n'a plus besoin de charger `lodgingCustomization`
  (cover / welcome). On supprime cette requête Prisma et les props associées.
- `LodgingHome` reçoit `citySlug` et `lodgingId`, appelle `getCityGuide(citySlug, { lodgingId })`
  pour obtenir `categories`, et rend :
  - `AppShell` (inchangé, conteneur max-w-430)
  - `BrandMotionStyles` + `FloatingAura` (optionnels — on reprend le rendu de `AnonymousLanding`)
  - `<h1>` `t('home.title')`, `<p>` `t('home.intro')`
  - `<CategoryBentoGrid categories={categories} citySlug={citySlug} lodgingId={lodgingId} />`
- On supprime de la page : le hero sombre, les `ShortcutCard`, le bouton « Découvrir le guide »,
  la `LodgingBottomBar`. On retire les fonctions/props devenues inutiles (`ShortcutCard`,
  `LodgingBottomBar`, `coverPhotoUrl`, `welcomeMessage`, `ownerName`).

Le mieux est de factoriser le corps commun (`AnonymousLanding` et `LodgingHome` rendent
désormais la même structure : titre + intro + grille). La seule différence reste la source
des catégories (landing : `CityCategoryExplorer` avec sélecteur ; logement : grille directe
sur la ville connue).

## Flux de données

```
Scan QR → cookie lodging (citySlug, lodgingId)
  → onglet « Bienvenue » → GET /
  → getActiveLodgingContext() → lodgingContext
  → getCityGuide(citySlug, { lodgingId }) → { categories }
  → <CategoryBentoGrid categories citySlug lodgingId />
```

La landing anonyme garde son flux client (sélection ville → fetch API → grille).

## Cas limites

- **Ville sans catégorie active** : `getCityGuide` renvoie `categories: []`. La grille rend
  un état vide discret (réutiliser le message `t('home.empty')` déjà présent, ou un texte
  équivalent). Pas de crash, pas de carte fantôme.
- **Catégorie `rando` absente** : la `FavoritesCard` n'est pas insérée (comportement actuel
  conservé : insertion uniquement sur présence du slug `rando`).
- **`lodgingId` présent** : propagé dans tous les `href` de catégories pour garder le contexte.

## Tests

- Test du composant `CategoryBentoGrid` : rend une carte par catégorie, applique `col-span-2`
  à la 1ʳᵉ, insère « Nos favoris » après `rando`, et propage `?lodging=` dans les liens.
- Vérifier la non-régression de la landing anonyme (le rendu de grille via `CityCategoryExplorer`
  reste identique).
- Vérifier que `LodgingHome` n'affiche plus le hero / les raccourcis / la barre propre, et
  affiche titre + intro + grille pour la ville du logement.

## Hors périmètre

- Aucun changement sur la page guide `/guide/[city-slug]`.
- Aucun changement sur la landing anonyme (refactor interne uniquement, rendu identique).
- Logique « Nos favoris » (la carte reste non navigante, TODO existant conservé).
