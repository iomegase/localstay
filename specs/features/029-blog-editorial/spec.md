# Spec — 029 Blog Editorial

## Metadata

```yaml
id: 029-blog-editorial
title: "Blog editorial admin avec assistance Gemini"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-06-15
updated_at: 2026-06-15
depends_on:
  - 001-city-guide
  - 016-dashboard-superadmin
bounded_context: blog
related_adr:
  - ADR-010-gemini-blog-editorial-assistance
implementation_gate: "Code generation allowed only after status becomes approved"
```

---

## Context

MyStay doit disposer d'un blog public pour publier des contenus editoriaux SEO/GEO : guides locaux, conseils de sejour, idees d'activites, contenus hebergement et articles lies a une ville quand c'est pertinent.

Le contenu est produit par le Super-admin. Gemini peut accelerer la redaction, mais uniquement comme assistance editoriale cadree : l'Admin fournit un brief, des faits verifies et, si besoin, une City rattachee. Gemini propose un brouillon Markdown relu et modifiable par l'Admin. La publication reste une action humaine.

Cette spec introduit :

1. une liste publique globale `/blog` ;
2. un filtre public par City via `/blog?city=[city-slug]` ;
3. une page canonique article `/blog/[slug]` ;
4. un back-office admin de creation, edition, generation Gemini, upload photo, publication et archivage ;
5. une photo de couverture obligatoire avant publication et une galerie optionnelle ;
6. un breadcrumb public adapte au rattachement City ;
7. un cadrage Gemini dedie via `ADR-010`.

---

## Glossary References

- **Blog Article** : contenu editorial publie ou en preparation dans le blog MyStay.
- **Blog Category** : categorie simple obligatoire d'un Blog Article.
- **Blog Photo** : image rattachee a un Blog Article, soit couverture, soit galerie.
- **Blog Generation Draft** : proposition de brouillon generee par Gemini a partir d'un brief Admin et de faits verifies.
- **City** : ville ou commune referencee dans l'application.
- **Guide** : ensemble des contenus affiches pour une City.
- **Admin** : utilisateur role `admin` pouvant gerer le blog.
- **Tourist** : utilisateur final sans compte.
- **Markdown Content** : contenu texte structure en Markdown, rendu publiquement apres nettoyage.
- **GEO** : optimisation pour les experiences de recherche generative.
- **Soft Delete** : suppression logique via `deleted_at`.

---

## User Stories

### US-01 — Lire la liste du blog

**As a** Tourist  
**I want to** consulter les articles publies du blog  
**So that** je puisse decouvrir les conseils et contenus locaux MyStay

#### Acceptance Criteria

- **AC-01-01**: Given au moins un Blog Article `published`, When le Tourist ouvre `/blog`, Then la page affiche uniquement les articles `published`, non supprimes, tries par `published_at desc`.
- **AC-01-02**: Given aucun Blog Article publie, When le Tourist ouvre `/blog`, Then la page retourne 200 avec un etat vide editorial et aucun contenu brouillon.
- **AC-01-03**: Given une City active avec des Blog Articles publies rattaches, When le Tourist ouvre `/blog?city=[city-slug]`, Then la liste affiche uniquement les articles publies de cette City et un titre contextualise.
- **AC-01-04**: Given une City inconnue, inactive ou soft-deleted, When le Tourist ouvre `/blog?city=[city-slug]`, Then Next.js retourne 404.
- **AC-01-05**: Given un article `draft`, `review`, `archived` ou soft-deleted, When `/blog` ou `/blog?city=...` s'affiche, Then cet article n'apparait jamais.
- **AC-01-06**: Given la navigation publique basse s'affiche en mode anonyme, When le Tourist consulte une page publique, Then l'icone `Blog` remplace l'ancienne entree `Contact` et pointe vers `/blog`.

### US-02 — Lire un article de blog

**As a** Tourist  
**I want to** ouvrir un article public avec son breadcrumb et ses photos  
**So that** je lise un contenu clair, indexable et contextualise

#### Acceptance Criteria

