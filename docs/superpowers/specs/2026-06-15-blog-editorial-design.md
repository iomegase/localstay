# Blog editorial admin — Design

**Date :** 2026-06-15  
**Statut :** Design valide et transforme en spec projet approuvee.  
**Spec projet :** `specs/features/029-blog-editorial/spec.md`  
**ADR :** `docs/DAT/adr/ADR-010-gemini-blog-editorial-assistance.md`

## Decisions produit validees

- Blog public global sous `/blog`.
- Article canonique sous `/blog/[slug]`.
- Rattachement optionnel a une City via un champ de selection admin.
- Filtre public par ville via `/blog?city=[city-slug]`.
- Breadcrumb public :
  - `Accueil > Blog > Article` sans City ;
  - `Accueil > Guide [City] > Blog > Article` avec City.
- Navigation basse publique : l'icone `Blog` remplace l'ancienne entree `Contact` en mode anonyme.
- Gestion reservee au role `admin`.
- Workflow `draft`, `review`, `published`, `archived`.
- Contenu Markdown dans un champ texte admin.
- Photo de couverture obligatoire avant publication.
- Galerie optionnelle.
- Categorie simple obligatoire et tags optionnels.
- Assistance Gemini mode cadree : brief Admin + faits verifies + City optionnelle, brouillon relu avant publication.

## Approche retenue

Approche A : blog editorial admin V1.

Elle couvre le besoin immediat sans ouvrir un CMS trop large. Le contenu reste dans un bounded context `blog`, l'interface admin reste simple, et Gemini est autorise uniquement via une decision d'architecture dediee.

## Architecture

- Nouveaux modeles : `BlogArticle`, `BlogArticlePhoto`, `BlogGenerationDraft`.
- Routes publiques Server Components : `/blog`, `/blog/[slug]`.
- Routes admin : `/admin/blog`, `/admin/blog/new`, `/admin/blog/[id]`.
- Routes API admin validees par Zod pour create/update/upload/generate/publish/archive.
- Upload via le service existant `uploadGuideImage`, bucket `guide-photos`, prefixe `blog/[article-id]`.
- Markdown rendu cote serveur avec sanitization stricte.
- SEO : `generateMetadata`, canonical, Open Graph, JSON-LD `BlogPosting`, sitemap limite aux articles publies.

## Erreurs et tests

- Les articles non publies retournent 404 cote public.
- Le filtre City inconnu/inactif retourne 404.
- Gemini indisponible retourne une erreur structuree et conserve le brief.
- La publication exige les champs editoriaux, SEO et la photo de couverture.
- Tests unitaires, contract, integration et e2e definis dans la spec projet.

## Hors scope

- Commentaires.
- Contributions Owner/Merchant.
- Editeur riche.
- Categories/tags administrables.
- Traduction automatique.
- Publication automatique par Gemini.
- Generation ou import automatique d'images.
