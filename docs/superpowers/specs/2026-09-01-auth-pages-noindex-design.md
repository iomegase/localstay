# Auth Pages Noindex Design

## Context

Les pages d'authentification `/auth/login`, `/auth/register`,
`/auth/forgot-password` et `/auth/reset-password` sont fonctionnelles mais ne
constituent pas des pages d'acquisition. Elles sont déjà absentes du sitemap,
mais elles n'exposent pas encore de directive `noindex` explicite.

## Décision validée

Le layout commun `src/app/auth/layout.tsx` exporte les metadata produites par
`privatePageMetadata('Authentification')`. Les quatre routes héritent ainsi de
la politique exacte `index: false`, `follow: false`, `noarchive: true` sans
duplication par page et sans changement visuel.

`/auth` reste crawlable dans `robots.txt` afin que les moteurs puissent lire la
directive `noindex`. Les routes restent absentes du sitemap.

## Alternatives écartées

- Déclarer les metadata dans chacune des quatre pages : duplication et risque
  de divergence lors de l'ajout d'une route d'authentification.
- Interdire `/auth` dans `robots.txt` : empêcherait Google de relire le
  `noindex` et pourrait retarder le retrait d'une URL déjà connue.
- Ajouter un canonical : une page non indexable n'a pas besoin d'être rattachée
  à une page publique équivalente.

## Périmètre technique

- modifier la spec 042 avec un critère d'acceptation dédié ;
- ajouter un test d'intégration ciblant les metadata du layout commun ;
- exporter les metadata depuis `src/app/auth/layout.tsx` ;
- mettre à jour la matrice de traçabilité ;
- vérifier les tests SEO, le lint et le build Next.js.

## Hors périmètre

- aucune modification d'interface ou du fonctionnement de l'authentification ;
- aucune modification de base de données ou d'API ;
- aucune règle `Disallow: /auth` ;
- aucune soumission automatique à Google Search Console.

## Auto-revue

La solution couvre les quatre routes demandées grâce à leur parent App Router
commun. Elle réutilise la politique privée existante et ne crée aucune nouvelle
source de vérité. Aucun point fonctionnel, juridique, monétaire ou relatif aux
données utilisateur ne reste ouvert.
