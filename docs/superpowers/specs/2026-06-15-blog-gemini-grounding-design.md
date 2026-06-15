# Blog Gemini Grounding Extension — Design

**Date :** 2026-06-15  
**Statut :** Design valide en attente de revue utilisateur.  
**Spec projet cible :** `specs/features/029-blog-editorial/spec.md`  
**ADR cible :** `docs/DAT/adr/ADR-010-gemini-blog-editorial-assistance.md`

## Besoin

Etendre explicitement la route editoriale blog existante `POST /api/admin/blog/{id}/generate` pour :

- activer le grounding Google Search via l'outil `googleSearch` ;
- recuperer le texte genere par Gemini ;
- extraire les sources depuis `groundingMetadata` ;
- retourner un JSON frontend simple avec `text` et `sources` ;
- conserver la cle API cote serveur ;
- eviter toute refonte de l'architecture actuelle.

## Contrainte structurante

La route blog existante ne retourne pas un simple texte. Elle alimente deja le workflow admin `BlogGenerationDraft` :

- la suggestion Gemini est validee avec Zod ;
- un draft est persiste en base ;
- le frontend admin consomme ce draft pour permettre l'application manuelle sur l'article.

Remplacer la reponse par `{ text, sources }` uniquement casserait ce flux.

## Approches considerees

### Option A — Extension additive du payload existant

Conserver le `BlogGenerationDraft` actuel et ajouter deux champs au JSON de reponse :

- `text` : alias de `suggestion_markdown` ;
- `sources` : liste normalisee des sources extraites du grounding.

Avantages :

- pas de nouvelle route ;
- pas de migration Prisma ;
- pas de casse pour le frontend admin actuel ;
- changement localise au service Gemini, a la query blog et au contrat HTTP.

Inconvenient :

- le payload contient des champs existants et les nouveaux champs derives.

### Option B — Nouveau contrat minimal `{ text, sources }`

Faire de la route un endpoint editorial plus generique.

Avantages :

- contrat plus simple pour un frontend tres leger.

Inconvenients :

- casse du workflow `BlogGenerationDraft` ;
- modifications frontend et serveur plus larges ;
- non conforme a l'objectif de changement minimal.

## Decision retenue

**Option A**.

La route conserve son role actuel de generation de `BlogGenerationDraft` et expose en plus `text` et `sources` pour le frontend.

## Contrat de reponse cible

La route continue de repondre avec les champs actuels du draft et ajoute :

```json
{
  "id": "uuid",
  "status": "generated",
  "provider": "gemini",
  "suggestion_title": "...",
  "suggestion_excerpt": "...",
  "suggestion_markdown": "...",
  "suggestion_seo_title": "...",
  "suggestion_seo_description": "...",
  "text": "...",
  "sources": [
    {
      "title": "Source title",
      "url": "https://example.com/article"
    }
  ]
}
```

Regles :

- `text = suggestion_markdown` ;
- `sources` vaut `[]` si aucun grounding exploitable n'est retourne ;
- `sources` est dedoublonne par URL ;
- seuls les champs necessaires au frontend sont exposes pour les sources : `title`, `url`.

## Impact technique

### 1. Service Gemini blog

Fichier cible : `src/features/blog/services/gemini-draft.ts`

Modifications :

- activer `tools: [{ googleSearch: {} }]` sur le modele Gemini ;
- conserver le prompt editorial existant et le parsing JSON strict actuel ;
- extraire `result.response.candidates?.[0]?.groundingMetadata` ;
- convertir `groundingChunks` en structure `sources`.

Structure source normalisee :

```ts
type GroundedSource = {
  title: string
  url: string
}
```

Le service retournera :

```ts
type BlogGenerationWithSources = {
  draft: BlogGenerationResult
  sources: GroundedSource[]
}
```

### 2. Query blog admin

Fichier cible : `src/features/blog/queries/admin-blog.ts`

Modifications :

- continuer a creer un `BlogGenerationDraft` exactement comme aujourd'hui ;
- enrichir l'objet retourne par la query avec :
  - `text` base sur `suggestion_markdown` ;
  - `sources` venant du service Gemini.

Important :

- aucune persistance des sources en base dans cette premiere passe ;
- aucune migration Prisma.

### 3. Route API

Fichier cible : `src/app/api/admin/blog/[id]/generate/route.ts`

Modification attendue :

- garder le handler presque inchange ;
- laisser la route renvoyer le payload enrichi produit par `generateBlogDraft(...)`.

### 4. Frontend admin

Fichier consommateur actuel : `src/features/blog/components/AdminBlogEditor.tsx`

Impact :

- aucun changement obligatoire pour continuer a fonctionner ;
- le frontend pourra commencer a lire `text` et `sources` sans regression sur `draftSuggestion`.

## Regles produit a documenter dans spec et ADR

La spec 029 et l'ADR-010 doivent expliciter :

- que le grounding Google Search est autorise pour l'assistance editoriale blog ;
- que les sources web servent d'appui de generation et de citation, pas de publication automatique de faits ;
- que la revue Admin reste obligatoire avant application et publication ;
- que `text` et `sources` font partie du contrat HTTP de la route `POST /api/admin/blog/{id}/generate`.

## Erreurs et resilence

- si Gemini repond sans `groundingMetadata`, la generation reste valide et `sources = []` ;
- si Gemini repond avec du grounding partiel ou mal forme, ignorer les sources invalides plutot que faire echouer tout le draft ;
- si le JSON editorial n'est pas parseable ou echoue Zod, conserver le comportement d'erreur existant ;
- la cle API reste uniquement dans `process.env.GEMINI_API_KEY`.

## Tests a ajouter

- unit test service :
  - extrait des sources dedoublonnees depuis `groundingMetadata` ;
  - retourne `sources = []` sans grounding ;
- integration/query test :
  - `generateBlogDraft(...)` persiste toujours le draft et retourne `text` + `sources` ;
- contract test route :
  - le `POST /api/admin/blog/{id}/generate` retourne les champs existants plus `text` et `sources`.

## Hors scope

- stockage des sources en base ;
- citations inline dans le Markdown ;
- modification du flux `apply-generation` ;
- nouvelle route API ;
- migration vers `@google/genai` ;
- changement du workflow editorial `draft/review/published/archived`.
