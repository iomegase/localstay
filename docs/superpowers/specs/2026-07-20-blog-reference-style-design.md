# Blog Reference Style Design

**Date:** 2026-07-20

**Feature:** `029-blog-editorial`

## Goal

Aligner le contenu de la page publique `/blog` sur le screenshot Chalet Manager fourni par le Product Owner, sans modifier le header, le footer, la navigation basse ou les règles métier MyStay.

## Scope

- Conserver le Server Component, la requête des articles publiés, le filtre City, les URLs canoniques et l'état vide existants.
- Modifier uniquement la composition visuelle du contenu de `/blog`.
- Ne pas ajouter de filtre catégorie fonctionnel : les pilules reproduisent le vocabulaire visuel en affichant les catégories présentes dans la liste.
- Ne pas modifier `/blog/[slug]`, les pages Admin ou le layout public partagé.

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

## Data mapping

- Le titre de carte utilise `article.title`.
- L'image utilise `article.cover.url` et conserve `article.cover.alt` pour l'accessibilité.
- La pilule utilise `blogCategoryLabel(article.category)`.
- Une carte sans cover conserve un fond neutre et l'icône éditoriale existante.
- Le contexte City reste visible dans le titre de page lorsqu'un filtre City est actif.

## Testing

- Conserver les tests fonctionnels de la spec 029.
- Ajouter des assertions de structure pour le surtitre, le breadcrumb, les pilules et la grille de cartes.
- Vérifier les classes contractuelles responsables du ratio carré, de la grille deux colonnes et de l'overlay.
- Vérifier que le lien et le libellé accessible de chaque article restent présents.

## Out of scope

- Copie du header ou du footer Chalet Manager.
- Modification du layout public MyStay.
- Nouveau filtre catégorie dans l'URL ou dans la query Prisma.
- Modification de la page détail article.
