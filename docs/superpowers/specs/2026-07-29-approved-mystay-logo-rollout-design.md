# Déploiement du logo MyStay approuvé — Design

## Objectif

Remplacer toutes les occurrences actives de l'ancien fichier `/logo.png` et
les représentations textuelles de marque du nouveau `GuideApp` par les
ressources validées dans `public/mystay-logo-approved`, sans modifier les
dimensions ni le comportement des interfaces.

## Décision

Créer un composant partagé `MyStayLogo` fondé sur `next/image`. Il expose deux
formes (`horizontal` et `mark`) et deux tons (`standard` et `reversed`) :

- `horizontal/standard` sur les fonds clairs ;
- `horizontal/reversed` sur les fonds sombres suffisamment larges ;
- `mark/standard` dans les cercles compacts des dashboards ;
- `mark/reversed` uniquement si un emplacement compact est directement posé
  sur un fond sombre.

Les dimensions restent contrôlées par les classes Tailwind de chaque
consommateur. Le composant conserve le ratio intrinsèque des PNG et n'utilise
ni zoom ni mise à l'échelle artificielle.

## Surfaces concernées

- header et footer marketing existants ;
- header du `GuideApp` privé/démonstration ;
- écrans Supabase Auth ;
- sidebar et header mobile du dashboard hébergeur ;
- sidebar et header mobile Super-admin ;
- favicon et icône Apple, déjà conformes et donc inchangés.

Les occurrences commentées et les contenus externes ne sont pas modifiés.

## Accessibilité et performance

- texte alternatif `MyStay` par défaut ;
- lien d'accueil conservé lorsqu'il existe déjà ;
- `priority` uniquement sur les logos visibles immédiatement ;
- fichiers `@4x` pour les logos horizontaux et marques HD ;
- aucune duplication d'asset.

## Vérification

- tests de résolution des variantes ;
- tests de rendu Auth, dashboard, admin, marketing et guide ;
- recherche résiduelle de `/logo.png` dans le code actif ;
- lint, TypeScript et build de production ;
- contrôle visuel mobile et desktop.

## Hors périmètre

- redessin du logo ;
- modification des couleurs approuvées ;
- changement de dimensions des layouts ;
- modification de l'authentification, des routes ou des données.
