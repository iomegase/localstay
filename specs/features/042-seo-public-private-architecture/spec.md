# Spec — 042 SEO Public / Private Architecture

## Metadata

```yaml
id: 042-seo-public-private-architecture
title: "Séparation SEO entre contenus publics et guide privé"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-08-28
updated_at: 2026-08-28
depends_on:
  - 006-qr-code
  - 028-lodging-showcase-seo
  - 029-blog-editorial
  - 031-public-marketing-site
  - 034-private-guide-app
  - 041-public-local-discovery
bounded_context: seo
implementation_gate: "Conception validée par le Product Owner le 2026-08-28"
supersedes:
  - "028 et 031 pour les URL publiques de logements"
  - "031 pour la destination canonique d'une entrée QR avec Lodging ; confirme 034"
  - "006 pour la destination publique d'un QR City historique sans Lodging"
  - "041 BR-20 et Out of Scope pour la migration des logements"
```

## Context

MyStay expose aujourd'hui sous le même namespace `/guide` des contenus publics
indexables et des surfaces privées liées à un séjour. Les fiches logement
publiques utilisent aussi `/guide/{ville}/logements/{slug}`, tandis que les POI
publics ont déjà leur espace canonique sous `/decouvrir`.

Cette superposition crée un risque d'indexation des guides privés, de contenus
dupliqués après rewrite vers `/acces-reserve`, de canonical contradictoires et
d'URL contenant un identifiant de Lodging. La cible sépare strictement :

- le marketing et les logements publics sous `/` et `/logements` ;
- la découverte locale publique sous `/decouvrir` ;
- le guide voyageur privé sous `/sejour` ;
- `/guide` comme couche de compatibilité temporaire, jamais comme support SEO.

La migration doit préserver tous les QR déjà imprimés et toutes les anciennes
URL publiques au moyen de redirections permanentes lorsqu'un équivalent public
existe.

## Glossary References

- **GEO**
- **Guide**
- **Lodging**
- **Lodging Public Profile**
- **POI**
- **QR Code**
- **Tourist**
- **VacationRental Structured Data**

## User Stories

### US-01 — Ne pas indexer un séjour privé

**As a** Tourist utilisant un guide de logement

**I want to** conserver un espace privé absent des moteurs de recherche

**So that** le contexte de mon séjour et ses anciennes URL ne deviennent pas des pages SEO

#### Acceptance Criteria

- **AC-01-01**: Given `/sejour` ou un de ses descendants, When la page est
  rendue, Then ses metadata contiennent `index: false`, `follow: false` et
  `noarchive: true`.
- **AC-01-02**: Given `/le-logement`, `/nos-recommandations`, `/map`,
  `/mes-favoris`, `/contact`, `/services-prives` ou une ancienne route privée
  équivalente, When elle est rendue, Then les mêmes directives robots sont
  présentes.
- **AC-01-03**: Given une surface privée demandée sans séjour valide, When le
  proxy affiche l'accès réservé, Then `/acces-reserve` est `noindex`, aucun
  contenu privé n'est chargé et l'URL demandée ne devient pas une page
  indexable dupliquée.
- **AC-01-04**: Given `robots.txt`, When un moteur le lit, Then les surfaces
  privées ne sont pas bloquées par une règle qui empêcherait la lecture du
  `noindex`.

### US-02 — Publier les logements sous une URL propre

**As a** visiteur public

**I want to** consulter un logement sur `/logements/{slug}`

**So that** la fiche ne soit pas confondue avec le guide privé

#### Acceptance Criteria

- **AC-02-01**: Given un Lodging Public Profile publié, actif et non supprimé,
  When `/logements/{slug}` est demandé, Then la fiche répond 200 avec le
  `MarketingShell` existant et les données de la spec 028.
- **AC-02-02**: Given un slug inconnu, non publié, inactif ou supprimé, When la
  route courte est demandée, Then elle répond 404 avec des metadata
  non indexables.
- **AC-02-03**: Given `/guide/{ville}/logements/{slug}`, When le logement public
  existe, Then la réponse est une redirection permanente 308 vers
  `/logements/{slug}`.
- **AC-02-04**: Given `/guide/{ville}/logements`, When la liste historique est
  demandée sans entrée QR, Then la réponse est une redirection permanente 308
  vers `/logements`.
- **AC-02-05**: Given un logement public, When ses cards, metadata, canonical,
  OpenGraph, breadcrumbs et JSON-LD sont générés, Then ils utilisent tous
  `/logements/{slug}`.

