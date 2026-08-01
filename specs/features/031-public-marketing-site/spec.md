# Spec — 031 Public Marketing Site

## Metadata

```yaml
id: 031-public-marketing-site
title: "Frontend public éditorial MyStay"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-07-29
updated_at: 2026-07-29
depends_on:
  - 006-qr-code
  - 009-auth-owner
  - 028-lodging-showcase-seo
  - 029-blog-editorial
bounded_context: marketing
mockup_reference: references/mystay-maquette
implementation_gate: "Demande explicite du Product Owner du 2026-07-29"
```

## Context

La racine publique anonyme affiche actuellement l'écran « Accès sur invitation ».
MyStay doit disposer d'un site éditorial public reprenant fidèlement la maquette
`references/mystay-maquette`, sans altérer l'expérience privée des voyageurs
entrée par lien ou QR code.

Le site public présente la conciergerie, son approche, ses séminaires, ses
logements publiés et son blog. Les logements et articles restent alimentés par
les queries Prisma existantes. L'accueil du séjour est déplacé de la racine
vers `/nos-recommandations` afin de réserver `/` au site public ; les autres
routes privées, l'authentification et les API existantes restent inchangées.

## Glossary References

- **Tourist**
- **Guide**
- **Lodging**
- **Lodging Public Profile**
- **Blog Article**
- **Owner**
- **QR Code**

## User Stories

### US-01 — Découvrir MyStay sans invitation

**As a** visiteur anonyme  
**I want to** consulter le site éditorial public  
**So that** je comprenne les services de MyStay avant de confier ou réserver un logement

#### Acceptance Criteria

- **AC-01-01**: Given avec ou sans cookie séjour, When le visiteur ouvre `/`,
  Then la home éditoriale MyStay s'affiche toujours et non le guide logement ni
  l'écran « Accès sur invitation ».
- **AC-01-02**: Given aucun cookie séjour, When le visiteur ouvre `/concept`,
  `/seminaires`, `/confier-mon-logement`, `/logements` ou `/blog`, Then la route
  reste publiquement accessible.
- **AC-01-03**: Given une largeur de 375, 768 ou 1440 px, When une page marketing
  s'affiche, Then le header, le footer, les sections, boutons et cartes suivent
  la maquette sans débordement horizontal.
- **AC-01-04**: Given une largeur d'au moins 768 px, When une page marketing
  s'affiche, Then le header, le contenu principal et le footer sont réunis dans
  un panneau blanc centré de 1184 px maximum, avec un rayon de 42 px et une
  ombre diffuse `0 30px 90px rgba(0,0,0,.28)` sur un fond gris clair. Given une
  largeur inférieure à 768 px, Then ce panneau devient bord à bord, sans rayon
  ni ombre.
- **AC-01-05**: Given une largeur d'au moins 1280 px, When la home marketing
  s'affiche, Then le calibrage desktop de la maquette est appliqué sans mise à
  l'échelle artificielle : surface de 1184 px avec rayon de 34 px, conteneurs
  éditoriaux de 944 px, header de 62 px, logo de 118 px et hero de 560 px
  minimum avec un padding `60px 52px 43px` et un rayon de 26 px.
- **AC-01-06**: Given la page `/seminaires`, When elle s'affiche, Then sa
  composition reprend scrupuleusement la maquette Séminaires : hero chalet de
  590 px minimum avec padding desktop `58px 54px 42px`, quatre cartes de
  services, section sombre « Le bon cadre », trois formats, processus sombre
  en quatre étapes et CTA final, avec les adaptations responsive prévues à
  1050 px et 760 px.

### US-02 — Préserver le guide voyageur privé

**As a** voyageur invité  
**I want to** conserver mon accès par lien ou QR code  
**So that** le nouveau site public ne casse pas mon séjour

#### Acceptance Criteria

- **AC-02-01**: Given une URL `/guide/{city}?lodging={uuid}`, When elle est
  ouverte, Then le cookie `lodging_id` est posé et la redirection vers
  `/nos-recommandations?lodging={uuid}` ouvre l'accueil privé du séjour.
- **AC-02-02**: Given un cookie séjour valide, When le voyageur ouvre
  `/nos-recommandations`, Then la home privée de séjour existante s'affiche.
- **AC-02-03**: Given aucun cookie séjour, When le visiteur ouvre une surface
  privée `/le-logement`, `/nos-recommandations`, `/map`, `/mes-favoris` ou
  `/services-prives`, Then l'écran « Accès sur invitation » reste appliqué.
