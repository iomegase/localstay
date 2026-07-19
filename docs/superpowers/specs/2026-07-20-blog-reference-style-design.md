# Blog Reference Style Design

**Date:** 2026-07-20

**Feature:** `029-blog-editorial`

## Goal

Aligner le contenu des pages publiques `/blog` et `/blog/[slug]` sur les screenshots Chalet Manager fournis par le Product Owner, sans modifier le header, le footer, la navigation basse ou les règles métier MyStay.

## Scope

- Conserver le Server Component, la requête des articles publiés, le filtre City, les URLs canoniques et l'état vide existants.
- Modifier uniquement la composition visuelle du contenu de `/blog` et `/blog/[slug]`.
- Ne pas ajouter de filtre catégorie fonctionnel : les pilules reproduisent le vocabulaire visuel en affichant les catégories présentes dans la liste.
- Ne pas modifier les pages Admin ou le layout public partagé.

## Visual contract

- Fond du contenu gris ardoise très clair.
- Surtitre `BLOG & GUIDES` en petites capitales semi-grasses et fortement espacé.
- Titre principal fin, uppercase, sur une à deux lignes selon la largeur.
- Introduction italique gris-bleu avec interligne ample.
- Breadcrumb uppercase espacé `ACCUEIL / BLOG`.
- Rangée de pilules : première pilule sombre `TOUTES`, puis catégories présentes en blanc avec ombre douce.
- Grille de deux colonnes à partir de 375 px, sans débordement horizontal.
- Cartes carrées, coins très arrondis, image plein cadre, voile noir léger et ombre courte.
- Titre de l'article centré verticalement, uppercase, fin et blanc.
- Catégorie en pilule sombre translucide, ancrée en bas à droite.
- Au survol desktop, léger zoom de l'image et voile plus sombre ; sur mobile, les informations restent visibles.

### Article detail

- Fond gris ardoise très clair cohérent avec la liste.
- Breadcrumb uppercase, espacé et séparé par des `/` explicites.
- Catégorie en petites capitales espacées au-dessus du titre.
- Titre d'article très grand, fin et uppercase, avec retour à la ligne naturel.
- Métadonnées sous le titre : date française, séparateur rond, temps de lecture calculé depuis le Markdown.
- Cover large au ratio paysage, coins très arrondis et ombre discrète ; la galerie existante reste disponible dans le carousel.
- Excerpt placé comme introduction éditoriale avant le corps Markdown.
- Titres Markdown fins et uppercase ; paragraphes et listes gris-bleu, avec espacement vertical généreux.
- Tags affichés en fin d'article sous forme de pilules bordées uppercase.

## Data mapping

- Le titre de carte utilise `article.title`.
- L'image utilise `article.cover.url` et conserve `article.cover.alt` pour l'accessibilité.
- La pilule utilise `blogCategoryLabel(article.category)`.
- Une carte sans cover conserve un fond neutre et l'icône éditoriale existante.
- Le contexte City reste visible dans le titre de page lorsqu'un filtre City est actif.
- La date utilise `article.published_at` avec une locale française stable.
- Le temps de lecture utilise le nombre de mots de `article.content_markdown`, arrondi au minimum à une minute.
- Les tags utilisent `article.tags` sans transformation métier supplémentaire.

## Testing

- Conserver les tests fonctionnels de la spec 029.
- Ajouter des assertions de structure pour le surtitre, le breadcrumb, les pilules et la grille de cartes.
- Vérifier les classes contractuelles responsables du ratio carré, de la grille deux colonnes et de l'overlay.
- Vérifier que le lien et le libellé accessible de chaque article restent présents.
- Vérifier sur le détail la hiérarchie breadcrumb/catégorie/titre, la date, le temps de lecture, le carousel, l'introduction, le Markdown et les tags.

## Out of scope

- Copie du header ou du footer Chalet Manager.
- Modification du layout public MyStay.
- Nouveau filtre catégorie dans l'URL ou dans la query Prisma.
- Modification du contenu ou du workflow éditorial des articles.