### US-03 — Préserver les QR et les séjours existants

**As a** Tourist utilisant un QR déjà imprimé

**I want to** continuer à ouvrir mon guide privé

**So that** la migration SEO soit transparente

#### Acceptance Criteria

- **AC-03-01**: Given `/guide/{ville}?lodging={uuid}` avec un Lodging valide,
  When l'URL est ouverte, Then le cookie séjour existant est posé ou renouvelé
  et la destination est `/sejour?lodging={uuid}`.
- **AC-03-02**: Given une URL `/guide/*` portant `?lodging={uuid}`, When elle
  correspond à une entrée QR ou à une navigation privée compatible, Then la
  branche séjour est évaluée avant toute redirection SEO.
- **AC-03-03**: Given un séjour valide, When une ancienne surface privée
  compatible sous `/guide` est utilisée, Then elle reste fonctionnelle et
  `noindex` pendant la période de migration.
- **AC-03-04**: Given un UUID invalide, When il est fourni dans `lodging`, Then
  il n'est ni stocké comme cookie ni inclus dans une URL du sitemap.
- **AC-03-05**: Given un QR City historique `/guide/{ville}` sans paramètre
  Lodging, When il est ouvert, Then il redirige en 308 vers
  `/decouvrir/{ville}` si la City est publiable, sinon vers le hub public
  `/decouvrir`; aucune donnée de séjour n'est exposée.

### US-04 — Conserver `/decouvrir` comme source publique des POI

**As a** visiteur ou un moteur de recherche

**I want to** trouver les POI publiés uniquement sous `/decouvrir`

**So that** chaque adresse dispose d'une URL publique canonique unique

#### Acceptance Criteria

- **AC-04-01**: Given un POI publié et éligible selon la spec 041, When son
  ancienne URL `/guide/{ville}/{categorie}/{poi}` est demandée anonymement,
  Then elle redirige en 308 vers `/decouvrir/{ville}/{categorie}/{poi}`.
- **AC-04-02**: Given une ancienne URL ville ou catégorie possédant un
  équivalent public, When elle est demandée anonymement, Then elle redirige en
  308 vers son équivalent `/decouvrir`.
- **AC-04-03**: Given un contenu non publié ou sans équivalent public, When une
  ancienne URL SEO est demandée anonymement, Then elle répond 404 et ne révèle
  aucune donnée privée.
- **AC-04-04**: Given toute page `/decouvrir`, When ses metadata et JSON-LD sont
  générés, Then son canonical pointe vers elle-même et aucun contexte Lodging
  n'est lu.

### US-05 — Exposer un graphe SEO cohérent

**As a** moteur de recherche ou un système génératif

**I want to** recevoir des metadata et données structurées cohérentes

**So that** MyStay, ses logements et ses adresses publiques soient compris sans ambiguïté

#### Acceptance Criteria

- **AC-05-01**: Given la homepage, When ses metadata sont générées, Then son
  titre absolu est `Conciergerie en Haute-Savoie | MyStay`, sa description
  présente la gestion de locations saisonnières et son canonical est `/`.
- **AC-05-02**: Given le schéma `Organization`, When il est émis, Then son
  `@id` stable est `https://www.mystay.city/#organization` et seules des
  informations réellement connues et publiques sont incluses.
- **AC-05-03**: Given un logement public, When `LodgingBusiness` ou
  `VacationRental` est émis, Then son URL est la route courte et sa relation à
  l'organisation utilise le `@id` stable.
- **AC-05-04**: Given un POI public, When sa catégorie ou sous-catégorie permet
  un mapping sans ambiguïté, Then le type Schema.org spécialisé est utilisé ;
  sinon `LocalBusiness` reste le fallback.
- **AC-05-05**: Given une donnée structurée, When elle est inspectée, Then tous
  les faits balisés sont visibles sur la page et issus de données MyStay
  validées.

### US-06 — Publier uniquement des URL indexables dans le sitemap

**As a** moteur de recherche

**I want to** recevoir un sitemap limité aux pages publiques canoniques

**So that** je ne parcours aucun séjour, token ou doublon historique

#### Acceptance Criteria

- **AC-06-01**: Given le sitemap, When il est généré, Then il contient les
  pages marketing indexables, `/logements`, les fiches `/logements/{slug}`
  publiées, `/decouvrir/*` publié et `/blog/*` publié.
