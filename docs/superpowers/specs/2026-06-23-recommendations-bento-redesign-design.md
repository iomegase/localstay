# Refonte bento — page guest « Nos recommandations »

Date : 2026-06-23
Scope : **uniquement** la page guest `/(public)/nos-recommandations` (déjà protégée par `redirect('/')` hors mode séjour). Aucune autre page modifiée.

## Objectif

Remplacer la liste actuelle de la page « Nos recommandations » par une mise en
page éditoriale **bento**, fidèle au mockup fourni, tout en restant **pilotée par
les données réelles** (POIs en vedette du logement) et **dans le shell mobile
430px** existant.

## Décisions cadrées (validées)

1. **Format** : rendu **mobile** du bento dans le conteneur `max-w-[430px]`. Les
   classes `lg:` du mockup sont conservées (fidélité) mais ne se déclenchent pas
   ici.
2. **Tokens** : adapter à la marque MyStay. On **garde** `charcoal`/`gold` du
   site et **Playfair Display** (serif existant). On **ajoute** à
   `tailwind.config.ts`, de façon additive (sans impact sur les autres pages) :
   - `cream: #f7f3ed`
   - `sand: #ebe2d5`
   - `boxShadow.soft: 0 18px 60px rgba(36,34,32,0.08)`
3. **Photos** : on utilise **`poi.photos[0]`** (photo héro du POI). Aucune image
   stock externe (les Unsplash du mockup sont des placeholders). POI sans photo →
   variante texte, jamais de carte image vide.

## Contrats de test existants à préserver

Tirés de `tests/integration/guide-customization.recommendations-page.test.tsx` et
`tests/integration/nos-recommandations.cross-city.test.tsx` :

- Titre visible **« Les recommandations de {ownerName} »** → c'est le h1 du Hero
  (et non le titre générique du mockup).
- Nom de catégorie visible (ex. `Restaurants`) comme titre de section.
- `owner_note` rendu, avec `data-testid="owner-recommendation-comment"`, **rendu
  conditionnel** (absent si pas de note → pas d'espace réservé).
- Liens des cartes = **`/guide/{poi.city.slug}/{poi.category.slug}/{poi.slug}`**,
  **sans `?lodging=`** (href exact asserté ; le cookie séjour suffit).
- Section **« À découvrir ailleurs »** + sous-titre **« À {cityName} »** pour les
  autres villes ; liens vers `/guide/{citySlug}/...`.
- Empty state : texte `n'a pas encore sélectionné` + lien **« Voir le guide
  complet »** → `/guide/{citySlug}`.

## Données (inchangées)

Requête Prisma `lodgingFeaturedPoi.findMany` conservée telle quelle :
`owner_note`, `poi { name, slug, description, photos[], category{name,slug},
city{slug,name} }`, triée par `sort_order, created_at`.

Dérivés :
- `localRows` (ville du logement) → `groupByCategory` → sections par catégorie.
- `otherRows` (autres villes) → `groupByCity` → sections « Autour de {ville} ».
- **Stats Hero (nouveau calcul)** : `lieux` = total featured ; `catégories` =
  nb catégories distinctes (toutes villes) ; `villes` = nb villes distinctes.

## Structure de la page

1. **Top bar** — « MyStay / Mode séjour activé » + bouton « Guide complet » →
   `/guide/{citySlug}`.
2. **Hero** (charcoal, `rounded-[2rem]`, `shadow-soft`) :
   - badge « Recommandations de l'hôte »,
   - h1 serif italic = **« Les recommandations de {ownerName} »** (fallback
     « de votre hôte » si pas de nom),
   - sous-texte personnalisé « Une sélection … pour profiter de {cityName}. »,
   - carte logement : `lodgingName`, `cityName`, et 3 stats (lieux / catégories /
     villes).
3. **Sections locales** — une `BentoSection` par catégorie (`grouped`). Eyebrow +
   titre serif = **nom de catégorie**. La 1re section porte l'eyebrow
   « Sélection principale ».
4. **« Autour de {ville} »** — une `BentoSection` par autre ville (`otherByCity`),
   eyebrow « À découvrir ailleurs ».
5. **Empty state** — conservé à l'identique quand aucun POI.

## Système de cartes — `RecommendationCard`

Variantes (reproduisent le mockup) :

- **`bigImage`** (1ʳᵉ carte d'un groupe, `col-span-2`) : `poi.photos[0]` plein
  cadre, dégradé, pill catégorie, titre serif italic, **citation = `owner_note`**
  (`data-testid`), description `line-clamp-2`, « Voir le lieu → ».
- **`image`** : carte image charcoal compacte, eyebrow catégorie, titre serif,
  description `line-clamp-2`.
- **`white`** : `bg-white`, titre charcoal, description `line-clamp-3`, « Voir → ».
- **`sand`** : `bg-sand`, pill « Local tip ».
- **`note`** : charcoal, `owner_note` en grande citation serif (utilisée pour un
  POI **sans photo mais avec note**).

### Logique d'assignation (isolée + testée)

Fonction pure `assignVariants(rows)` → `Array<{ row, variant }>` :
- index 0 : `bigImage` si `photos[0]`, sinon `note` si `owner_note`, sinon `white`.
- index ≥ 1 : cycle `image → white → sand`, mais si le POI **n'a pas de photo**,
  la variante `image` est remplacée par `white`/`sand` (alternance) ; un POI sans
  photo mais avec `owner_note` peut prendre `note`.
- S'adapte à 1…N POIs par groupe.

Lien de chaque carte : `/guide/{poi.city.slug}/{poi.category.slug}/{poi.slug}`
(sans `?lodging=`).

## Fichiers

- `tailwind.config.ts` — +3 tokens additifs (`cream`, `sand`, `shadow-soft`).
- `src/app/(public)/nos-recommandations/page.tsx` — allégée : fetch + shaping
  (groupes, stats) + composition des sections.
- `src/app/(public)/nos-recommandations/_components/Hero.tsx`.
- `src/app/(public)/nos-recommandations/_components/BentoSection.tsx`.
- `src/app/(public)/nos-recommandations/_components/RecommendationCard.tsx`.
- `src/app/(public)/nos-recommandations/_components/variants.ts` — `assignVariants`
  (pure, testée unitairement).

## Tests (TDD)

- **Unit** `variants.test.ts` : assignation des variantes (bigImage en tête,
  fallback texte sans photo, cycle, note pour sans-photo+note, groupe à 1 élément).
- **Unit** stats Hero (lieux/catégories/villes distinctes).
- **Intégration existants** : doivent rester verts sans modification (titre,
  catégorie, owner_note conditionnel, hrefs exacts, cross-city, empty state).

## Hors scope

- Pas de `?lodging=` ajouté aux liens.
- Pas de changement de la requête Prisma ni du modèle de données.
- Aucune autre page (les tokens ajoutés sont additifs).
- Effet décoratif `.noise` du mockup : optionnel, omis (non essentiel).
