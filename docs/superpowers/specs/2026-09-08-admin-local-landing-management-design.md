# Administration des landing pages locales

## Objectif

Le Super-admin gère depuis `/admin/landing-pages` les trois landings SEO d'une
ville existante : Conciergerie, Séminaires et Locations de vacances. Les
contenus ne dépendent plus d'un déploiement du code.

## Architecture retenue

Une `LocalLandingDestination` est reliée à une `City` existante et porte le
statut global de publication. Trois `LocalLandingPage`, une par intention,
stockent séparément les métadonnées et contenus éditoriaux. Les blocs répétables
(points forts, étapes et FAQ) restent structurés et sont validés selon
l'intention avant toute publication.

Les quatre destinations préparées dans le catalogue TypeScript sont migrées en
base sans perte de contenu. Les routes publiques, les metadata, le maillage
interne et le sitemap lisent ensuite cette source de vérité persistée.

## Publication

Un seul interrupteur active ou archive la ville. L'activation est refusée tant
que les contenus obligatoires Conciergerie et Séminaires sont incomplets. Ces
deux pages sont publiées ensemble. La page Locations de vacances n'est publiée
que si son contenu est complet et si au moins un profil logement public
éligible est associé à la ville. Une page non publiée répond 404 et reste hors
du sitemap.

Les contenus d'une ville active sont mis à jour immédiatement et les routes
concernées sont revalidées.

## Interface Admin

Le haut de l'écran devient un tableau responsive affichant une ligne par ville,
le statut des trois landings, le nombre d'avis et trois actions : interrupteur
global, crayon et corbeille. Le crayon déplie sous la ligne un éditeur composé de
trois accordéons. Les erreurs de complétude sont affichées dans l'accordéon
concerné.

Le bouton `Ajouter une ville` propose uniquement les villes actives déjà créées
dans Admin > Villes et dépourvues de configuration de landing pages.

## Archivage et suppression

Le slider archive ou réactive le groupe sans perdre son contenu. La corbeille
supprime logiquement la configuration complète : destination, trois pages et
avis. Tous ces éléments disparaissent de l'Admin actif, du site et du sitemap.
La `City`, ses logements, POI, articles et guides ne sont jamais affectés.

## Sécurité, validation et cohérence

Toutes les mutations sont réservées au rôle Admin et validées par Zod. La
création, l'archivage et la suppression sont transactionnelles. Les erreurs
suivent le contrat JSON commun. Aucun contenu vide ou placeholder ne peut être
indexé.

## Alternatives écartées

- Trois blocs JSON dans une seule ligne : évolution et validation trop fragiles.
- Écriture des constantes TypeScript depuis l'Admin : non persistante sur
  Vercel et nécessitant un déploiement.
- Suppression de la `City` : elle casserait des données métier indépendantes des
  landings.

