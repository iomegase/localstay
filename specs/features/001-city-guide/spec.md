# Spec — 001 City Guide

## Metadata

```yaml
id: 001-city-guide
title: "Affichage du guide touristique par ville"
status: approved
mvp: 1
owner: "Product Owner"
created_at: 2026-05-20
updated_at: 2026-06-06
depends_on: [002-categories, 003-poi-list, 007-gemini-fetch]
i18n: fr (MVP 1 monolingue français — versions EN, IT, ES, NL prévues ultérieurement)
pilot_city: saint-gervais-les-bains
```

---

## Context

Le Tourist arrive dans son logement, scanne le QR code mis à sa disposition, et l'application MyStay se charge immédiatement sur son téléphone. Le QR code sert uniquement à faciliter l'accès à l'application — il encode l'URL `/guide/[city-slug]` et évite toute saisie manuelle. Le Tourist peut aussi accéder au guide en saisissant sa ville manuellement depuis la page d'accueil.

Aucun compte n'est requis. Aucune géolocalisation GPS n'est déclenchée automatiquement (opt-in reporté en MVP 2).

---

## Glossary References

- **City** : ville référencée, identifiée par nom + code postal + slug
- **Guide** : ensemble des catégories et POI affichés pour une City
- **Tourist** : utilisateur sans compte
- **QR Code** : encode l'URL `/guide/[city-slug]` — 1 QR code par ville en MVP 1
- **city-slug** : nom de ville normalisé, lowercase, sans accents, avec tirets (ex : `saint-gervais-les-bains`)

---

## User Stories

### US-01 — Accès au guide via QR code

**As a** Tourist
**I want to** scanner le QR code mis à disposition dans mon logement
**So that** l'application se charge immédiatement sur mon téléphone sans aucune saisie

#### Acceptance Criteria

- **AC-01-01**: Given un QR code valide, When le Tourist le scanne, Then il est redirigé vers `/guide/[city-slug]` et le LCP est < 3 secondes sur réseau 4G moyen (Lighthouse Mobile preset)
- **AC-01-02**: Given un city-slug inexistant dans l'URL, When le Tourist accède à la page, Then une page 404 claire est affichée avec un lien de retour vers la page d'accueil
- **AC-01-03**: Given une City valide avec POI, When la page charge, Then l'intitulé du guide et les catégories disponibles sont affichés

### US-02 — Accès au guide via saisie manuelle

**As a** Tourist
**I want to** saisir le nom de ma ville ou mon code postal
**So that** j'accède au guide même sans QR code

#### Acceptance Criteria

- **AC-02-01**: Given une saisie de ville valide (nom ou CP), When le Tourist valide, Then il est redirigé vers `/guide/[city-slug]`
- **AC-02-02**: Given une saisie sans résultat, When le Tourist valide, Then un message clair indique qu'aucune ville n'est trouvée
- **AC-02-03**: Given une saisie d'au moins 3 caractères, When le Tourist tape, Then une liste de suggestions s'affiche (max 10 résultats, accent-insensitive, prefix match, ordonnés par pertinence nom puis CP)

### US-03 — Affichage du guide

**As a** Tourist
**I want to** voir le guide de ma ville
**So that** je puisse naviguer vers les catégories qui m'intéressent

#### Acceptance Criteria

- **AC-03-01**: Given un Guide chargé avec POI, When la page s'affiche, Then seules les catégories contenant au moins un POI actif sont visibles
- **AC-03-02**: Given un Guide chargé, When la page s'affiche, Then chaque catégorie affiche son icône (slug Lucide React), son nom et le nombre de POI disponibles
- **AC-03-03**: Given un Guide chargé sur mobile, When la page s'affiche, Then la mise en page est lisible sur écran 375px minimum sans scroll horizontal
- **AC-03-04**: Given une City avec slug valide mais sans aucun POI actif, When la page charge, Then une réponse HTTP 200 est retournée avec un empty state explicite ("Aucun contenu disponible pour cette ville pour le moment")

---

## Business Rules