- **AC-02-04**: Given un utilisateur authentifié, When il ouvre une route
  dashboard, merchant ou admin, Then les règles Supabase Auth et de rôle
  existantes restent inchangées.
- **AC-02-05**: Given un séjour actif, When une page du guide voyageur
  s'affiche, Then son shell historique reste limité à 430 px et n'hérite
  d'aucune dimension du shell marketing.

### US-03 — Consulter les contenus métier existants

**As a** visiteur anonyme  
**I want to** voir les logements et articles publiés  
**So that** le site public reflète les données validées dans MyStay

#### Acceptance Criteria

- **AC-03-01**: Given des Lodging Public Profiles publiés, When `/logements`
  s'affiche, Then seuls les profils publiés, actifs et non supprimés sont listés
  avec un lien vers leur fiche existante `/guide/{city}/logements/{slug}`.
- **AC-03-02**: Given des logements publiés, When la home s'affiche, Then au plus
  deux logements mis en avant utilisent les mêmes données Prisma.
- **AC-03-03**: Given aucun logement publié, When la home ou `/logements`
  s'affiche, Then un état vide éditorial est rendu sans erreur.
- **AC-03-04**: Given des Blog Articles publiés, When `/blog` ou
  `/blog/{slug}` s'affiche, Then les données, règles de publication, metadata,
  Markdown nettoyé et JSON-LD de la spec 029 sont conservés.
- **AC-03-05**: Given un Lodging Public Profile publié, When sa fiche
  `/guide/{city}/logements/{slug}` s'affiche, Then elle utilise le même
  `MarketingShell` que la home, avec une surface de 1184 px maximum sur desktop,
  sans modifier le shell de 430 px des autres routes privées du guide.
- **AC-03-06**: Given un Lodging Public Profile publié, When sa fiche
  `/guide/{city}/logements/{slug}` s'affiche, Then sa hiérarchie visuelle suit
  la fiche `[slug]` de la maquette : titre éditorial, galerie asymétrique,
  histoire du logement avec encart séjour, caractéristiques essentielles,
  cartes de confort, pièces, localisation, FAQ et CTA selon les données
  disponibles.
- **AC-03-07**: Given une fiche logement sur desktop, When la section
  « En détail » s'affiche, Then elle présente au plus cinq faits réellement
  renseignés dans une bande compacte en une seule rangée, sans prix, horaire,
  disponibilité ni règle inventés. Given une largeur mobile, Then les mêmes
  faits restent lisibles dans une liste compacte sans débordement horizontal.
- **AC-03-08**: Given une fiche logement marketing, When elle s'affiche, Then
  aucun bloc « Guide local », « Les recommandations de votre hôte » ou
  « À découvrir ailleurs » n'est rendu dans la fiche. Les recommandations et
  commentaires Owner restent conservés dans les données et les autres parcours
  du Guide.
- **AC-03-09**: Given les équipements « Petit-déjeuner », « Transfert
  aéroport », « Ménage », « Conciergerie », « Courses à l'arrivée » ou
  « Piscine », When leurs lignes sont rendues, Then chacune utilise un
  pictogramme Lucide sémantique distinct et non l'icône générique de repli.
- **AC-03-10**: Given un article publié, When `/blog/{slug}` s'affiche, Then la
  page suit la maquette article : introduction asymétrique texte/image,
  sommaire latéral, colonne Markdown lisible, CTA sombre et articles publiés
  associés, tout en conservant metadata, sanitization, JSON-LD et 404 de la
  spec 029.

### US-04 — Accéder à l'espace propriétaire

**As an** Owner  
**I want to** utiliser la connexion existante depuis le header marketing  
**So that** le nouveau frontend ne crée pas un second système d'authentification

#### Acceptance Criteria

- **AC-04-01**: Given le header marketing, When l'Owner active « Se connecter »,
  Then il atteint `/auth/login`.
- **AC-04-02**: Given `/connexion`, When la route est ouverte, Then elle redirige
  vers `/auth/login`.
- **AC-04-03**: Given `/confier-mon-logement`, When le formulaire est envoyé,
  Then le comportement `mailto:bonjour@mystay.city` de la maquette est conservé
  et aucune nouvelle donnée personnelle n'est persistée par MyStay.

### US-05 — Essayer publiquement le guide MyStay

**As a** visiteur anonyme  
**I want to** ouvrir un guide complet de démonstration depuis la home  
**So that** je découvre l'expérience voyageur sans accéder à un véritable séjour

#### Acceptance Criteria

