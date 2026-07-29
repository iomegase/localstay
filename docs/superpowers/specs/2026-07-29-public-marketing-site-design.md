# Public Marketing Site Design

## Scope

Intégrer le frontend éditorial de `references/mystay-maquette` dans le projet
principal sans modifier la maquette ni remplacer les données, l'authentification
ou le guide voyageur existants.

## Architecture

Le groupe `(public)` conserve ses routes. Son layout devient contextuel par
route : les pages marketing, notamment `/`, restent toujours dans le SiteFrame,
même lorsqu'un cookie logement existe. Les routes séjour gardent le cadre
mobile, le menu et la navigation basse actuels. Le proxy marque les routes
marketing, autorise leur liste fermée et continue de réécrire toutes les
surfaces privées vers `/acces-reserve`.

Les fiches logement publiées `/guide/{city}/logements/{slug}` sont des surfaces
d'acquisition et utilisent donc elles aussi le SiteFrame marketing de 1184 px,
même lorsqu'un cookie séjour est présent. La liste City
`/guide/{city}/logements` et les autres routes du Guide ne changent pas.

La zone « En détail » est plus compacte que dans la maquette de référence afin
de réduire son poids vertical : elle affiche au plus cinq faits réels
(`surface_m2`, `max_guests`, `bedroom_count`, `bed_count`,
`bathroom_count`) dans une seule bande sur desktop, puis en lignes resserrées
sur mobile. Aucun prix, horaire, minimum de séjour ou règlement n'est déduit.

Les blocs `OwnerRecommendationsBlock` (« Guide local » et « À découvrir
ailleurs ») ne sont pas composés dans la fiche marketing. Leurs données,
queries et usages dans le Guide restent inchangés.

Les équipements et services connus utilisent des icônes Lucide sémantiques :
`Coffee`, `Plane`, `SprayCan`, `ConciergeBell`, `ShoppingBasket` et
`WavesLadder`. L'icône `Sparkles` est réservée aux libellés non reconnus.

L'accueil séjour est `/nos-recommandations`. Le QR
`/guide/{city}?lodging={uuid}` pose le cookie puis redirige vers
`/nos-recommandations?lodging={uuid}` afin de préserver le scan et d'éviter
toute collision avec la home marketing.

Les composants visuels partagés vivent dans `src/features/marketing/components`.
Ils utilisent Tailwind 3 et `next/image`. Les contenus logement et blog sont lus
par les queries Prisma existantes ; une query globale de profils logement
publiés complète la query par ville sans changer le schéma.

## Components

- `MarketingHeader`: navigation responsive et accès `/auth/login`.
- `MarketingFooter`: navigation, contact et mentions.
- `MarketingShell`: reproduit le `SiteFrame` de la maquette. Il place le header,
  le main et le footer dans une surface blanche unique, centrée, limitée à
  1184 px, arrondie à 42 px puis à 34 px dès 1280 px et ombrée avec
  `0 30px 90px rgba(0,0,0,.28)` à partir de 768 px. Sous 768 px, la surface
  est bord à bord, sans rayon ni ombre.
- `MarketingPropertyCard`: carte dynamique conforme à la maquette.
- `MarketingHome`: hero, services, logements, guide et CTA.
- `EditorialPage`: primitives de sections réutilisées par Concept et Séminaires.
- La fiche logement publique compose ses données existantes dans la hiérarchie
  visuelle de la fiche `[slug]` de la maquette : en-tête éditorial, galerie
  asymétrique, récit avec encart séjour, essentiels, cartes de confort, pièces,
  localisation, FAQ et CTA. Les composants métier interactifs existants sont
  conservés quand ils restent adaptés.
- `LodgingMarketingGallery`, `LodgingEssentials` et
  `LodgingFeatureSections` isolent la présentation de la fiche sans déplacer
  la logique métier dans les composants.

## Data flow

La home et `/logements` appellent directement Prisma depuis des Server
Components. Les liens des cartes pointent vers les fiches publiées existantes.
Le blog conserve les queries, metadata, sanitization Markdown et JSON-LD de la
spec 029. Aucun nouvel endpoint HTTP ni stockage n'est ajouté.

À partir de 1280 px, les valeurs du bloc « Large desktop calibration » de la
maquette sont contractuelles : shell interne de 944 px, header de 62 px, logo
de 118 px, hero de 560 px minimum avec padding `60px 52px 43px` et rayon de
26 px. Ces valeurs remplacent les dimensions marketing précédentes. Elles sont
scopées aux composants `Marketing*` et ne modifient pas le shell privé de
430 px du guide voyageur.

## Error handling

Une base sans logement ou blog publié produit un état vide éditorial HTTP 200.
Les erreurs et 404 des fiches existantes ne sont pas modifiées. Le formulaire
propriétaire reste un `mailto`, donc aucune donnée n'est envoyée à MyStay.

## Verification

Les tests couvrent la liste fermée de routes anonymes, le maintien des routes
privées, la query globale, les liens Auth/QR et le contrat visuel du `SiteFrame`.
Ils vérifient aussi qu'une fiche logement publique utilise la surface de
1184 px tandis que les autres routes séjour restent limitées à 430 px, que sa
hiérarchie suit la maquette et que le bloc « En détail » reste compact sans
débordement.
Lint, `tsc --noEmit`, Jest, build de production et Playwright vérifient ensuite
les largeurs 375, 768 et 1440 px, `scrollWidth === clientWidth`, les dimensions
calculées de la surface et du hero, ainsi que l'isolation du guide à 430 px.

## Blog article and seminar fidelity

La page dynamique `/blog/{slug}` reprend la composition de
`references/mystay-maquette/app/blog/[slug]/page.tsx` sans remplacer son modèle
de données. Son introduction est une grille asymétrique avec le retour, la
catégorie, le titre, l'extrait et les métadonnées à gauche, puis la couverture
arrondie à droite. Le corps conserve le Markdown nettoyé, les metadata et le
JSON-LD de la spec 029. Il est présenté avec un sommaire latéral, une colonne de
lecture, un CTA sombre et une section d'articles associés alimentée uniquement
par les articles publiés. L'absence de couverture ou d'articles associés
produit un repli éditorial sans donnée inventée.

La page `/seminaires` reproduit la structure et les dimensions de
`references/mystay-maquette/app/seminaires/page.tsx` : hero chalet de 590 px
minimum avec padding `58px 54px 42px`, quatre cartes de services de 270 px,
section sombre « Le bon cadre », trois cartes de formats, section sombre du
processus en quatre étapes et CTA final. Les textes, icônes, dégradés, rayons,
espacements et ruptures à 1050 px et 760 px suivent la feuille de styles de la
maquette. Le CTA conserve le `mailto` MyStay et aucun formulaire ni stockage
n'est ajouté.

Les deux pages restent à l'intérieur du `MarketingShell` commun de 1184 px. Les
styles sont exprimés avec Tailwind, sans `zoom`, sans `transform: scale()` et
sans modifier le shell privé du Guide.

## Self-review

Le design ne contient aucun placeholder, ne change ni le schéma ni les API, et
sépare explicitement le site marketing du guide privé. Le périmètre correspond
à la maquette et à la demande approuvée du Product Owner.
