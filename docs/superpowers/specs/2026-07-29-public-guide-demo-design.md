# Public Guide Demo Design

## Scope

Le bouton « Voir le guide d’exemple » de la home marketing ouvre une
démonstration publique du guide MyStay dans un modal au format smartphone. Il
ne change pas l’URL, ne pointe vers aucune route privée et n’utilise aucune
donnée de logement ou de voyageur réel.

La démonstration n’est pas une maquette parallèle. Elle et le guide privé
partagent un même composant `GuideApp`, les mêmes vues, les mêmes cartes POI,
la même fiche détaillée, la même navigation et la même carte Mapbox.

## Existing Architecture

Le guide privé est actuellement réparti entre plusieurs routes :

- `/nos-recommandations` charge les `LodgingFeaturedPoi` puis compose le hero,
  les groupes de recommandations et les cards ;
- `/le-logement` charge `LodgingCustomization`,
  `LodgingPracticalBlock` et `LodgingPublicProfile`, puis compose le guide
  logement ;
- `/map` charge les mêmes recommandations et les adapte à `GuestMap` ;
- les fiches `/guide/{city}/{category}/{poi}` chargent un `PoiDetail` et
  composent `PoiDetailBody` ;
- le layout public fournit le cadre mobile de 430 px, le menu et la navigation
  basse quand un cookie `lodging_id` valide est présent ;
- le proxy contrôle l’entrée QR, pose le cookie puis redirige l’arrivée ville
  vers `/nos-recommandations`.

Les données et l’interface sont donc déjà séparables, mais les composants
présentent encore des dépendances directes à Prisma, `next/link`, aux routes
privées et au pathname.

## Selected Architecture

### Shared application contract

Un bounded context `guide-app` porte les types et composants de présentation
normalisés :

```tsx
<GuideApp
  mode="private"
  lodging={lodging}
  pois={pois}
  initialView="home"
/>
```

et :

```tsx
<GuideApp
  mode="demo"
  lodging={demoLodging}
  pois={demoPois}
  initialView="home"
/>
```

`GuideApp` gère localement :

- `activeView` parmi `home`, `lodging`, `arrival`, `departure`, `practical`,
  `favorites`, `map` et `poi` ;
- `selectedPoiId` ;
- le filtre de catégorie partagé entre les vues favoris et carte ;
- le retour depuis une fiche ;
- la transition « Voir sur la carte », qui sélectionne le POI, ouvre la carte,
  centre son marqueur et affiche son aperçu.

Les composants de présentation ne connaissent ni Prisma, ni les cookies, ni
les UUID, ni les routes du guide. Ils reçoivent des données et des callbacks.
Le mode sert uniquement aux mentions de démonstration, aux informations
sensibles disponibles et aux adaptateurs d’accès.

### Private adapter

Un chargeur serveur `getPrivateGuideAppData` regroupe les queries actuellement
réparties entre recommandations, logement et carte, puis produit les types
normalisés `GuideLodging` et `GuidePoi`.

Les routes privées restent protégées par le proxy et
`getActiveLodgingContext`. Elles deviennent des adaptateurs minces qui
chargent les données privées et rendent `GuideApp` avec une vue initiale
appropriée :

- `/nos-recommandations` → `home` ;
- `/le-logement` → `lodging` ;
- `/map` → `map`.

Les URL directes continuent donc de fonctionner. Le QR code, le cookie, les
analytics de scan, Prisma et les routes de fiches historiques restent
inchangés. Un visiteur sans séjour ne peut jamais déclencher le chargeur
privé.

Les présentations existantes sont extraites plutôt que réécrites :

- `RecommendationsView`, `BentoSection` et `RecommendationCard` alimentent
  `GuideHome` et `FavoritesPage` ;
- le contenu de `/le-logement` alimente `LodgingPage`, `ArrivalPage`,
  `DeparturePage` et `PracticalInfoPage` ;
- `GuestMap` devient un adaptateur autour de la carte partagée ;
- `PoiDetailBody` délègue sa présentation commune à `PoiDetails`.

Les anciennes routes de détail restent utilisables et bénéficient des mêmes
composants extraits.

