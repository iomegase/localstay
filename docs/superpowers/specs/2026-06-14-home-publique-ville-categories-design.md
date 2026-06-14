# Design — Home publique « Find what you need » : sélecteur de ville + grille de catégories animée

**Date :** 2026-06-14
**Branche :** `feat-028-lodging-showcase-seo` (à confirmer / éventuelle nouvelle branche)
**Référence Figma :** fichier `mystay` (`znXZGNJVRReUU6kIEAILD1`), nodes `33:51` (état 1) et `33:81` (état 2)

## Contexte

La page d'accueil publique anonyme (`/`, composant `AnonymousLanding` dans
`src/app/(public)/page.tsx`) affiche aujourd'hui un layout « bento » riche (hero
« Votre séjour. Simplement. », carte QR, cartes guide/infos). On la remplace
**intégralement** par la maquette Figma : une home épurée où l'utilisateur
choisit sa ville dans un sélecteur, puis voit apparaître les catégories de cette
ville dans une grille bento animée.

**Hors périmètre :** la home « guest » (`LodgingHome`, affichée quand un logement
est actif / après scan QR) reste **strictement inchangée**, ainsi que ses tests
(`tests/unit/public-home.lodging-home.test.tsx`).

## Comportement attendu

1. **État initial** : logo MyStay, titre + intro courts (FR), puis un sélecteur
   « Sélectionner une ville ». Rien d'autre en dessous.
2. **Choix d'une ville** : les catégories de la ville (celles ayant ≥ 1 POI actif)
   apparaissent sous le sélecteur dans une grille bento, avec une animation
   d'apparition **très élastique** (spring + rebond + stagger).
3. **Re-sélection** : choisir une autre ville met à jour la grille (les cartes
   ressortent avec la même animation).
