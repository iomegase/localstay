# Practical Block Amenity Icons — Design

## Contexte

Le dashboard Owner permet de choisir une icône Lucide pour chaque bloc pratique
personnalisé. Le catalogue central contient actuellement douze choix, mais ne
couvre pas plusieurs équipements fréquents d'un logement de montagne.

## Objectif

Ajouter cinq choix au catalogue existant, sans modifier la structure du
formulaire, le modèle Prisma ni le format de l'API :

| Libellé affiché | Slug persistant | Icône Lucide |
|---|---|---|
| Piscine | `waves-ladder` | `WavesLadder` |
| Jacuzzi | `bubbles` | `Bubbles` |
| Climatisation | `air-vent` | `AirVent` |
| Skis | `mountain-snow` | `MountainSnow` |
| Terrasse | `umbrella` | `Umbrella` |

## Architecture

Les cinq entrées sont ajoutées à `PRACTICAL_BLOCK_ICONS`, source unique du
sélecteur et de `PRACTICAL_BLOCK_ICON_SLUGS`. Le composant existant
`CategoryIcon` transforme les slugs kebab-case en exports Lucide React ; aucune
nouvelle table de correspondance ni aucun SVG personnalisé n'est nécessaire.

La route de personnalisation continue de valider l'icône contre
`PRACTICAL_BLOCK_ICON_SLUGS`. Une icône choisie est donc acceptée par l'API,
sauvegardée avec le bloc et réutilisée par les cartes du guide privé via le
même résolveur.

## Comportement UI

Les nouveaux boutons sont ajoutés à la suite du catalogue actuel dans le même
conteneur responsive. Ils conservent exactement les états, dimensions et
attributs accessibles existants : `aria-label`, `aria-pressed`, `title`, bordure
neutre au repos et fond sombre lorsque sélectionnés.

## Contrat et tests

La spec approuvée `012-guide-customization` est étendue par une règle métier
qui fixe les cinq libellés et slugs. Un critère de test unitaire couvre ce
catalogue.

Les tests vérifient que :

- les cinq couples libellé/slug sont exposés par le catalogue central ;
- les cinq slugs sont dérivés dans la liste acceptée par l'API ;
- le sélecteur rend les cinq boutons accessibles ;
- un clic sur un nouveau bouton met à jour l'icône du bloc.

## Hors périmètre

- création d'icônes SVG personnalisées ;
- modification du schéma Prisma ou du payload API ;
- réorganisation générale du sélecteur ;
- ajout automatique de blocs ou d'équipements à un logement.