- **AC-02-01**: Given un Blog Article `published`, When le Tourist ouvre `/blog/[slug]`, Then la page affiche titre, excerpt, categorie, tags, date de publication, photo de couverture, contenu Markdown rendu, galerie optionnelle et breadcrumb.
- **AC-02-02**: Given un article rattache a une City, When la page article s'affiche, Then le breadcrumb est `Accueil > Guide [City] > Blog > [Article]`.
- **AC-02-03**: Given un article sans City rattachee, When la page article s'affiche, Then le breadcrumb est `Accueil > Blog > [Article]`.
- **AC-02-04**: Given un article inconnu, non publie, archive ou soft-deleted, When `/blog/[slug]` est demande, Then Next.js retourne 404.
- **AC-02-05**: Given un contenu Markdown contient du HTML ou script non autorise, When la page publique est rendue, Then le rendu public est nettoye et aucun script injecte ne s'execute.

### US-03 — Gerer les articles cote Admin

**As an** Admin  
**I want to** creer, modifier, relire, publier et archiver les articles  
**So that** le blog reste controle et maintenable

#### Acceptance Criteria

- **AC-03-01**: Given un Admin authentifie, When il ouvre `/admin/blog`, Then il voit la liste des articles filtrable par statut, categorie et City.
- **AC-03-02**: Given un Admin authentifie, When il cree un article depuis `/admin/blog/new`, Then l'article est sauvegarde en `draft`.
- **AC-03-03**: Given un Admin modifie titre, slug, excerpt, contenu Markdown, categorie, tags, City, SEO ou photos, When il sauvegarde, Then les donnees sont validees avec Zod et persistees.
- **AC-03-04**: Given un utilisateur non-admin, When il appelle une route admin blog, Then l'acces est refuse sans exposer de contenu prive.
- **AC-03-05**: Given un article incomplet, When l'Admin tente de le publier, Then l'API refuse la transition avec une erreur structuree listant les champs manquants.
- **AC-03-06**: Given un article complet en `review` ou `draft`, When l'Admin le publie, Then `status = published`, `published_at` est renseigne et la page publique devient visible.
- **AC-03-07**: Given un article publie, When l'Admin l'archive, Then `status = archived`, `archived_at` est renseigne et la page publique retourne 404.

### US-04 — Generer un brouillon avec Gemini

**As an** Admin  
**I want to** demander a Gemini un brouillon depuis un brief et des faits verifies  
**So that** je gagne du temps sans publier de contenu non relu

#### Acceptance Criteria

- **AC-04-01**: Given un article `draft` et un brief Admin valide, When l'Admin demande une generation Gemini, Then Gemini retourne une proposition Markdown, title, excerpt, SEO title, SEO description, ainsi qu'un payload `text` et `sources` issu du grounding Google Search quand disponible.
- **AC-04-02**: Given la generation reussit, When la reponse est recue, Then elle est validee avec Zod et sauvegardee comme `BlogGenerationDraft` sans modifier automatiquement l'article publie, tandis que `sources` sont renvoyees au frontend sans persistance en base dans cette premiere passe.
- **AC-04-03**: Given l'Admin accepte le brouillon, When il applique la suggestion, Then les champs de l'article sont remplis en `draft` ou `review` et restent soumis a publication Admin.
- **AC-04-04**: Given Gemini est absent, non configure ou retourne une erreur, When l'Admin demande une generation, Then l'API retourne une erreur structuree et conserve le brief Admin.
- **AC-04-05**: Given le brief demande des coordonnees, distances, temps reel, disponibilites, prix ou faits non verifies, When la generation est demandee, Then le prompt et la validation refusent ce perimetre.

### US-05 — Uploader les photos d'article

**As an** Admin  
**I want to** uploader une photo de couverture et des photos de galerie  
**So that** les articles aient un rendu public riche et SEO compatible

#### Acceptance Criteria