### Demo adapter

La démo importe deux constantes statiques côté client :

- `demoLodging`, logement fictif « Le Refuge du Mont-Blanc » ;
- `demoPois`, collection unique de 12 à 15 lieux publics réels.

Elle ne fait aucun fetch vers une route privée, n’importe aucun module Prisma,
ne lit aucun cookie et n’utilise aucun UUID réel. L’adresse exacte du logement
fictif est volontairement masquée ; son marqueur utilise un point générique du
centre de Saint-Gervais-les-Bains.

La collection statique peut être constituée à partir d'une lecture ponctuelle
des POI publics actifs déjà présents en base. Cette extraction est un
instantané de développement : aucune query Prisma n'est exécutée au chargement
du modal et aucun identifiant UUID de la base n'est conservé dans le bundle.

Les informations de démonstration comprennent des horaires d’arrivée et de
départ, un Wi-Fi fictif, des équipements, des consignes, les urgences publiques
et des services génériques. Aucun nom de voyageur, code d’accès, téléphone
privé ou commentaire d’hôte réel n’est inclus.

## Shared Data Types

Les types communs prolongent les modèles existants au lieu de créer un second
vocabulaire incompatible :

```ts
type GuidePoi = {
  id: string
  name: string
  slug: string
  category: {
    slug: string
    name: string
    icon: string
    color: string
  }
  description: string
  shortDescription: string
  photos: string[]
  latitude: number
  longitude: number
  address: string
  distanceLabel?: string
  durationLabel?: string
  recommended?: boolean
  familyFriendly?: boolean
  website?: string
  phone?: string
  directionsUrl: string
}
```

Les catégories restent des slugs métier existants plutôt qu’une union fermée,
afin que le guide privé puisse continuer à rendre toute taxonomie publiée.
Les données de détail utiles (`hours`, note, badges ou informations randonnée)
sont optionnelles et compatibles avec `PoiDetail`.

## POI Source Policy

La collection de démonstration contient environ quatorze POI couvrant
restaurants, activités, balades, famille, culture, commerces et sites
naturels. La sélection de départ comprend notamment :

- Tramway du Mont-Blanc ;
- Parc thermal du Fayet ;
- Maison Forte de Hautetour ;
- La Cure ;
- Pont du Diable ;
- Piscine de Saint-Gervais ;
- Thermes de Saint-Gervais ;
- Télécabine de l’Alpin vers Le Bettex ;
- Télécabine Le Bettex / Mont d’Arbois ;
- Rond de Carotte ;
- Bistrotsérac ;
- Boulangerie Petit Biscuit La Patinoire ;
- une balade officielle autour du Parc thermal ou du sentier du Berchat ;
- une activité familiale officielle du Bettex.

La randonnée « L'Alpage de Porcherey » est incluse avec ses métriques publiques
disponibles. En mode `demo`, sa fiche ne compose jamais les contrôles de
démarrage, la géolocalisation, le tracé de suivi ni `TrailNavigationMap`.

Chaque entrée doit posséder une fiche officielle Saint-Gervais ou opérateur,
une adresse publique, des coordonnées provenant du lien d’itinéraire officiel,
un site public vérifié et un `directionsUrl` Google Maps dérivé de ces
coordonnées. Les coordonnées ne sont ni générées ni estimées par Gemini.

Les images de cards utilisent les fallbacks éditoriaux locaux déjà présents
dans `/public/fallback` afin de ne pas copier des photos tierces ni ajouter des
domaines distants fragiles. Une attribution n’est donc pas nécessaire pour ces
illustrations génériques.

## Smartphone Modal

Le CTA est remplacé par un petit Client Component qui ne charge le modal
qu’après interaction. Le modal et la carte sont découpés dynamiquement ; la
home marketing conserve son rendu serveur et son poids initial.

Le modal utilise Radix Dialog, déjà installé, pour le focus trap, le retour du
focus, `Escape`, `role="dialog"`, `aria-modal` et le verrouillage du scroll.
Framer Motion, également installé, anime l’opacité de l’overlay et l’entrée /
sortie du téléphone.