4. Chaque carte de catégorie est un lien vers `/guide/[citySlug]/[categorySlug]`
   (en préservant `?lodging=` si présent dans l'URL courante).

## Décisions de conception (validées)

- **Périmètre** : remplacement complet de `AnonymousLanding`. `LodgingHome` intacte.
- **Source des villes** : uniquement les villes actives en base (`is_active = true`,
  `deleted_at IS NULL`).
- **Catégories** : la taxonomie réelle est **personnalisée et éditable par ville**
  (≠ seed `recommended-taxonomy.ts`). On lit donc les catégories réelles par ville.
  Exemple Saint-Gervais : `boulangerie`, `location-de-ski`, `rando`, `mobilite`.
- **Visuels des cartes** : mapping photo **par slug** (best-effort), fallback
  icône + dégradé pour tout slug non mappé.
- **Mécanisme** : dropdown custom (framer-motion) + `fetch` à la sélection.
- **`CitySearchInput`** : supprimé (code mort après ce changement) avec ses 2 tests dédiés.
- **Copy** : titre + intro en français, définis par l'implémenteur (modifiables).
- **Lib d'animation** : `framer-motion` ^12.40.0 (déjà installé).

## Architecture

### Unité 1 — Donnée : liste des villes
**Fichier :** `src/features/city-guide/queries/cities.ts`
Nouvelle fonction :
```ts
export async function listActiveCities(): Promise<{ name: string; slug: string }[]>
```
Retourne les villes actives, triées par `name` (ordre alphabétique).
Appelée **côté serveur** dans `page.tsx` — pas de nouvelle route API pour la liste.

### Unité 2 — Mapping photo ↔ catégorie
**Fichier (nouveau) :** `src/features/city-guide/lib/category-images.ts`
```ts
export const CATEGORY_IMAGE_BY_SLUG: Record<string, string> = {
  boulangerie: '/home/bakery.png',
  rando:       '/home/outdoor.png',
  bars:        '/home/pub.png',
  culture:     '/home/art.png',
  diner:       '/home/resto.png',
  restaurants: '/home/resto.png',
}
export function getCategoryImage(slug: string): string | null
```
Photos déjà présentes dans `/public/home/` : `art.png`, `bakery.png`,
`outdoor.png`, `pub.png`, `resto.png`.
Un fallback déterministe (dégradé selon un hash simple du slug) habille les
catégories sans photo (ex. `location-de-ski`, `mobilite`).

### Unité 3 — Composant client `CityCategoryExplorer`
**Fichier (nouveau) :** `src/features/city-guide/components/CityCategoryExplorer.tsx`
`'use client'`

- **Props** : `cities: { name: string; slug: string }[]`.
- **État** : `selectedSlug`, `categories`, `status` (`idle | loading | error`).
- **Dropdown custom** : bouton stylé maquette (label majuscule + chevron),
  ouvrant une liste animée (`AnimatePresence`). Accessibilité : rôle
  `listbox`/`option`, navigation flèches ↑/↓, `Enter` pour choisir, `Échap`
  pour fermer, focus géré, `aria-expanded`.
- **Chargement** : au choix d'une ville → `fetch('/api/cities/{slug}/categories')`
  (route existante) → `status = loading` (skeleton) → rendu de la grille.
  Gestion d'erreur réseau : message discret + possibilité de re-sélectionner.
- **Préservation `?lodging=`** : lue via `useSearchParams`, propagée aux liens.

### Unité 4 — Carte de catégorie + grille animée
Sous-composant `CategoryBentoCard` (dans le même dossier, ou inline) :
- Variante **photo** : `next/image` en fond (`fill`, `unoptimized` cohérent avec
  l'existant), overlay sombre dégradé, libellé en bas.
- Variante **fallback** : dégradé déterministe + icône Lucide (réutiliser la
  logique d'icône existante de `CategoryGrid`) + libellé.
- Lien `next/link` vers `/guide/[citySlug]/[catSlug]` (+ `?lodging=`).

**Grille bento** : `motion.div` conteneur avec `staggerChildren`. Motif bento
2 colonnes avec quelques cartes en `col-span-2` selon l'index (proche du visuel
Figma), s'adaptant au nombre variable de catégories.

**Animation « très élastique »** :
- Apparition carte : `initial { opacity: 0, y: 24, scale: 0.85 }` →
  `animate { opacity: 1, y: 0, scale: 1 }` en `type: 'spring', stiffness ≈ 260,
  damping ≈ 13` (overshoot/rebond visible).
- Hover / tap : `whileHover { scale: 1.04 }`, `whileTap { scale: 0.96 }` en spring.
- `prefers-reduced-motion` : désactive le spring (simple fade), via le hook
  `useReducedMotion` de framer-motion.

### Unité 5 — Page `AnonymousLanding` (réécriture)
**Fichier :** `src/app/(public)/page.tsx`
- `HomePage` (serveur) : si `lodgingContext` → `LodgingHome` (inchangé) ;
  sinon → charge `listActiveCities()` et rend la nouvelle home anonyme.
- Nouvelle home anonyme : `AppShell` (conservé, format mobile max-w-430), logo
  MyStay, titre + intro (i18n), puis `<CityCategoryExplorer cities={...} />`.
- Suppression du layout bento actuel (hero/QR/cartes) **pour la home anonyme uniquement**.

### Unité 6 — i18n
**Fichier :** `src/shared/lib/i18n.ts`
Nouvelles clés : `home.title`, `home.intro`, `home.select.placeholder`
(« Sélectionner une ville »), `home.empty` (ville sans catégorie),
`home.error` (échec de chargement). Les clés `home.search.*` existantes sont
supprimées si plus référencées après retrait de `CitySearchInput`.

## Nettoyage

- Supprimer `src/features/city-guide/components/CitySearchInput.tsx`.
- Supprimer les tests dédiés :
  - `tests/integration/city-guide.AC-02-01.city-search-redirect.test.tsx`
  - `tests/unit/city-guide.AC-02-02.no-result-message.test.tsx`
- Mettre à jour `docs/traceability-matrix.md` : noter que la recherche texte de
  ville (spec 001, AC-02) n'est plus exposée sur la home publique (remplacée par
  le sélecteur). La recherche **dans le guide** (`GuideSearchInput`) reste en place.

## Tests (TDD)

Nouveau fichier `tests/unit/home.city-category-explorer.test.tsx` (au minimum) :
1. Le dropdown liste toutes les villes passées en props.
2. Sélectionner une ville déclenche le `fetch` vers la bonne URL et rend les
   catégories (mock fetch).
3. Une carte dont le slug est mappé utilise la **photo** ; un slug non mappé
   utilise le **fallback icône**.
4. Les liens pointent vers `/guide/[citySlug]/[catSlug]` (et propagent `?lodging=`).
5. `prefers-reduced-motion` : pas d'animation spring (rendu direct).

Tests d'API/intégration existants pour `/api/cities/[slug]/categories` : inchangés.

## Risques / points d'attention

- **Latence au clic** : 1 requête réseau par sélection. Acceptable (route déjà
  optimisée) ; skeleton pendant le chargement.
- **Nombre de catégories variable** : le bento doit rester lisible de 1 à ~11 cartes.
- **Photos lourdes** (~1 Mo chacune) : `next/image` + `sizes` adaptés ;
  envisager une compression ultérieure des PNG (hors périmètre de cette spec).
- **Mapping figé par slug** : si l'admin renomme un slug, la photo disparaît au
  profit du fallback (dégradation gracieuse, pas de bug).
