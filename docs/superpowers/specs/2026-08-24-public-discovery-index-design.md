# Hub public Découvrir

Date : 2026-08-24
Feature : `041-public-local-discovery`
Décision Product Owner : validée le 2026-08-24

## Objectif

Créer la page publique et indexable `https://www.mystay.city/decouvrir` afin de
relier le site marketing aux pages locales déjà publiées. Le footer expose un
lien intitulé exactement « Découvrir » vers cette page.

Le hub ne présente jamais une ville sans contenu public. Une ville apparaît
uniquement lorsqu'elle possède au moins un POI qui satisfait encore toutes les
règles de visibilité de la spec 041.

## Expérience utilisateur

La page réutilise le `MarketingShell`, le header, le footer, les couleurs, les
rayons et la typographie MyStay.

Elle contient :

1. un hero éditorial avec un H1 unique présentant la découverte locale MyStay ;
2. une section par ville éligible, les villes étant classées alphabétiquement ;
3. pour chaque ville, son nom, un lien principal vers
   `/decouvrir/{city-slug}` et au maximum ses cinq premiers POI publics ;
4. des cartes POI réutilisant le composant public existant et pointant vers
   leur fiche canonique détaillée ;
5. un état vide éditorial si aucune ville n'est actuellement publiable.

Dans chaque ville, les POI suivent le tri public existant : zone principale
avant la zone « Aux alentours », puis distance depuis le centre-ville, puis
nom. Une ville contenant moins de cinq POI affiche uniquement ceux qui existent.

## Architecture

Une query dédiée au hub est ajoutée au bounded context `public-discovery`. Elle
effectue une seule lecture Prisma, applique le même filtre défensif et le même
helper de visibilité que les pages `/decouvrir/[city-slug]`, groupe les résultats
par ville, applique les tris définis ci-dessus puis limite chaque groupe à cinq
POI.

Le DTO du hub contient uniquement les données publiques nécessaires : résumé
de la ville et cartes POI déjà assainies. Aucun cookie séjour, Lodging, Owner ou
contenu privé n'est lu.

La route `src/app/(public)/decouvrir/page.tsx` reste un Server Component. Elle
charge la query une fois, génère les metadata et rend un composant de
présentation dédié. Aucun état client n'est nécessaire.

## SEO et maillage interne

- canonical auto-référente : `/decouvrir` ;
- metadata Open Graph et Twitter cohérentes avec le contenu visible ;
- JSON-LD `BreadcrumbList` et `ItemList` limité aux villes réellement rendues ;
- ajout de `/decouvrir` au sitemap statique, sans créer un second doublon de la
  home ;
- liens de ville canoniques vers `/decouvrir/{city-slug}` ;
- cartes POI vers `/decouvrir/{city-slug}/{category-slug}/{poi-slug}`.

## Footer

La colonne existante intitulée « Découvrir » reçoit un lien supplémentaire :

```text
Découvrir → /decouvrir
```

Le libellé « Découvrir nos destinations » est explicitement exclu.

## États et erreurs

- Une ligne `PUBLISHED` devenue inéligible est filtrée par la défense applicative
  partagée et ne contribue ni à une ville, ni aux cinq POI, ni au JSON-LD.
- Une ville sans POI visible est omise.
- Une indisponibilité Prisma suit le comportement d'erreur serveur existant ; la
  page ne remplace pas une erreur d'infrastructure par un faux état vide.
- L'échec d'une photo distante conserve le fallback local déterministe de
  `RemotePoiImage`.

## Vérification

- test unitaire/contractuel de la query : filtre strict, une requête, groupement,
  tri alphabétique des villes, tri des POI et limite de cinq par ville ;
- test d'intégration de la page : H1, état vide, liens ville et POI, maximum de
  cinq cartes par ville, metadata et JSON-LD ;
- test d'intégration du footer : lien exact « Découvrir » vers `/decouvrir` ;
- test sitemap : entrée `/decouvrir` unique ;
- test responsive navigateur à 375, 768 et 1440 px sans débordement horizontal.

## Hors périmètre

- publication automatique de nouveaux POI ;
- choix manuel ou ordre éditorial spécifique des villes ;
- pagination, recherche ou filtres sur le hub ;
- contenu privé du séjour ;
- nouvelle API publique ou nouvelle table Prisma.