- **AC-05-01**: Given un Admin authentifie et un fichier image valide, When il uploade une photo de couverture, Then l'image est stockee dans `guide-photos/blog/[article-id]` et rattachee comme `BlogArticlePhoto` de type `cover`.
- **AC-05-02**: Given un Admin authentifie, When il uploade plusieurs photos de galerie, Then elles sont rattachees comme photos `gallery` avec `alt` et `sort_order`.
- **AC-05-03**: Given un fichier invalide, trop lourd ou non image, When l'upload est appele, Then l'API retourne une erreur structuree et aucune photo metier n'est creee.
- **AC-05-04**: Given un article sans photo de couverture ou sans `alt` de couverture, When l'Admin tente de publier, Then la publication est refusee.

### US-06 — Optimiser SEO/GEO et indexation

**As a** Product Owner  
**I want to** produire des articles indexables, structures et citables  
**So that** MyStay gagne du trafic qualifie sur les recherches locales

#### Acceptance Criteria

- **AC-06-01**: Given `/blog` s'affiche, When `generateMetadata` s'execute, Then la page expose title, description, canonical et Open Graph coherents.
- **AC-06-02**: Given `/blog?city=[city-slug]` s'affiche, When `generateMetadata` s'execute, Then la metadata contextualise la City sans creer de canonical duplique.
- **AC-06-03**: Given un article publie, When `generateMetadata` s'execute, Then la page expose title, description, canonical `/blog/[slug]`, Open Graph image et robots index/follow.
- **AC-06-04**: Given un article publie, When la page s'affiche, Then elle emet un JSON-LD `BlogPosting` conforme aux donnees visibles.
- **AC-06-05**: Given le sitemap est genere, When des articles existent, Then seuls les articles `published` et non supprimes sont inclus.

---

## Business Rules

- **BR-01**: Les statuts autorises sont `draft`, `review`, `published`, `archived`.
- **BR-02**: Les pages publiques affichent uniquement les articles `status = published`, `published_at != null`, `deleted_at = null`.
- **BR-03**: Seul un utilisateur `role = admin`, actif et authentifie peut creer, modifier, generer avec Gemini, uploader des photos, publier ou archiver un article.
- **BR-04**: Le rattachement a une City est optionnel. Si `city_id` est renseigne, la City doit etre active et non soft-deleted pour publier l'article.
- **BR-05**: Le slug article est unique globalement et la route canonique est toujours `/blog/[slug]`.
- **BR-06**: `/blog?city=[city-slug]` est un filtre de liste, pas une canonical article.
- **BR-07**: Une seule photo de couverture active est autorisee par article au niveau applicatif.
- **BR-08**: Une photo de couverture active avec `alt` non vide est obligatoire avant publication.
- **BR-09**: Les photos de galerie sont optionnelles, ordonnees par `sort_order asc`, puis `created_at asc`.
- **BR-10**: Les photos blog sont televersees par l'Admin. Gemini ne recupere, ne genere et ne telecharge pas d'images.
- **BR-11**: Les images sont validees cote serveur, limitees a 5 Mo, et stockees via le service d'upload existant dans le bucket `guide-photos`.
- **BR-12**: La categorie est obligatoire et limitee aux valeurs `local_guide`, `lodging`, `restaurants`, `activities`, `travel_tips`.
- **BR-13**: Les tags sont optionnels, normalises en minuscules, dedoublonnes et limites a 10 tags de 40 caracteres maximum.
- **BR-14**: Les champs texte sont valides avec Zod : `title` 5-90 caracteres, `excerpt` 40-220, `content_markdown` 300-20000, `seo_title` 30-70, `seo_description` 80-180.
- **BR-15**: Le contenu public est stocke en Markdown et rendu avec une pipeline controlee qui supprime HTML dangereux, scripts, handlers d'evenements et URLs non autorisees.
- **BR-16**: Gemini est autorise uniquement comme assistance editoriale blog selon `ADR-010`.
- **BR-17**: Gemini recoit uniquement le brief Admin, les faits verifies saisis par l'Admin et, si besoin, des donnees MyStay deja validees et publiques sur la City rattachee. Le grounding Google Search peut etre active cote serveur pour recuperer des sources de travail et de citation.
- **BR-18**: Gemini ne doit jamais inventer de faits, coordonnees, distances, durees, prix, disponibilites, horaires temps reel, statistiques ou donnees personnelles.
- **BR-19**: La reponse Gemini est toujours un brouillon valide par Zod. Elle ne peut jamais passer directement un article en `published`.
- **BR-19a**: Les sources issues du grounding Google Search sont renvoyees au frontend uniquement comme appui de generation. Elles ne valent pas validation produit et ne remplacent jamais la revue Admin.
- **BR-19b**: Dans cette premiere passe, les sources grounded de la route `/api/admin/blog/{id}/generate` ne sont pas persistees en base. Seul le `BlogGenerationDraft` continue d'etre stocke.
- **BR-20**: Toute generation Gemini doit stocker le provider, le brief, les faits verifies, le hash source, le statut, la date de generation et la suggestion.
- **BR-21**: Les articles `draft`, `review`, `archived` ou soft-deleted ne doivent jamais etre inclus dans le sitemap, JSON-LD public ou listes publiques.
- **BR-22**: Le JSON-LD `BlogPosting` decrit uniquement des informations visibles sur la page.
- **BR-23**: Les erreurs API suivent le format standard du projet : `{ "error": { "code": "...", "message": "...", "details": {} } }`.
- **BR-24**: Toutes les mutations utilisent des routes API ou Server Actions validees avec Zod ; aucune logique metier n'est implementee dans les composants React.
- **BR-25**: Toute suppression est logique via `deleted_at` ou `status = archived`; aucune suppression physique de donnees metier n'est autorisee.
- **BR-26**: La navigation publique basse en mode anonyme expose l'entree `Blog` vers `/blog` a la place de l'entree `Contact`. Les pages Contact restent accessibles par URL directe et par les autres CTA existants.