- **BR-01**: Un slug de City inexistant retourne HTTP 404. Une City existante sans POI retourne HTTP 200 avec empty state — jamais de 404 sur une City valide
- **BR-02**: Les catégories sans POI actif sont masquées — absentes du DOM, pas simplement cachées en CSS
- **BR-03**: Le city-slug est généré à partir du nom de la ville : lowercase, sans accents, espaces remplacés par des tirets (ex : `saint-gervais-les-bains`)
- **BR-04**: Aucune authentification requise pour accéder au guide
- **BR-05**: Aucune géolocalisation GPS automatique — le Tourist n'est jamais géolocalisé sans action explicite de sa part (reporté MVP 2)
- **BR-06**: La recherche de ville est accent-insensitive, prefix match, limitée à 10 résultats, ordonnée par pertinence (nom en premier, puis CP)
- **BR-07**: MVP 1 est monolingue français. Toutes les chaînes UI sont en français. Les versions EN, IT, ES, NL sont prévues dans les MVPs suivants — l'architecture i18n doit être préparée (clés de traduction) sans être implémentée
- **BR-08**: Le `poi_count` retourné par l'API reflète les POI actifs en base au moment de la requête. Si le cache Gemini est vide ou en cours de fetch, `poi_count` peut être 0 — comportement défini dans spec `007-gemini-fetch`
- **BR-09**: Le nom produit public est MyStay. Les libellés de navigation validés le 2026-06-05 sont : bottom nav `Explorer` → `Bienvenue`, `Favoris` → `Vos favoris`, bouton `Guide` visible uniquement dans le contexte `/guide/[city-slug]` et pointant vers la racine de cette ville ; menu burger `Home` → `Bienvenue`; menu burger `Services Privés` → `Les recommandations de {owner.name}` si le nom Owner est connu, sinon `Les recommandations de votre hôte`. L'item sélectionné du bottom nav public utilise la couleur `#bd9254`; les items inactifs utilisent un gris lisible `#6f7480` sur la surface glassmorphism ; le bottom nav complet (surface, textes et icônes) devient transparent pendant que l'utilisateur scrolle, puis revient visible en glassmorphism quand le scroll s'arrête.
- **BR-10**: Sur mobile iOS/Android, le site utilise un mode immersif navigateur classique sur toutes les routes : viewport `cover`, safe areas, hauteur mobile dynamique et repli demandé des barres navigateur après chargement ou interaction tactile. Ce mode ne remplace pas une PWA installée : la disparition des barres d'adresse/bas reste soumise au comportement du navigateur.

---

## Data Model

> Les modèles `Category`, `SubCategory` et `PointOfInterest` sont définis dans les specs `002-categories` et `003-poi-list`.
> Le modèle `QrCode` est défini dans la spec `006-qr-code`.
> Ce spec définit uniquement le modèle `City`.

```prisma
model City {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  name        String
  slug        String   @unique
  postal_code String
  department  String?
  region      String?
  latitude    Float
  longitude   Float
  is_active   Boolean  @default(true)

  pois        PointOfInterest[]
  qr_codes    QrCode[]
}
```

> **Ville pilote seed :** `saint-gervais-les-bains`, CP `74170`, lat `45.8921`, lng `6.7085`

---

## API Contract

