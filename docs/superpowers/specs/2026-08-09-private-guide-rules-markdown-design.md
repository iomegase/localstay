# Markdown des cartes de consignes du guide privé — Design

## Contexte

L'éditeur Owner des blocs pratiques affiche une aide Markdown, mais les cartes
rendues dans la page privée `Consignes du logement` n'utilisent pas toutes le
même moteur de rendu. Les cartes standard affichent leur description comme
texte brut, tandis que les cartes avec média, téléphone ou recyclage ne
prennent en charge qu'un sous-ensemble du gras. Des marqueurs tels que
`**sèche-cheveux**` restent donc visibles dans le guide.

## Objectif

Rendre le Markdown complet dans le contenu situé sous le titre de chaque bloc
pratique affiché dans `Consignes du logement`, sans modifier le titre, l'icône,
les médias ni les actions de la carte.

## Architecture

Le rendu réutilise `GuideDarkMarkdown`, le composant Markdown sécurisé déjà
employé par les consignes d'arrivée. Les descriptions des quatre variantes de
cartes pratiques lui sont transmises :

- carte standard ;
- carte avec photo ou vidéo ;
- carte avec numéro de téléphone ;
- carte de recyclage.

Les conteneurs actuels de type paragraphe sont remplacés par des conteneurs de
bloc lorsque nécessaire afin que les paragraphes, listes et sous-titres générés
produisent un HTML valide. Aucune nouvelle dépendance ni nouveau parseur n'est
ajouté.

## Comportement

- Le gras, l'italique, les listes ordonnées et non ordonnées, les liens, les
  headings et les retours à la ligne sont rendus.
- Le HTML brut reste ignoré via la configuration existante de
  `GuideDarkMarkdown`.
- Le texte conserve les couleurs et espacements adaptés aux cartes bleu nuit.
- Les titres, icônes, photos, vidéos, boutons d'appel et bouton Google Maps ne
  changent pas.
- Le Markdown s'applique uniquement à la description sous le titre de la
  carte ; le titre demeure du texte simple.

## Données et sécurité

Aucune modification du modèle Prisma, de l'API, de la validation ou des données
persistées. Le contenu existant est interprété à l'affichage. React Markdown
continue d'échapper le texte et d'ignorer le HTML brut.

## Tests

Les tests vérifient qu'une description de bloc rend au minimum le gras et une
liste sans afficher leurs marqueurs Markdown, puis confirment le même moteur sur
les variantes standard et média. Les tests existants des cartes et de la page
privée restent verts.

## Traçabilité

La spec approuvée `012-guide-customization` reçoit une règle métier dédiée au
rendu Markdown des descriptions de blocs pratiques. La matrice de traçabilité
relie cette règle aux composants et aux tests concernés.

## Hors périmètre

- champ de titre Markdown ;
- modification de l'éditeur Owner ;
- migration de données ;
- changement de disposition des cartes ;
- Markdown dans les autres champs du guide privé.