---

## Data Model

```prisma
enum BlogArticleStatus {
  draft
  review
  published
  archived
}

enum BlogArticleCategory {
  local_guide
  lodging
  restaurants
  activities
  travel_tips
}

enum BlogArticlePhotoKind {
  cover
  gallery
}

enum BlogGenerationStatus {
  requested
  generated
  accepted
  rejected
  failed
}

model City {
  blog_articles BlogArticle[]
}

model User {
  authored_blog_articles BlogArticle[]       @relation("BlogArticleAuthor")
  blog_generation_drafts BlogGenerationDraft[] @relation("BlogGenerationDraftAdmin")
}

model BlogArticle {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  title            String
  slug             String @unique
  excerpt          String
  content_markdown String
  category         BlogArticleCategory
  tags             String[] @default([])

  city_id String?
  city    City?   @relation(fields: [city_id], references: [id], onDelete: SetNull)

  author_admin_id String
  author_admin    User   @relation("BlogArticleAuthor", fields: [author_admin_id], references: [id])

  status                  BlogArticleStatus @default(draft)
  submitted_for_review_at DateTime?
  published_at            DateTime?
  archived_at             DateTime?

  seo_title       String?
  seo_description String?

  photos            BlogArticlePhoto[]
  generation_drafts BlogGenerationDraft[]

  @@index([status, deleted_at, published_at])
  @@index([city_id, status, deleted_at, published_at])
  @@index([category, status, deleted_at])
}

model BlogArticlePhoto {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  article_id String
  article    BlogArticle @relation(fields: [article_id], references: [id])

  kind       BlogArticlePhotoKind
  url        String
  alt        String
  sort_order Int @default(0)

  @@index([article_id, kind, deleted_at, sort_order])
}

model BlogGenerationDraft {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  article_id String
  article    BlogArticle @relation(fields: [article_id], references: [id])

  admin_id String
  admin    User   @relation("BlogGenerationDraftAdmin", fields: [admin_id], references: [id])

  provider       String
  status         BlogGenerationStatus @default(requested)
  source_hash    String
  brief          String
  verified_facts String
  city_context   Json?

  suggestion_title           String?
  suggestion_excerpt         String?
  suggestion_markdown        String?
  suggestion_seo_title       String?
  suggestion_seo_description String?

  generated_at  DateTime?
  error_code    String?
  error_message String?

  @@index([article_id, created_at])
  @@index([admin_id, created_at])
  @@index([status, created_at])
}
```