```yaml
paths:
  /api/cities/search:
    get:
      summary: "Rechercher une ville par nom ou code postal"
      tags: [city-guide]
      parameters:
        - name: q
          in: query
          required: true
          schema:
            type: string
            minLength: 3
          description: "Nom de ville ou code postal — accent-insensitive, prefix match"
      responses:
        "200":
          description: "Liste de villes correspondantes (max 10, ordonnées par pertinence)"
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    type: array
                    maxItems: 10
                    items:
                      $ref: "#/components/schemas/CitySearchResult"
        "400":
          $ref: "#/components/responses/BadRequest"

  /api/cities/{slug}:
    get:
      summary: "Récupérer le guide d'une ville par slug"
      tags: [city-guide]
      parameters:
        - name: slug
          in: path
          required: true
          schema:
            type: string
      responses:
        "200":
          description: "Guide de la ville — catégories avec poi_count > 0 uniquement. Retourne aussi si poi_count = 0 (empty state)"
          content:
            application/json:
              schema:
                type: object
                properties:
                  data:
                    $ref: "#/components/schemas/CityGuide"
        "404":
          description: "Slug introuvable en base"
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

components:
  schemas:
    CitySearchResult:
      type: object
      required: [id, name, slug, postal_code]
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        slug:
          type: string
        postal_code:
          type: string
        department:
          type: string
          nullable: true

    CityGuide:
      type: object
      required: [city, categories]
      properties:
        city:
          $ref: "#/components/schemas/CitySearchResult"
        categories:
          type: array
          description: "Uniquement les catégories avec poi_count >= 1. Vide si aucun POI actif."
          items:
            $ref: "#/components/schemas/CategorySummary"

    CategorySummary:
      type: object
      required: [id, name, slug, icon, sort_order, poi_count]
      properties:
        id:
          type: string
          format: uuid
        name:
          type: string
        slug:
          type: string
        icon:
          type: string
          description: "Slug Lucide React (ex: 'utensils', 'mountain', 'heart-pulse')"
        sort_order:
          type: integer
        poi_count:
          type: integer
          minimum: 1

    Error:
      type: object
      required: [error]
      properties:
        error:
          type: object
          required: [code, message]
          properties:
            code:
              type: string
            message:
              type: string
            details:
              type: object

  responses:
    BadRequest:
      description: "Paramètre manquant ou invalide"
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
```

---

## Mockup de référence

> **Fichier contractuel :** `docs/DAT/diagrams/mockups/001-city-guide/home.html`
>
> Ce mockup fait autorité pour la génération des composants. Claude Code doit s'y conformer pour :
> - la palette de couleurs (`#FAF9F6`, `#121212`, `#A68E69`, `#455E4C`)
> - la typographie (serif italic pour les titres, tracking serré pour les labels)
> - la structure du menu overlay (navigation plein écran)
> - le header glassmorphism sticky
> - la ligne horizontale des catégories (`overflow-x-auto`, cards rondes)
> - les cards de catégorie (icône + nom + badge count)
> - le champ de recherche visuel "Une envie particulière ?"
> - la section "Nos coups de coeur"
>
> Toute déviation du mockup doit être explicitement justifiée dans le code (commentaire) et soumise au Product Owner.
>
> Déviations validées par le Product Owner le 2026-06-04 : nom produit MyStay, libellés de navigation listés en BR-09, et vue "Tous les POI" avec infinite scroll sur la home Guide selon `003-poi-list` BR-05a.
> Déviation validée par le Product Owner le 2026-06-06 : bottom nav public entièrement transparent pendant le scroll, à nouveau visible quand le scroll s'arrête, item actif en `#bd9254` et items inactifs en gris contrasté `#6f7480`.

---

## UI Behaviour

### Page : `/guide/[city-slug]`

- **Loading state** : skeleton loader sur les cards catégories (Shadcn Skeleton), header visible immédiatement
- **Empty state** : message "Aucun contenu disponible pour cette ville pour le moment" + illustration neutre + lien retour accueil — HTTP 200
- **Error state** : message d'erreur générique + bouton "Réessayer"
- **404 state** : page dédiée "Ville introuvable" + lien retour accueil — HTTP 404
- **Success state** : home Guide avec intitulé de guide, sous-titre, champ de recherche visuel, ligne horizontale de catégories, vue "Tous les POI" avec infinite scroll, bottom navigation incluant `Guide` vers `/guide/[city-slug]`, item actif en `#bd9254`, items inactifs en `#6f7480` et menu entièrement transparent pendant le scroll puis visible à l'arrêt du scroll
- **Mobile** : `max-w-[430px]`, fond `#FAF9F6`, header glassmorphism sticky, menu overlay plein écran, viewport immersif navigateur selon BR-10

### Composant : CitySearchInput (page d'accueil `/`)