Le cadre suit le contrat fourni :

- overlay `fixed inset-0 z-50`, fond ardoise translucide et
  `backdrop-blur-lg` ;
- téléphone de 360 px maximum et 720 px maximum, adapté à `100dvh` et
  `100vw` ;
- `rounded-[2.5rem]`, bordure blanche de 5 px, fond blanc,
  `overflow-hidden` ;
- ombre `0 35px 120px rgba(15,23,42,.55)` ;
- contenu interne scrollable, header et navigation basse fixes dans le cadre ;
- aucun bouton de fermeture flottant au-dessus du téléphone ;
- clic dans le téléphone arrêté avant l’overlay.

Sur les écrans très étroits, le cadre conserve une marge de 12 px et une
hauteur calculée, sans `zoom` ni `transform: scale()`.

## Mapbox Behaviour

La carte reste basée sur `react-map-gl/mapbox`, conformément à l’ADR-001. Elle
est importée uniquement lorsque la vue `map` devient active.

La carte partagée reçoit `pois`, `lodgingLocation`, `selectedPoiId`,
`selectedCategorySlug` et des callbacks. Elle :

- affiche le logement fictif et tous les POI filtrés ;
- conserve les couleurs et icônes par catégorie ;
- recentre les POI visibles lors d’un filtre ;
- effectue un `flyTo` vers un POI demandé depuis une card ou une fiche ;
- affiche une preview basse sans changer l’URL ;
- ouvre la fiche via le callback `onOpenPoi` ;
- expose l’itinéraire externe sans router vers le guide privé.

## Accessibility and Interaction

- Le trigger conserve un libellé explicite et un focus visible.
- Le titre et la description du Dialog sont reliés par les attributs Radix.
- La fermeture fonctionne par `Escape` ou clic overlay.
- Les clics internes ne ferment jamais le modal.
- Le focus initial vise le premier contrôle du guide ; à la fermeture, il
  revient au CTA.
- La navigation interne utilise des boutons avec `aria-current` ou
  `aria-pressed` selon le cas.
- Les zones scrollables conservent le défilement tactile et empêchent le
  scroll de la home.
- La préférence `prefers-reduced-motion` réduit les animations.

## Error and Fallback Behaviour

- Sans token Mapbox, la vue carte affiche un état explicite avec la liste des
  lieux et leurs boutons d’itinéraire ; le reste de la démo fonctionne.
- Une image absente utilise le fallback local de sa catégorie.
- Une donnée optionnelle absente masque l’action correspondante.
- La démo ne possède aucun loading réseau pour ses données ; seul le chunk
  Mapbox peut afficher un skeleton local.
- Une erreur de chargement du chunk modal ne déclenche aucune redirection.

## Verification

Les critères seront couverts avant l’implémentation par des tests ciblés :

- le CTA est un bouton, ne contient plus le UUID réel et ne navigue pas ;
- le Dialog possède le contrat visuel, les attributs ARIA, les fermetures et
  le verrouillage de scroll attendus ;
- `GuideApp` est rendu en `private` par les adaptateurs privés et en `demo` par
  le modal ;
- les deux modes utilisent les mêmes composants de vues ;
- `demoPois` est l’unique source des favoris, de la carte, des previews et des
  fiches ;
- filtres, sélection, détail et « Voir sur la carte » restent synchronisés ;
- aucune importation Prisma, route privée, UUID ou donnée réelle n’existe dans
  le bundle de démonstration ;
- le proxy et les accès QR / cookie existants gardent leurs tests ;
- le guide privé reste limité à 430 px, le modal à 360 px et aucun viewport
  mobile, tablette ou desktop ne déborde horizontalement ;
- lint, TypeScript, Jest, Playwright et build de production passent.

## Self-review

Le design respecte l’interface actuelle du guide en extrayant ses composants,
et non en créant une copie. Les chargeurs privés restent côté serveur derrière
le contrôle d’accès. La démo est entièrement statique et dissociée de Prisma.
La carte conserve Mapbox, la home reste Server Component, et les dépendances
Radix / Framer Motion existantes couvrent l’accessibilité et l’animation sans
nouvelle installation.