---

## API Contract

```yaml
paths:
  /api/admin/blog:
    get:
      summary: "Lister les articles blog cote admin"
      tags: [blog-admin]
      parameters:
        - name: status
          in: query
          required: false
          schema: { type: string, enum: [draft, review, published, archived] }
        - name: category
          in: query
          required: false
          schema: { type: string, enum: [local_guide, lodging, restaurants, activities, travel_tips] }
        - name: city
          in: query
          required: false
          schema: { type: string }
      responses:
        "200":
          description: Liste admin paginee
          content:
            application/json:
              schema:
                type: object
                required: [items]
                properties:
                  items:
                    type: array
                    items: { $ref: "#/components/schemas/AdminBlogArticleListItem" }
        "401": { $ref: "#/components/responses/Unauthorized" }
        "403": { $ref: "#/components/responses/Forbidden" }
    post:
      summary: "Creer un article blog en draft"
      tags: [blog-admin]
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/BlogArticleUpsertInput" }
      responses:
        "201":
          description: Article cree
          content:
            application/json:
              schema: { $ref: "#/components/schemas/AdminBlogArticleDetail" }
        "400": { $ref: "#/components/responses/BadRequest" }
        "401": { $ref: "#/components/responses/Unauthorized" }
        "403": { $ref: "#/components/responses/Forbidden" }

  /api/admin/blog/{id}:
    get:
      summary: "Lire un article blog admin"
      tags: [blog-admin]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Detail article admin
          content:
            application/json:
              schema: { $ref: "#/components/schemas/AdminBlogArticleDetail" }
        "404": { $ref: "#/components/responses/NotFound" }
    patch:
      summary: "Mettre a jour un article blog"
      tags: [blog-admin]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema: { $ref: "#/components/schemas/BlogArticleUpsertInput" }
      responses:
        "200":
          description: Article mis a jour
          content:
            application/json:
              schema: { $ref: "#/components/schemas/AdminBlogArticleDetail" }
        "400": { $ref: "#/components/responses/BadRequest" }
        "404": { $ref: "#/components/responses/NotFound" }

  /api/admin/blog/{id}/photos:
    post:
      summary: "Uploader une photo blog"
      tags: [blog-admin]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              required: [file, kind, alt]
              properties:
                file: { type: string, format: binary }
                kind: { type: string, enum: [cover, gallery] }
                alt: { type: string, minLength: 3, maxLength: 180 }
                sort_order: { type: integer, minimum: 0 }
      responses:
        "201":
          description: Photo creee
          content:
            application/json:
              schema: { $ref: "#/components/schemas/BlogArticlePhoto" }
        "400": { $ref: "#/components/responses/BadRequest" }
        "404": { $ref: "#/components/responses/NotFound" }

  /api/admin/blog/{id}/generate:
    post:
      summary: "Generer un brouillon blog avec Gemini"
      tags: [blog-admin]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [brief, verified_facts]
              properties:
                brief: { type: string, minLength: 20, maxLength: 4000 }
                verified_facts: { type: string, minLength: 20, maxLength: 8000 }
      responses:
        "200":
          description: Brouillon genere
          content:
            application/json:
              schema: { $ref: "#/components/schemas/BlogGenerationDraftResponse" }
        "400": { $ref: "#/components/responses/BadRequest" }
        "503": { $ref: "#/components/responses/ServiceUnavailable" }

  /api/admin/blog/{id}/apply-generation:
    post:
      summary: "Appliquer un brouillon Gemini a l'article"
      tags: [blog-admin]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [generation_id]
              properties:
                generation_id: { type: string, format: uuid }
      responses:
        "200":
          description: Suggestion appliquee en brouillon
          content:
            application/json:
              schema: { $ref: "#/components/schemas/AdminBlogArticleDetail" }
        "400": { $ref: "#/components/responses/BadRequest" }
        "404": { $ref: "#/components/responses/NotFound" }

  /api/admin/blog/{id}/submit-review:
    post:
      summary: "Passer un article en review"
      tags: [blog-admin]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Article en review
          content:
            application/json:
              schema: { $ref: "#/components/schemas/AdminBlogArticleDetail" }
        "400": { $ref: "#/components/responses/BadRequest" }

  /api/admin/blog/{id}/publish:
    post:
      summary: "Publier un article blog"
      tags: [blog-admin]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Article publie
          content:
            application/json:
              schema: { $ref: "#/components/schemas/AdminBlogArticleDetail" }
        "400": { $ref: "#/components/responses/BadRequest" }

  /api/admin/blog/{id}/archive:
    post:
      summary: "Archiver un article blog"
      tags: [blog-admin]
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Article archive
          content:
            application/json:
              schema: { $ref: "#/components/schemas/AdminBlogArticleDetail" }

components:
  schemas:
    BlogArticleUpsertInput:
      type: object
      required: [title, slug, excerpt, content_markdown, category]
      properties:
        title: { type: string, minLength: 5, maxLength: 90 }
        slug: { type: string, minLength: 3, maxLength: 120 }
        excerpt: { type: string, minLength: 40, maxLength: 220 }
        content_markdown: { type: string, minLength: 0, maxLength: 20000 }
        category: { type: string, enum: [local_guide, lodging, restaurants, activities, travel_tips] }
        tags:
          type: array
          maxItems: 10
          items: { type: string, maxLength: 40 }
        city_id: { type: string, format: uuid, nullable: true }
        seo_title: { type: string, minLength: 30, maxLength: 70, nullable: true }
        seo_description: { type: string, minLength: 80, maxLength: 180, nullable: true }
    AdminBlogArticleListItem:
      type: object
      required: [id, title, slug, status, category, updated_at]
      properties:
        id: { type: string, format: uuid }
        title: { type: string }
        slug: { type: string }
        status: { type: string, enum: [draft, review, published, archived] }
        category: { type: string }
        city_name: { type: string, nullable: true }
        published_at: { type: string, format: date-time, nullable: true }
        updated_at: { type: string, format: date-time }
    AdminBlogArticleDetail:
      allOf:
        - $ref: "#/components/schemas/AdminBlogArticleListItem"
        - type: object
          required: [excerpt, content_markdown, tags, photos]
          properties:
            excerpt: { type: string }
            content_markdown: { type: string }
            tags:
              type: array
              items: { type: string }
            seo_title: { type: string, nullable: true }
            seo_description: { type: string, nullable: true }
            photos:
              type: array
              items: { $ref: "#/components/schemas/BlogArticlePhoto" }
    BlogArticlePhoto:
      type: object
      required: [id, kind, url, alt, sort_order]
      properties:
        id: { type: string, format: uuid }
        kind: { type: string, enum: [cover, gallery] }
        url: { type: string }
        alt: { type: string }
        sort_order: { type: integer }
    BlogGenerationDraft:
      type: object
      required: [id, status, provider]
      properties:
        id: { type: string, format: uuid }
        status: { type: string, enum: [requested, generated, accepted, rejected, failed] }
        provider: { type: string }
        suggestion_title: { type: string, nullable: true }
        suggestion_excerpt: { type: string, nullable: true }
        suggestion_markdown: { type: string, nullable: true }
        suggestion_seo_title: { type: string, nullable: true }
        suggestion_seo_description: { type: string, nullable: true }
    BlogGroundedSource:
      type: object
      required: [title, url]
      properties:
        title: { type: string }
        url: { type: string, format: uri }
    BlogGenerationDraftResponse:
      allOf:
        - $ref: "#/components/schemas/BlogGenerationDraft"
        - type: object
          required: [text, sources]
          properties:
            text: { type: string }
            sources:
              type: array
              items: { $ref: "#/components/schemas/BlogGroundedSource" }
    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message, details]
          properties:
            code: { type: string }
            message: { type: string }
            details: { type: object }
  responses:
    BadRequest:
      description: Validation error
      content:
        application/json:
          schema: { $ref: "#/components/schemas/Error" }
    Unauthorized:
      description: Non authentifie
      content:
        application/json:
          schema: { $ref: "#/components/schemas/Error" }
    Forbidden:
      description: Role non autorise
      content:
        application/json:
          schema: { $ref: "#/components/schemas/Error" }
    NotFound:
      description: Ressource introuvable
      content:
        application/json:
          schema: { $ref: "#/components/schemas/Error" }
    ServiceUnavailable:
      description: Gemini indisponible ou non configure
      content:
        application/json:
          schema: { $ref: "#/components/schemas/Error" }
```

