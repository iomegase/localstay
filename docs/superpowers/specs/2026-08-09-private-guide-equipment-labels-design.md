# Libellés Équipements du guide privé — Design

## Contexte

La vue technique `rules` regroupe désormais le règlement intérieur et les
blocs pratiques du logement. Son titre principal a déjà été modifié localement
en `Les Équipements`, mais l'onglet et la carte d'accès utilisent encore le
vocabulaire `Consignes`, tandis que leur compteur affiche le nombre de règles.

## Objectif

Harmoniser tous les libellés visibles de cet accès autour du terme
`Équipements` et afficher le nombre réel de blocs pratiques configurés pour le
logement.

## Comportement UI

- L'onglet du livret affiche `Équipements` à la place de `Consignes`.
- La carte du hub logement affiche `Équipements` à la place de
  `Consignes du logement`.
- Son sous-texte affiche `0 équipements`, `1 équipement` ou `N équipements`
  selon `lodging.practicalCards.length`.
- Le titre principal de la sous-page reste `Les Équipements`.
- Le titre `Règlement intérieur` et son contenu restent inchangés.
- Les icônes, couleurs, espacements et interactions existants sont conservés.

## Architecture et compatibilité

Le changement reste présentationnel. La vue interne conserve la clé `rules` et
la route canonique reste `/sejour/logement/consignes`, afin de préserver les
liens, favoris et tests de navigation existants. Aucun modèle Prisma, contrat
API ou champ persistant n'est modifié.

## Données

Le compteur utilise directement `lodging.practicalCards.length`, déjà fourni
par `getPrivateGuideData`. Il n'utilise plus `lodging.houseRules.length`. Une
fonction locale de pluralisation produit le libellé singulier uniquement pour
la valeur `1`.

## Tests

Les tests vérifient :

- le libellé `Équipements` dans l'onglet ;
- le titre `Équipements` de la carte du hub ;
- le compteur basé sur les blocs pratiques et sa pluralisation ;
- la navigation inchangée vers la vue interne `rules` ;
- la route canonique `/sejour/logement/consignes` inchangée.

## Hors périmètre

- renommage de la route `/sejour/logement/consignes` ;
- renommage du type technique `rules` ;
- modification du règlement intérieur ;
- changement d'icône ou de disposition ;
- modification des blocs pratiques ou de leur ordre.