- **AC-05-01**: Given la home marketing, When le visiteur active « Voir le
  guide d'exemple », Then un modal smartphone s'ouvre sans changement d'URL,
  sans navigation vers `/logements` ou une route `/guide/*`, et sans cookie de
  séjour.
- **AC-05-02**: Given le modal ouvert, When il est affiché, Then son cadre fait
  au plus 360 px de large et 720 px de haut, possède une bordure blanche de
  5 px, des coins fortement arrondis, une ombre portée prononcée et un overlay
  translucide en verre dépoli laissant la home visible.
- **AC-05-03**: Given le modal ouvert, When le visiteur utilise la touche
  `Escape` ou clique l'overlay, Then le modal se ferme et rend le focus au
  trigger. Given un clic dans le guide, Then le modal reste ouvert et la home
  ne défile pas. Aucun bouton de fermeture flottant n'est affiché au-dessus du
  téléphone.
- **AC-05-04**: Given le guide de démonstration, When le visiteur navigue,
  Then les vues accueil, logement, arrivée, départ, informations pratiques,
  coups de cœur, carte et fiche POI fonctionnent comme une mini-application
  sans `router.push()` vers une route privée.
- **AC-05-05**: Given les modes privé et démonstration, When leurs écrans sont
  rendus, Then ils composent le même `GuideApp` et les mêmes composants de
  présentation ; seules la source des données, l'autorisation, les données
  sensibles et la mention de démonstration diffèrent.
- **AC-05-06**: Given la démonstration, When ses POI sont utilisés, Then une
  seule collection statique `demoPois` de 12 à 15 POI publics réels de
  Saint-Gervais-les-Bains alimente les aperçus d'accueil, les coups de cœur,
  les filtres, la carte et les fiches détaillées.
- **AC-05-07**: Given un POI sélectionné depuis les coups de cœur ou sa fiche,
  When le visiteur active « Voir sur la carte », Then la vue carte s'ouvre,
  centre le POI, sélectionne son marqueur et affiche sa carte d'aperçu.
- **AC-05-08**: Given le POI randonnée « L'Alpage de Porcherey », When sa fiche
  de démonstration s'affiche, Then sa difficulté, sa durée, sa distance et son
  dénivelé sont visibles, mais aucun contrôle « Démarrer », navigation GPS ou
  suivi de randonnée n'est proposé.
- **AC-05-09**: Given le bundle de démonstration, When il est inspecté ou
  exécuté, Then il n'appelle aucune route privée, ne lit aucun UUID de Lodging
  réel, ne charge aucune donnée de voyageur et ne dépend d'aucune
  authentification.
- **AC-05-10**: Given l'accueil du GuideApp, When les raccourcis « Arrivée » et
  « Wi-Fi » sont rendus, Then leurs pictogrammes utilisent un traitement
  neutre `slate-100` / `slate-600` sans accent rose. Given le header du guide,
  Then le monogramme MyStay approuvé est affiché seul dans un format plus
  imposant et la ville reste visible.
- **AC-05-11**: Given la vue « Nos coups de cœur » du `GuideApp`, When la liste
  des POI défile verticalement, Then le titre et l'introduction quittent
  normalement la zone visible tandis que la rangée de filtres devient sticky
  immédiatement sous le header de l'application. Given cette rangée, Then son
  scroll horizontal reste fonctionnel et sa scrollbar reste masquée.
- **AC-05-12**: Given la vue « Nos coups de cœur » du guide de démonstration,
  When les POI sont rendus, Then ils utilisent la hiérarchie bento du guide
  privé : une première carte carrée sur deux colonnes puis des cartes carrées
  sur une colonne. Given chaque carte, Then elle possède toujours une image
  plein cadre, utilise la hero administrée lorsqu'elle existe et un fallback de
  catégorie en son absence ou en cas d'échec de chargement ; aucune variante
  blanche n'est rendue.
- **AC-05-13**: Given la fiche détaillée d'un POI possédant des informations de
  randonnée, When son contenu est rendu, Then le bloc « Les informations du
  parcours » apparaît après l'attribution photo éventuelle et avant le bouton
  « Voir sur la carte ». Given le mode démonstration, Then les métriques restent
  visibles et aucun démarrage ou suivi GPS n'est activé.

## Business Rules

- **BR-01**: `references/mystay-maquette` est en lecture seule et ne reçoit
  aucune modification.