---

## UI Behaviour

### Public : `/blog`

- **Loading state**: page Server Component ; aucun skeleton obligatoire hors navigation client.
- **Empty state**: message editorial indiquant qu'aucun article n'est encore publie.
- **Error state**: City query inconnue, inactive ou soft-deleted retourne 404.
- **Success state**: grille/liste mobile-first d'articles avec cover, categorie, titre, excerpt, date et City si presente.
- **Navigation**: l'entree `Blog` remplace `Contact` dans la navigation basse publique en mode anonyme.
- **Mobile behaviour**: aucun scroll horizontal a 375px ; cartes lisibles et image stable.

### Public : `/blog/[slug]`

- **Loading state**: page Server Component.
- **Empty state**: non applicable ; article non disponible retourne 404.
- **Error state**: article non publie, archive, inconnu ou soft-deleted retourne 404.
- **Success state**: breadcrumb, hero cover, titre, meta, Markdown rendu, galerie optionnelle, liens internes vers Blog et Guide City.
- **Mobile behaviour**: hero et contenu lisibles en 375px ; Markdown ne deborde pas.

### Admin : `/admin/blog`

- **Loading state**: tableau admin avec etat de chargement si composant client.
- **Empty state**: message "Aucun article" + CTA creer.
- **Error state**: erreur API structuree affichee dans une alerte Shadcn/ui.
- **Success state**: tableau filtrable par statut, categorie, City, avec actions edition/publication/archivage.
- **Mobile behaviour**: interface dashboard prioritairement desktop/tablette, mais sans chevauchement en mobile.