- **AC-06-02**: Given le sitemap, When il est inspecté, Then `/sejour`,
  `/guide`, `/acces-reserve`, `/contact`, `/le-logement`,
  `/nos-recommandations`, `/map`, `/mes-favoris`, `/services-prives`, les
  espaces authentifiés et les API sont absents.
- **AC-06-03**: Given toute entrée de sitemap, When son URL est validée, Then
  elle ne contient ni query string, ni UUID, ni token de séjour.
- **AC-06-04**: Given les pages publiques indexables, When leurs metadata sont
  inspectées, Then chacune possède son canonical propre et aucun canonical
  global accidentel n'est hérité.

### US-07 — Préserver l'accessibilité et réduire le coût des polices

**As a** visiteur mobile

**I want to** pouvoir agrandir la page et charger seulement les polices utiles

**So that** le site reste accessible et performant

#### Acceptance Criteria

- **AC-07-01**: Given le viewport racine, When il est généré, Then il ne
  contient ni `maximumScale: 1` ni `userScalable: false`.
- **AC-07-02**: Given les cartes Mapbox, When le zoom de page est réactivé,
  Then leurs contrôles et gestes propres restent fonctionnels.
- **AC-07-03**: Given les familles chargées dans le root layout, When leur usage
  est audité, Then une famille inutilisée est retirée et une famille
  décorative ponctuelle utilise `preload: false` lorsque Next.js le permet.
- **AC-07-04**: Given les surfaces existantes, When l'optimisation des fonts est
  appliquée, Then aucun rendu utilisant réellement une famille n'est modifié.

## Business Rules

- **BR-01**: Les espaces indexables sont `/`, les pages marketing explicitement
  publiées, `/logements`, `/logements/{slug}`, `/decouvrir/*` et `/blog/*`.
- **BR-02**: `/sejour/*`, `/guide/*` en mode privé, `/acces-reserve`,
  `/le-logement`, `/nos-recommandations`, `/map`, `/mes-favoris`, `/contact`,
  `/services-prives` et leurs anciennes équivalences sont privés et portent
  `noindex`, `nofollow`, `noarchive`.
- **BR-03**: `/contact` n'est pas une page marketing dans cette feature. Elle
  est retirée du sitemap et reste non indexable jusqu'à une spec publique
  dédiée.
- **BR-04**: Les surfaces privées restent crawlables afin que les moteurs
  puissent lire `noindex`. `robots.txt` ne constitue jamais leur seul contrôle.
- **BR-05**: Le contrôle d'accès applicatif reste obligatoire ; les metadata
  robots ne sont pas une mesure de sécurité.
- **BR-06**: La branche QR avec un UUID valide est évaluée avant toute
  redirection SEO ou règle de confinement `/guide`.
- **BR-07**: La destination canonique d'une entrée QR est `/sejour`, ce qui
  remplace les destinations historiques `/nos-recommandations` définies dans
  la spec 031 lorsqu'un UUID Lodging valide est présent.
- **BR-07A**: Un QR City historique de la spec 006 sans contexte Lodging reste
  fonctionnel comme accès public : il redirige vers la City `/decouvrir`
  éligible ou, à défaut, vers le hub `/decouvrir`. Il n'active aucun séjour.
- **BR-08**: `/guide` ne sert plus de support SEO public. Il reste uniquement
  une couche de redirection publique et de compatibilité privée temporaire.
- **BR-09**: Les POI publics ont exclusivement `/decouvrir` comme namespace
  canonique, conformément à la spec 041.
- **BR-10**: Un contenu historique ne redirige en 308 que si son équivalent
  public est publié et éligible. Sans équivalent, la réponse anonyme est 404.
- **BR-11**: Les Lodging Public Profiles utilisent un slug globalement unique.
  Un slug publié reste stable et ne peut pas être changé automatiquement.
- **BR-12**: Avant la migration d'unicité, un audit en lecture seule recherche
  les collisions. Aucun doublon n'est renommé sans validation explicite du
  Product Owner.
- **BR-13**: Après résolution des collisions éventuelles, Prisma impose
  `@unique` sur `LodgingPublicProfile.slug`. Les slugs futurs en conflit sont
  suffixés de manière lisible, en privilégiant le slug City.
- **BR-14**: Une URL publique de logement est toujours
  `/logements/{lodging-slug}`. Le City slug ne fait pas partie du chemin.
- **BR-15**: Les cards, liens marketing, liens blog ou `/decouvrir`, metadata,
  OpenGraph, canonical, breadcrumbs, sitemap et JSON-LD utilisent la même URL
  courte.
