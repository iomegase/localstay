# Arrival Instruction Card Layout — Design

## Contexte

Chaque consigne d'arrivée est rendue dans une carte sombre numérotée. Le numéro
est actuellement placé à gauche de tout le contenu Markdown, ce qui réduit la
largeur disponible pour les paragraphes, listes et médias.

Les consignes utilisent désormais systématiquement un titre Markdown en
première ligne, par exemple `# Accès au garage`.

## Objectif

Réorganiser chaque carte selon une hiérarchie à deux niveaux :

```text
[1]  ACCÈS AU GARAGE

Pour vous rendre directement au garage…
• 2 places de parking…
• Places 46 & 47

[photos] [vidéo]
```

La pastille numérotée et le titre forment la première ligne. Le contenu et les
médias commencent ensuite au bord intérieur gauche de la carte, alignés sous la
pastille, afin d'utiliser toute la largeur disponible.

## Architecture

`ArrivalInstructionCard` extrait le premier heading Markdown de
`instruction.text`. Ce heading devient le titre de l'en-tête. Le Markdown
restant est rendu par `GuideDarkMarkdown` dans un bloc distinct pleine largeur.

L'extraction reste locale à la couche de présentation : aucune modification du
type `GuideArrivalInstruction`, de l'API, des données Prisma ou du formulaire
Owner n'est requise.

Pour préserver l'affichage d'une éventuelle ancienne donnée sans heading, le
composant utilise `Instruction N` comme titre de repli et rend tout le texte
comme contenu.

## Comportement UI

- En-tête `flex` : pastille circulaire fixe, puis titre en capitales.
- Contenu Markdown : nouvelle ligne, largeur complète, sans retrait gauche.
- Photos et vidéo : nouvelle ligne sous le contenu, largeur disponible complète,
  sans l'ancien `pl-10`.
- La disposition est identique sur mobile et desktop dans le shell de 430 px.
- Les lightboxes photo et vidéo conservent leur fonctionnement actuel.

## Tests

Les tests unitaires vérifient :

- l'extraction d'un titre Markdown de niveau 1 à 3 ;
- le titre et le numéro dans le même en-tête ;
- le contenu et les médias hors de cet en-tête, sans retrait gauche ;
- le titre de repli pour une consigne historique sans heading ;
- l'ouverture inchangée des lightboxes photo et vidéo.

## Hors périmètre

- ajout d'un champ `title` persistant ;
- migration Prisma ou changement d'API ;
- modification de l'éditeur de consignes ;
- modification du contenu des consignes existantes.