### Admin : `/admin/blog/new` et `/admin/blog/[id]`

- **Loading state**: formulaire desactive pendant sauvegarde, upload ou generation.
- **Empty state**: formulaire initial en draft.
- **Error state**: erreurs Zod par champ et erreurs globales pour upload/Gemini.
- **Success state**: formulaire Markdown, selection City optionnelle, categorie, tags, SEO, cover, galerie, statut et panneau Gemini.
- **Mobile behaviour**: champs empiles, actions principales visibles.

---

## Acceptance Criteria Summary

| ID | Description | Test type | Test file |
|---|---|---|---|
| AC-01-01 | `/blog` liste uniquement les articles publies tries | integration | `tests/integration/blog.AC-01-01.public-list-published.test.ts` |
| AC-01-02 | `/blog` vide retourne 200 sans brouillons | integration | `tests/integration/blog.AC-01-02.public-list-empty.test.ts` |
| AC-01-03 | filtre City affiche les articles rattaches | integration | `tests/integration/blog.AC-01-03.city-filter.test.ts` |
| AC-01-04 | City inconnue/inactive retourne 404 | integration | `tests/integration/blog.AC-01-04.city-filter-404.test.ts` |
| AC-01-05 | statuts non publies absents des listes | unit | `tests/unit/blog.AC-01-05.public-visibility-status.test.ts` |
| AC-01-06 | nav basse publique remplace Contact par Blog | unit | `tests/unit/blog.AC-01-06.public-bottom-nav-blog.test.tsx` |
| AC-02-01 | article publie affiche contenu et photos | e2e | `tests/e2e/blog.AC-02-01.article-detail.test.ts` |
| AC-02-02 | breadcrumb City pour article rattache | unit | `tests/unit/blog.AC-02-02.city-breadcrumb.test.ts` |
| AC-02-03 | breadcrumb global pour article sans City | unit | `tests/unit/blog.AC-02-03.global-breadcrumb.test.ts` |
| AC-02-04 | article non publie retourne 404 | integration | `tests/integration/blog.AC-02-04.article-404.test.ts` |
| AC-02-05 | Markdown public nettoye les contenus dangereux | unit | `tests/unit/blog.AC-02-05.markdown-sanitization.test.ts` |
| AC-03-01 | admin liste filtrable | contract | `tests/contract/blog.AC-03-01.admin-list.test.ts` |
| AC-03-02 | creation admin sauvegarde en draft | contract | `tests/contract/blog.AC-03-02.admin-create-draft.test.ts` |
| AC-03-03 | edition admin valide avec Zod | contract | `tests/contract/blog.AC-03-03.admin-update-validation.test.ts` |
| AC-03-04 | non-admin refuse | contract | `tests/contract/blog.AC-03-04.admin-authz.test.ts` |
| AC-03-05 | publication incomplete refusee | unit | `tests/unit/blog.AC-03-05.publish-requirements.test.ts` |
| AC-03-06 | publication rend l'article visible | integration | `tests/integration/blog.AC-03-06.publish-flow.test.ts` |
| AC-03-07 | archivage retire l'article public | integration | `tests/integration/blog.AC-03-07.archive-flow.test.ts` |
| AC-04-01 | Gemini retourne brouillon structure | contract | `tests/contract/blog.AC-04-01.gemini-generate.test.ts` |
| AC-04-02 | brouillon Gemini sauvegarde sans publication | integration | `tests/integration/blog.AC-04-02.generation-draft.test.ts` |
| AC-04-03 | application brouillon remplit l'article | integration | `tests/integration/blog.AC-04-03.apply-generation.test.ts` |
| AC-04-04 | Gemini indisponible retourne erreur structuree | contract | `tests/contract/blog.AC-04-04.gemini-unavailable.test.ts` |
| AC-04-05 | prompt refuse demandes hors perimetre | unit | `tests/unit/blog.AC-04-05.gemini-scope.test.ts` |
| AC-05-01 | upload cover cree photo cover | contract | `tests/contract/blog.AC-05-01.upload-cover.test.ts` |
| AC-05-02 | upload galerie cree photos ordonnees | contract | `tests/contract/blog.AC-05-02.upload-gallery.test.ts` |
| AC-05-03 | image invalide refusee | contract | `tests/contract/blog.AC-05-03.upload-invalid.test.ts` |
| AC-05-04 | cover obligatoire avant publication | unit | `tests/unit/blog.AC-05-04.cover-required.test.ts` |
| AC-06-01 | metadata `/blog` | unit | `tests/unit/blog.AC-06-01.list-metadata.test.ts` |
| AC-06-02 | metadata filtre City | unit | `tests/unit/blog.AC-06-02.city-metadata.test.ts` |
| AC-06-03 | metadata article | unit | `tests/unit/blog.AC-06-03.article-metadata.test.ts` |
| AC-06-04 | JSON-LD BlogPosting public | unit | `tests/unit/blog.AC-06-04.blogposting-jsonld.test.ts` |
| AC-06-05 | sitemap inclut seulement articles publies | unit | `tests/unit/blog.AC-06-05.sitemap.test.ts` |

---

## Out of Scope

- Commentaires publics sur les articles.
- Espace auteur Owner ou Merchant.
- Publication automatique par Gemini.
- Editeur riche type Notion.
- Gestion admin dediee des categories et tags.
- Traduction automatique des articles ; les evolutions multilingues devront passer par `027-multilingual-content`.
- Scraping de sites externes pour creer des articles.
- Generation ou import automatique d'images par IA.
- Donnees temps reel, prix, disponibilites, distances, coordonnees ou metriques geographiques generees par Gemini.

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-00 | Aucune question ouverte. | Product Owner | 2026-06-15 | resolved |