- Champ de saisie avec autocomplétion (debounce 300ms, déclenchement dès 3 caractères)
- Recherche accent-insensitive, prefix match
- Liste de suggestions sous le champ (max 10 résultats)
- Sélection → redirection vers `/guide/[city-slug]`
- Placeholder : "Votre ville ou code postal…"
- Aucune géolocalisation automatique

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Scan QR → LCP < 3s sur 4G (Lighthouse Mobile) | e2e |
| AC-01-02 | Slug inexistant → 404 avec lien retour | e2e |
| AC-01-03 | Nom ville + catégories disponibles affichés | integration |
| AC-02-01 | Saisie ville valide → redirection guide | integration |
| AC-02-02 | Saisie sans résultat → message clair | unit |
| AC-02-03 | Autocomplétion dès 3 chars, max 10 résultats, accent-insensitive | unit |
| AC-03-01 | Seules catégories avec POI actif visibles | unit |
| AC-03-02 | Icône (slug Lucide) + nom + poi_count par catégorie | integration |
| AC-03-03 | Rendu lisible sur 375px, pas de scroll horizontal | e2e |
| AC-03-04 | City sans POI → HTTP 200 + empty state (pas de 404) | integration |
| BR-09 | Navigation publique : libellés validés, bouton `Guide` contextuel, item actif `#bd9254`, items inactifs `#6f7480`, bottom nav entièrement transparent pendant le scroll puis visible à l'arrêt | unit |
| BR-10 | Mode immersif navigateur mobile configuré globalement | unit |

---

## Out of Scope

- Géolocalisation GPS automatique du Tourist (MVP 2)
- QR code personnalisé par logement (MVP 2)
- Personnalisation du guide par hébergeur (MVP 2)
- Statistiques de consultation (MVP 2)
- Authentification Tourist (MVP 4)
- i18n EN / IT / ES / NL (MVP ultérieur — architecture i18n à préparer sans implémenter)

---

## Open Questions

| ID | Question | Owner | Due | Resolution |
|---|---|---|---|---|
| OQ-01 | Géolocalisation automatique sans QR code ? | Product Owner | 2026-05-21 | ✅ **Résolu** — Pas de géolocalisation automatique en MVP 1. Le Tourist saisit manuellement sa ville. GPS opt-in reporté en MVP 2. |
| OQ-02 | Ville pilote initiale ? | Product Owner | 2026-05-21 | ✅ **Résolu** — Saint-Gervais-les-Bains (74170). Seed data à créer avant les tests e2e. |
| OQ-03 | QR code MVP 1 — qui génère, quel payload ? | Product Owner | 2026-05-21 | ✅ **Résolu** — L'admin génère depuis le dashboard super-admin. 1 QR code par ville. Payload = URL absolue `https://[domain]/guide/[city-slug]`. Défini dans spec `006-qr-code`. |
| OQ-04 | BR-01 : 404 ou empty state pour City sans POI ? | Product Owner | 2026-05-21 | ✅ **Résolu** — HTTP 200 + empty state si City valide sans POI. HTTP 404 uniquement si slug inexistant en base. |
| OQ-05 | Définition mesurable de "< 3 secondes" | Product Owner | 2026-05-21 | ✅ **Résolu** — LCP < 3s sur réseau 4G moyen, mesuré avec Lighthouse Mobile preset. |
| OQ-06 | Sémantique de recherche `/api/cities/search` | Product Owner | 2026-05-21 | ✅ **Résolu** — Accent-insensitive, prefix match, max 10 résultats, ordonnés par pertinence (nom puis CP). |
| OQ-07 | Stratégie i18n MVP 1 | Product Owner | 2026-05-21 | ✅ **Résolu** — MVP 1 monolingue français. Architecture i18n (clés de traduction) à préparer. Versions EN, IT, ES, NL prévues ultérieurement. |
| OQ-08 | Format des icônes Category | Product Owner | 2026-05-21 | ✅ **Résolu** — Slug Lucide React (ex: `"utensils"`, `"mountain"`). Défini dans spec `002-categories`. |
| OQ-09 | Comportement poi_count si cache Gemini vide | Product Owner | 2026-05-21 | ✅ **Résolu** — poi_count = 0 si cache vide. Comportement détaillé dans spec `007-gemini-fetch`. |
| OQ-10 | Mockup home.html — contractuel ou indicatif ? | Product Owner | 2026-05-21 | ✅ **Résolu** — Contractuel. Claude Code doit s'y conformer. Voir section Mockup de référence. |
| OQ-11 | Modèle Lodging dans ce spec — justifié ? | Product Owner | 2026-05-21 | ✅ **Résolu** — Retiré de ce spec. Le modèle Lodging appartient à la spec `006-qr-code`. |