- **BR-02**: Les routes marketing anonymes sont exactement `/`, `/concept`,
  `/seminaires`, `/confier-mon-logement`, `/connexion`, `/logements`,
  `/logements/*`, `/blog`, `/blog/*` et les fiches logement publiques
  `/guide/{city}/logements/{slug}`. La liste City
  `/guide/{city}/logements` reste une surface du Guide.
- **BR-03**: Les routes privées du guide conservent le contrôle par cookie
  `lodging_id`; la branche QR `/guide/*` reste prioritaire dans le proxy et
  atterrit sur `/nos-recommandations`, jamais sur la home marketing `/`.
- **BR-04**: Aucune API, table Prisma, règle Auth, donnée ou fonctionnalité
  existante n'est supprimée.
- **BR-05**: Les logements marketing proviennent uniquement des Lodging Public
  Profiles `published`, non soft-deleted, rattachés à un Lodging et une City
  actifs.
- **BR-06**: Les articles marketing conservent les règles de la spec 029.
- **BR-07**: L'interface utilise Next.js Server Components par défaut,
  `next/image`, Lucide React et Tailwind CSS 3 du projet principal.
- **BR-08**: Aucun `zoom` ni `transform: scale()` n'est utilisé pour reproduire
  les proportions responsive.
- **BR-09**: Le header, le footer, les couleurs `#1e293b`, `#db2777`,
  `#64748b`, les espacements, boutons, cartes et sections suivent la maquette
  fournie.
- **BR-10**: La connexion marketing réutilise Supabase Auth via `/auth/login`.
- **BR-11**: Le formulaire propriétaire ne persiste aucune donnée et prépare un
  e-mail via le client du visiteur.
- **BR-12**: Le shell marketing reproduit le `SiteFrame` de la maquette :
  marge extérieure de 20 à 24 px à partir de 768 px, surface blanche de 1184 px
  maximum, `overflow: hidden`, rayon de 42 px puis 34 px à partir de 1280 px,
  ombre `0 30px 90px rgba(0,0,0,.28)`. Le header n'est pas détaché de cette
  surface.
- **BR-13**: Les valeurs du bloc de calibration desktop de la maquette
  (`@media (min-width: 1280px)`) priment sur les dimensions marketing
  antérieures. Elles ne s'appliquent jamais au guide voyageur privé.
- **BR-14**: La présence d'un cookie `lodging_id` ne change jamais le contenu ni
  le shell de `/`. Les routes marketing sont identifiées par le proxy et
  exclues explicitement du shell privé du guide.
- **BR-15**: Une fiche logement publique utilise le `MarketingShell` existant
  sans dupliquer ses dimensions. Son contenu, ses données, ses metadata, son
  JSON-LD et ses CTA de la spec 028 restent inchangés.
- **BR-16**: La fiche publique reprend la structure visuelle de
  `references/mystay-maquette/app/logements/[slug]/page.tsx` en composants
  Tailwind du projet principal. Les données statiques de la maquette ne sont
  jamais copiées dans la fiche dynamique.
- **BR-17**: Le bloc « En détail » utilise uniquement, lorsqu'ils existent,
  `surface_m2`, `max_guests`, `bedroom_count`, `bed_count` et
  `bathroom_count`. Il ne fabrique aucune valeur d'arrivée, de départ, de prix
  ou de durée minimale.
- **BR-18**: La fiche logement marketing ne rend pas
  `OwnerRecommendationsBlock`. Cette décision de présentation ne supprime ni
  les données `LodgingFeaturedPoi`, ni leurs queries, ni le composant partagé,
  ni leur usage dans le Guide voyageur.
- **BR-19**: Les services connus utilisent les icônes Lucide suivantes :
  `Coffee` pour le petit-déjeuner, `Plane` pour le transfert aéroport,
  `SprayCan` pour le ménage, `ConciergeBell` pour la conciergerie,
  `ShoppingBasket` pour les courses à l'arrivée et `WavesLadder` pour la
  piscine. `Sparkles` reste uniquement le repli des libellés inconnus.
- **BR-20**: La page article reprend la structure de
  `references/mystay-maquette/app/blog/[slug]/page.tsx` avec les données Prisma
  dynamiques. Les articles associés sont exclusivement `published`, distincts
  de l'article courant et limités à trois.
- **BR-21**: La page Séminaires reprend la structure, les dimensions et les
  ruptures responsive de
  `references/mystay-maquette/app/seminaires/page.tsx`. Son CTA conserve le
  `mailto:bonjour@mystay.city` et ne crée aucun stockage.