- **BR-16**: Le sitemap n'accepte aucune query string, aucun UUID et aucun
  token. Les entrées sont construites depuis des enregistrements publiés,
  actifs et non soft-deleted.
- **BR-17**: Aucun canonical global n'est défini dans le root layout. Chaque
  page indexable définit le sien.
- **BR-18**: La homepage utilise un titre et une description propres à la
  conciergerie. Les valeurs par défaut du site restent des fallbacks, jamais le
  positionnement sémantique forcé de `/`.
- **BR-19**: `Organization` utilise l'`@id`
  `https://www.mystay.city/#organization`. `name`, `url`, `logo`,
  `description`, `email`, `telephone`, `areaServed` et `sameAs` ne sont émis
  que lorsque leur valeur est publique et vérifiée.
- **BR-20**: `LodgingBusiness` et `VacationRental` référencent l'organisation
  stable comme `provider` lorsque le schéma logement est éligible.
- **BR-21**: Le mapping POI autorisé est : restaurant → `Restaurant`,
  boulangerie → `Bakery`, bar → `BarOrPub`, hôtel → `Hotel`, magasin → `Store`,
  spa → `DaySpa`, musée → `Museum`, activité touristique →
  `TouristAttraction`. Toute taxonomie ambiguë utilise `LocalBusiness`.
- **BR-22**: Le mapping Schema.org est déterministe, testé et basé sur les
  slugs canoniques de Category/SubCategory ; aucun type n'est déduit librement
  depuis le texte descriptif.
- **BR-23**: Les faits du JSON-LD sont issus des champs structurés MyStay et
  doivent être visibles dans la page correspondante.
- **BR-24**: Le root viewport autorise le pinch-to-zoom. Le comportement
  Mapbox reste géré par les composants carte.
- **BR-25**: Les polices réellement utilisées sont conservées. Les polices
  inutilisées sont retirées ; les familles décoratives ponctuelles évitent le
  preload initial lorsque possible.
- **BR-26**: Cette migration ne refait aucun design et ne modifie aucune valeur
  métier logement ou POI.
- **BR-27**: Les helpers de routage séparent au minimum la détection QR, les
  routes marketing, les routes privées, les anciennes URL SEO et la validation
  du cookie séjour. Leurs priorités sont couvertes par des tests unitaires.
- **BR-28**: Les redirections ne suppriment aucune route requise pour un séjour
  actif avant que son remplacement `/sejour` soit livré et testé.

## Data Model

La migration remplace l'unicité par City du slug public logement par une
unicité globale. Aucun autre champ n'est ajouté.

```prisma
model LodgingPublicProfile {
  id         String   @id @default(uuid())
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  deleted_at DateTime?

  lodging_id String  @unique
  lodging    Lodging @relation(fields: [lodging_id], references: [id])

  city_id String
  city    City   @relation(fields: [city_id], references: [id])

  slug String @unique

  // Les autres champs de la spec 028 restent inchangés.
}
```

Invariants :

- l'unicité porte aussi sur les lignes soft-deleted afin qu'une URL publique ne
  soit jamais réattribuée à un autre logement ;
- un audit de collisions précède la migration ;
- une collision bloque la migration tant qu'une résolution Product Owner n'est
  pas fournie ;
- aucun enregistrement n'est supprimé physiquement.

## API Contract

Aucune nouvelle route API n'est introduite.

- Les Server Components publics lisent directement les queries Prisma du
  bounded context `lodging-showcase`.
- Les routes API historiques de la spec 028 restent disponibles pour leurs
  consommateurs existants ; leurs DTO conservent `city_slug`, mais les liens
  publics exposés utilisent `/logements/{slug}`.
- Les payloads de mutation de profil existants continuent d'être validés avec
  Zod et doivent retourner l'erreur structurée existante en cas de slug déjà
  utilisé.

## UI Behaviour

### Pages publiques

- `/` conserve son design et reçoit uniquement des metadata propres à la
  conciergerie.
- `/logements` conserve son listing marketing global.
- `/logements/{slug}` réutilise sans refonte la fiche logement et le
  `MarketingShell` des specs 028 et 031.
- `/decouvrir/*` conserve les vues de la spec 041 et leurs canonical propres.
- `/blog/*`, `/concept`, `/seminaires` et `/confier-mon-logement` conservent
  leur rendu et reçoivent ou gardent leur canonical propre.

### Pages privées