- **BR-22**: Le guide de démonstration n'a aucune route dédiée. Il est monté
  uniquement dans un modal de la home marketing et sa navigation reste un état
  client local.
- **BR-23**: `GuideApp` est le composant de présentation commun aux modes
  `private` et `demo`. Les pages privées restent des Server Components
  protégés qui adaptent leurs queries Prisma au contrat de `GuideApp`; la démo
  importe exclusivement des constantes statiques.
- **BR-24**: `demoLodging` est entièrement fictif et n'utilise ni UUID réel, ni
  nom de voyageur, ni code d'accès, ni adresse de résidence exacte, ni numéro
  privé. Son emplacement cartographique correspond à un point générique du
  centre-ville.
- **BR-25**: `demoPois` est un instantané éditorial statique de POI publics
  actifs déjà présents dans le Guide et vérifiés par une source officielle.
  Les identifiants UUID de la base ne sont jamais copiés dans cet instantané.
- **BR-26**: Les vues coups de cœur, carte, accueil et fiche détaillée utilisent
  la même référence `demoPois`; aucune seconde liste de POI n'est maintenue.
- **BR-27**: La carte de démonstration conserve Mapbox via
  `react-map-gl/mapbox`, est chargée dynamiquement uniquement lors de son
  ouverture et ne déclenche aucune géolocalisation du visiteur.
- **BR-28**: Les randonnées peuvent présenter leurs métriques publiques
  vérifiées, mais le mode `demo` masque systématiquement le démarrage, la
  navigation GPS et le suivi de tracé.
- **BR-29**: Le modal utilise Radix Dialog pour le contrôle du focus, `Escape`,
  `role="dialog"`, `aria-modal` et le verrouillage du scroll. Framer Motion
  anime l'ouverture et la fermeture dans le respect de
  `prefers-reduced-motion`.
- **BR-30**: Le bouton menu interne au guide reste affiché. Le modal ne rend
  aucun bouton de fermeture flottant ; `Escape` et l'overlay sont ses deux
  mécanismes visuels de fermeture.
- **BR-31**: La rangée de filtres de `GuideFavoritesPage` utilise le
  positionnement sticky CSS natif dans le conteneur scrollable du `GuideApp`.
  Aucun listener de scroll, observer, calcul JavaScript de hauteur ou état React
  supplémentaire n'est ajouté. Le comportement est commun aux modes `demo` et
  `private`.
- **BR-32**: La refonte bento de `GuideFavoritesPage` utilise un composant de
  présentation dédié au contrat `GuidePoi`. Elle reproduit les styles des
  variantes illustrées de `/nos-recommandations` sans importer ses `Link`, ses
  types Prisma ni ses routes privées. Le composant privé
  `RecommendationCard`, le header, l'introduction, les filtres sticky, la
  navigation et les autres vues du `GuideApp` ne sont pas modifiés.
- **BR-33**: `GuidePoiDetails` place physiquement la section randonnée avant le
  bouton Carte dans le JSX afin d'aligner les ordres DOM, visuel et clavier.
  Aucun style, métrique, callback, règle `canStartTrail` ou action externe n'est
  modifié par ce déplacement.

## Data Model

Aucun changement de schéma. La feature lit les modèles existants
`LodgingPublicProfile`, `LodgingPhoto`, `LodgingAmenity`, `City`,
`BlogArticle`, `LodgingCustomization`, `LodgingFeaturedPoi` et
`PointOfInterest`. La démonstration consomme un instantané TypeScript statique
de données publiques, jamais une query Prisma dans le navigateur.

## API Contract

Aucune nouvelle route API. Les Server Components appellent directement les
queries Prisma existantes ou une query de lecture globale ajoutée au bounded
context `lodging-showcase`.

## UI Behaviour

- Le header est intégré en haut de la surface blanche, avec logo MyStay,
  navigation desktop, bouton connexion circulaire, CTA sombre et menu mobile.
- Sur les pages marketing, le header, le `<main>` et le footer sont les trois
  enfants directs d'une surface éditoriale blanche commune. Cette surface est
  centrée et ombrée sur tablette/desktop, puis redevient bord à bord sur mobile.
- À partir de 1280 px, la home reprend les dimensions exactes du calibrage
  desktop de la maquette : shell 944 px, hero 560 px, padding
  `60px 52px 43px`, header 62 px et logo 118 px.
- La home utilise le hero chalet sombre, les blocs de services, les cartes
  logements dynamiques, la présentation du guide et le CTA propriétaire de la
  maquette.
- Les fiches logement publiques réutilisent le header, la surface et le footer
  de la home. Leur contenu dynamique est recomposé selon la hiérarchie de la
  fiche `[slug]` de la maquette, sans modifier les queries, metadata, JSON-LD
  ni règles métier de la spec 028.
- La section « En détail » est volontairement plus compacte que la maquette :
  titre et faits sont réunis dans une bande claire, avec au plus cinq
  caractéristiques sur une rangée desktop et des lignes resserrées sur mobile.
- Les blocs de recommandations Owner et inter-ville ne sont pas affichés sur
  la fiche logement marketing.
- L'accueil séjour privé vit sur `/nos-recommandations`. Les liens « Bienvenue »
  et « Coup de cœur » du guide ainsi que l'atterrissage QR utilisent cette
  route ; `/` reste exclusivement la home marketing.
- Le footer sombre reprend les colonnes de navigation et le contact MyStay.
- Les pages éditoriales partagent le même shell, la même échelle typographique,
  les mêmes rayons et les mêmes CTA.
- La page article utilise une grille d'introduction asymétrique, une couverture
  arrondie, un sommaire latéral, une colonne de lecture, un CTA sombre et des
  cartes liées, sans remplacer son Markdown dynamique par le contenu statique
  de la maquette.
- La page Séminaires reprend le hero chalet, les quatre cartes de services, les
  sections sombres « Le bon cadre » et « Une organisation simple », les trois
  formats et le CTA final de la maquette.
- « Voir le guide d'exemple » est un bouton de Dialog, jamais un lien. Son
  activation charge dynamiquement le modal puis rend `GuideApp` en mode
  `demo`, sans modifier l'URL.
- Le téléphone de démonstration possède une zone de contenu interne scrollable,
  un header et une navigation basse fixes dans le cadre. L'overlay laisse la
  home visible derrière un flou de verre.
- `GuideApp` utilise une navigation interne commune aux modes privé et démo.
  Les adaptateurs privés chargent les données réelles après validation du
  séjour ; l'adaptateur de démonstration fournit uniquement `demoLodging` et
  `demoPois`.
- La fiche de randonnée de démonstration rend les caractéristiques de
  Porcherey et les actions externes autorisées, mais aucun bouton de démarrage
  ni composant `TrailNavigationMap`.
- La mise en page est mobile-first, devient multi-colonnes sur tablette et
  desktop et ne dépend d'aucun facteur de zoom.
- En mode séjour actif, le layout public mobile existant et la navigation basse
  du guide restent utilisés.

## Acceptance Criteria

| ID | Test |
|---|---|
| AC-01-01 | unit + integration |
| AC-01-02 | unit |
| AC-01-03 | e2e |
| AC-01-04 | integration + e2e |
| AC-01-05 | integration + e2e |
| AC-01-06 | integration + e2e |
| AC-02-01 | e2e existant + unit |
| AC-02-02 | integration existant |
| AC-02-03 | unit |
| AC-02-04 | integration existant |
| AC-02-05 | integration |
| AC-03-01 | unit + integration |
| AC-03-02 | integration |
| AC-03-03 | integration |
| AC-03-04 | tests spec 029 existants |
| AC-03-05 | integration + e2e |
| AC-03-06 | integration + e2e |
| AC-03-07 | unit + e2e |
| AC-03-08 | integration |
| AC-03-09 | unit |
| AC-03-10 | integration + e2e |
| AC-04-01 | integration |
| AC-04-02 | integration |
| AC-04-03 | integration |
| AC-05-01 | unit + integration + e2e |
| AC-05-02 | integration + e2e |
| AC-05-03 | unit + e2e |
| AC-05-04 | integration + e2e |
| AC-05-05 | unit + integration |
| AC-05-06 | unit |
| AC-05-07 | unit + e2e |
| AC-05-08 | integration |
| AC-05-09 | unit + security regression |
| AC-05-10 | integration + e2e |

## Out of Scope

- Nouveau système d'authentification.
- Réservation, calendrier, prix, paiement ou disponibilité.
- Persistance serveur du formulaire propriétaire.
- Modification des dashboards, API, schéma Prisma ou données existantes.
- Déploiement ou push Git.
- Refonte visuelle des surfaces privées du guide.
- Route publique dédiée à la démonstration.
- Persistance des interactions de la démonstration.
- Géolocalisation, démarrage ou suivi GPS d'une randonnée en mode démo.

## Open Questions

| ID | Question | Owner | Resolution |
|---|---|---|---|
| OQ-00 | Aucune question ouverte. | Product Owner | resolved |