- Un layout privé partagé applique les metadata robots aux pages `/sejour/*`.
- Les routes privées historiques qui ne peuvent pas encore rejoindre ce layout
  réutilisent une constante metadata partagée afin d'obtenir exactement les
  mêmes directives sans divergence.
- `/acces-reserve` n'affiche aucune donnée Lodging et reste non indexable.
- `/contact` reste une surface privée dans cette feature, même si son composant
  possède encore un rendu sans Lodging ; elle n'apparaît jamais dans le
  sitemap.

### Redirections et erreurs

- Les redirections historiques publiques sont 308 et conservent uniquement les
  paramètres non sensibles explicitement autorisés. Aucun UUID ou token n'est
  propagé vers une URL publique.
- Les contenus inconnus, non publiés ou inéligibles répondent 404 aux visiteurs
  anonymes.
- Un UUID `lodging` invalide est ignoré par la branche QR puis traité par le
  contrôle d'accès normal.
- Une erreur Prisma n'expose aucun détail interne et ne transforme jamais une
  surface privée en contenu public.

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | `/sejour/*` porte noindex/nofollow/noarchive | unit + integration |
| AC-01-02 | Anciennes routes privées portent les mêmes robots | unit + integration |
| AC-01-03 | Rewrite accès réservé sans page indexable dupliquée | integration + e2e |
| AC-01-04 | robots.txt laisse lire le noindex | unit |
| AC-02-01 | Fiche `/logements/{slug}` publiée → 200 | integration + e2e |
| AC-02-02 | Fiche non publique → 404/noindex | integration |
| AC-02-03 | Ancienne fiche logement → 308 | unit + e2e |
| AC-02-04 | Ancienne liste City → `/logements` | unit + e2e |
| AC-02-05 | Liens, canonical, OG, breadcrumbs et JSON-LD migrés | unit + integration |
| AC-03-01 | QR valide → cookie et `/sejour` | unit + e2e |
| AC-03-02 | Priorité QR sur SEO | unit + e2e |
| AC-03-03 | Compatibilité privée `/guide` | regression + e2e |
| AC-03-04 | UUID invalide absent du cookie/sitemap | unit + contract |
| AC-03-05 | QR City historique → découverte publique | unit + e2e |
| AC-04-01 | Ancien POI public → 308 `/decouvrir` | unit + e2e |
| AC-04-02 | Ancienne ville/catégorie → 308 si publiée | unit + e2e |
| AC-04-03 | Ancien contenu non public → 404 | security regression + e2e |
| AC-04-04 | `/decouvrir` auto-canonical sans Lodging | unit + integration |
| AC-05-01 | Metadata homepage conciergerie | unit + integration |
| AC-05-02 | Organization avec `@id` stable et faits connus | unit |
| AC-05-03 | Schemas logement sur URL courte et provider stable | unit |
| AC-05-04 | Mapping POI spécialisé avec fallback | unit |
| AC-05-05 | Parité JSON-LD / contenu visible | unit + integration |
| AC-06-01 | Sitemap contient seulement les espaces publics | unit + contract |
| AC-06-02 | Toutes les surfaces privées sont exclues | unit + contract |
| AC-06-03 | Aucun token, UUID ou query dans le sitemap | unit + security regression |
| AC-06-04 | Canonical propre à chaque page publique | unit + integration |
| AC-07-01 | Pinch-to-zoom autorisé | unit |
| AC-07-02 | Zoom Mapbox préservé | e2e |
| AC-07-03 | Polices inutiles ou preload superflu supprimés | unit + build inspection |
| AC-07-04 | Rendu typographique existant préservé | integration + e2e |

## Out of Scope

- Refonte visuelle des pages publiques ou privées.
- Suppression physique immédiate de toutes les routes `/guide`.
- Création d'une page marketing publique `/contact`.
- Modification du contenu éditorial des POI ou logements ; voir spec 043.
- Réservation, prix, disponibilités, paiement ou compte Tourist.
- Modification des règles de publication POI de la spec 041.
- Ajout d'informations Organization non vérifiées.
- Déploiement Vercel, soumission Search Console ou demande de réindexation.

## Open Questions

Aucune question ouverte. Décisions du Product Owner du 2026-08-28 :

- `/guide` et `/sejour` ne sont jamais des supports SEO publics ;
- `/decouvrir` est le namespace canonique exclusif des POI publics ;
- les logements publics utilisent `/logements/{slug}` ;
- les slugs logements deviennent globalement uniques après audit ;
- `/contact` reste privée et non indexable dans cette feature ;
- les QR historiques restent prioritaires et atterrissent sur `/sejour`.
