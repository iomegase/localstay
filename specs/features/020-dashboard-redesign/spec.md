# Spec — 020 Dashboard Redesign

## Metadata

```yaml
id: 020-dashboard-redesign
title: "Refonte visuelle unifiée des dashboards"
status: review
mvp: 2
owner: "Product Owner"
created_at: 2026-05-25
updated_at: 2026-05-25
depends_on:
  - 010-dashboard-owner
  - 013-subscription-owner
  - 015-dashboard-merchant
  - 016-dashboard-superadmin
  - 017-admin-taxonomy
  - 018-poi-acquisition-pipeline
  - 019-trails-acquisition
bounded_context: shared-dashboard-ui
```

---

## Context

Les dashboards `owner`, `merchant` et `admin` ont été construits par incréments et respectent déjà leurs règles métier, mais leur structure visuelle, leur densité d'information, leurs zones d'action et leur navigation restent hétérogènes.

Cette spec définit une refonte visuelle commune des espaces back-office afin de :

- unifier la navigation et les patterns d'interface ;
- accélérer le scan des KPI, tableaux, formulaires et états système ;
- réduire la duplication de layouts et de composants shell ;
- préserver strictement les contrats métier déjà définis dans `010`, `013`, `015`, `016`, `017`, `018` et `019`.

Le site `https://modernize-tailwind-nextjs-main.vercel.app/` est autorisé uniquement comme **benchmark visuel** pour la hiérarchie, la densité, l'orchestration sidebar/header/cards et la lisibilité générale. Il n'est **pas** une source de vérité produit, métier, fonctionnelle ou contractuelle. Cette spec interdit toute copie de code, d'assets, de textes ou de structure dépendante du template externe.

---

## Glossary References

- **Owner** : hébergeur authentifié accédant à `/dashboard`
- **Merchant** : commerçant gérant une fiche POI revendiquée
- **Lodging** : logement rattaché à un Owner et une City
- **POI** : fiche publique consultable dans le guide
- **Analytics** : événements append-only utilisés pour les statistiques
- **Subscription** : abonnement Owner ou Merchant
- **Server Component** : composant React rendu côté serveur par défaut
- **Client Component** : composant React interactif rendu côté client

---

## User Stories

### US-01 — Shell commun multi-rôles

**As an** utilisateur authentifié `owner`, `merchant` ou `admin`  
**I want to** retrouver une structure de navigation et de page cohérente  
**So that** je comprends immédiatement où je suis et quelles actions sont disponibles

#### Acceptance Criteria

- **AC-01-01**: Given un Owner sur `/dashboard`, un Merchant sur `/merchant/*` et un Admin sur `/admin/*`, When une page dashboard se charge, Then elle utilise le même shell structurel : sidebar desktop, topbar, en-tête de page et zone de contenu principale.
- **AC-01-02**: Given un viewport mobile, When l'utilisateur ouvre la navigation dashboard, Then il retrouve la même arborescence métier que sur desktop via un drawer mobile commun, sans bottom navigation spécifique par rôle.
- **AC-01-03**: Given un utilisateur connecté, When le shell calcule la navigation, Then seuls les liens autorisés pour son rôle et ses specs approuvées sont affichés.
- **AC-01-04**: Given un Admin avec des `MerchantClaim` pending, When la navigation admin s'affiche, Then le lien "Revendications" expose un badge de volume basé sur les données réelles.

### US-02 — Pages d'accueil plus lisibles

**As a** utilisateur dashboard  
**I want to** des pages overview construites avec une grammaire visuelle commune  
**So that** je repère rapidement contexte, KPI, actions et blocages

#### Acceptance Criteria

- **AC-02-01**: Given les pages `/dashboard`, `/merchant/dashboard` et `/admin`, When elles s'affichent, Then le premier écran contient toujours : kicker, titre, description courte et zone d'actions principale.
- **AC-02-02**: Given une grille de KPI, When elle est rendue, Then chaque carte suit la même composition : libellé, valeur, support text optionnel, icône ou accent visuel, avec responsive homogène.
- **AC-02-03**: Given un graphique, un tableau ou un bloc de synthèse secondaire, When il est affiché dans un dashboard overview, Then il est présenté dans des panneaux cohérents de même niveau visuel.
- **AC-02-04**: Given un dashboard overview sans donnée exploitable, When il s'affiche, Then il présente un empty state standardisé avec message, contexte et CTA principal sans dead-end.

### US-03 — Tables, formulaires et états partagés

**As a** utilisateur dashboard  
**I want to** des patterns cohérents pour les listes, formulaires et retours système  
**So that** les interactions restent prévisibles d'un espace à l'autre

#### Acceptance Criteria

- **AC-03-01**: Given une page de formulaire dashboard, When elle s'affiche, Then les champs, aides, validations et actions de soumission apparaissent dans des zones constantes entre `owner`, `merchant` et `admin`.
- **AC-03-02**: Given une page liste ou tableau dashboard, When elle s'affiche, Then elle utilise une même structure : header de section, zone d'outils/filtres si prévue par la spec métier, puis table ou liste dans un conteneur homogène.
- **AC-03-03**: Given un chargement, une erreur récupérable ou une liste vide, When l'état correspondant se produit, Then l'interface utilise des composants partagés de skeleton, alert et empty state, sans exposer de détail technique brut.

### US-04 — Refonte sans dérive métier

**As a** Product Owner  
**I want to** une refonte strictement additive sur la couche shell/UI  
**So that** les règles métier existantes ne changent pas à cause du redesign

#### Acceptance Criteria

- **AC-04-01**: Given les routes et pages déjà définies par `010`, `013`, `015`, `016`, `017`, `018` et `019`, When `020` est implémentée, Then leurs contrats métier et leurs payloads existants restent inchangés ; seule une route additive de contexte shell est autorisée.
- **AC-04-02**: Given le benchmark visuel externe est indisponible, When un dashboard StayLocal se charge, Then aucune dépendance runtime vers ce template externe n'est requise.
- **AC-04-03**: Given une tentative d'accès à un espace dashboard non autorisé, When la route est résolue, Then les garde-fous d'authentification et d'autorisation existants restent la source de vérité.

---

## Business Rules

- **BR-01**: `020` modifie uniquement la couche shell, composition visuelle, navigation et composants d'interface partagés des dashboards.
- **BR-02**: Les règles métier, champs, KPI, mutations et permissions définis dans `010`, `013`, `015`, `016`, `017`, `018` et `019` restent inchangés et prioritaires.
- **BR-03**: Le benchmark `modernize-tailwind-nextjs-main.vercel.app` est une référence de style uniquement ; aucun code, asset, texte, icône propriétaire, screenshot, bundle, iframe ou dépendance runtime ne doit être repris.
- **BR-04**: La refonte dashboard doit être implémentée avec Tailwind CSS + Shadcn/ui uniquement, conformément aux règles globales du projet.
- **BR-05**: La navigation affichée dépend exclusivement du rôle authentifié et de l'existence des modules dashboard approuvés ou implémentés pour ce rôle.
- **BR-06**: Les espaces `owner` et `merchant` restent mobile-first ; l'espace `admin` reste desktop-first, mais tous partagent les mêmes primitives de shell responsive.
- **BR-07**: Le shell commun doit supporter trois modes de largeur de contenu : `default`, `wide` et `full`, choisis par route selon la nature de la page.
- **BR-08**: Les états `loading`, `empty` et `error` des dashboards utilisent des composants partagés et des messages orientés action, sans stack trace ni message serveur brut.
- **BR-09**: `020` n'introduit aucun nouveau modèle Prisma, aucune migration base, aucune nouvelle donnée métier obligatoire et aucune modification de rôle.
- **BR-10**: Toute information de badge ou de contexte affichée par le shell doit être calculée à partir des données existantes ; en absence de donnée fiable, l'information est masquée et non simulée.

---

## Data Model

Cette spec n'introduit **aucun** nouveau modèle Prisma et ne modifie pas le schéma existant.

```prisma
// 020 réutilise les modèles existants pour composer le shell visuel.
// Aucun champ ci-dessous n'est ajouté, retiré ou modifié par cette spec.

model User {
  id            String         @id @default(uuid())
  created_at    DateTime       @default(now())
  updated_at    DateTime       @updatedAt
  deleted_at    DateTime?

  email         String         @unique
  role          String
  is_active     Boolean

  subscriptions Subscription[]
  lodgings      Lodging[]
}

model Subscription {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  user_id     String
  status      String
  plan        String
}

model Lodging {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  owner_id    String
  city_id     String
  is_active   Boolean   @default(true)
}

model PointOfInterest {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  city_id     String
  is_active   Boolean   @default(true)
}

model Analytics {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())

  city_id     String
  lodging_id  String?
  poi_id      String?
  event_type  String
}

model MerchantClaim {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  merchant_id String
  poi_id      String
  status      String
}

model MerchantProfile {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  merchant_id String    @unique
  poi_id      String    @unique
  status      String
}

model City {
  id          String    @id @default(uuid())
  created_at  DateTime  @default(now())
  updated_at  DateTime  @updatedAt
  deleted_at  DateTime?

  slug        String    @unique
  name        String
  postal_code String
  is_active   Boolean   @default(true)
}
```

---

## API Contract

> Authentification : session Supabase par cookie, gérée par middleware / helpers existants.  
> Cette spec ajoute uniquement une route de contexte shell transverse.  
> Les routes métier existantes de `010`, `013`, `015`, `016`, `017`, `018` et `019` ne changent pas de contrat.

```yaml
paths:
  /api/dashboard-shell/context:
    get:
      summary: "Contexte de shell dashboard pour le rôle authentifié"
      tags: [dashboard-shell]
      responses:
        "200":
          description: Contexte UI partagé des dashboards
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/DashboardShellContext"
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"

components:
  schemas:
    DashboardShellContext:
      type: object
      required: [workspace, shell_title, user, navigation]
      properties:
        workspace:
          type: string
          enum: [owner, merchant, admin]
        shell_title:
          type: string
        shell_subtitle:
          type: string
          nullable: true
        account_badge:
          nullable: true
          $ref: "#/components/schemas/DashboardAccountBadge"
        user:
          $ref: "#/components/schemas/DashboardShellUser"
        navigation:
          type: array
          minItems: 1
          items:
            $ref: "#/components/schemas/DashboardNavigationItem"

    DashboardShellUser:
      type: object
      required: [email, role]
      properties:
        email:
          type: string
          format: email
        role:
          type: string
          enum: [owner, merchant, admin]
        display_name:
          type: string
          nullable: true

    DashboardAccountBadge:
      type: object
      required: [label, tone]
      properties:
        label:
          type: string
        tone:
          type: string
          enum: [neutral, info, success, warning]

    DashboardNavigationItem:
      type: object
      required: [href, label, icon, group]
      properties:
        href:
          type: string
        label:
          type: string
        icon:
          type: string
          enum:
            - layout-dashboard
            - building-2
            - bar-chart-3
            - credit-card
            - store
            - file-pen-line
            - ticket-percent
            - tags
            - radar
            - mountain
            - map-pin-plus
            - users
        group:
          type: string
          enum: [primary, management, operations, billing]
        badge_count:
          type: integer
          nullable: true
          minimum: 0
```

---

## UI Behaviour

### Benchmark visuel

- La hiérarchie visuelle, l'orchestration sidebar/header et la densité générale peuvent s'inspirer du benchmark Modernize.
- StayLocal conserve sa propre identité : typographie, libellés, couleurs, rôles métier, routes, données et composants Shadcn.
- Le benchmark n'apparaît jamais dans le produit final comme dépendance technique ou contenu embarqué.

### Shell partagé

- Desktop : sidebar persistante à gauche, topbar supérieure, contenu principal à droite.
- Mobile : topbar sticky avec bouton menu ouvrant un drawer ; la sidebar desktop n'est jamais simplement compressée en scroll horizontal.
- Le shell expose toujours :
  - un marqueur d'espace (`Owner`, `Merchant`, `Super-Admin`) ;
  - le nom produit StayLocal ;
  - une navigation groupée ;
  - une zone utilisateur / statut de compte ;
  - une action de déconnexion.
- Les sections de navigation sont regroupées par intention (`primary`, `management`, `operations`, `billing`) et gardent le même ordre d'un rendu à l'autre.

### Headers de page

- Chaque page dashboard commence par un header avec :
  - kicker court en uppercase ;
  - titre principal ;
  - description en une ou deux phrases ;
  - zone d'actions principales alignée à droite sur desktop et repliée sous le titre sur mobile.
- Le shell supporte les largeurs :
  - `default` : formulaires et pages simples ;
  - `wide` : overviews et pages à plusieurs panneaux ;
  - `full` : tableaux et écrans opératoires denses.

### Pages overview

- Une overview combine dans cet ordre : header, KPI grid, panneaux secondaires (graphiques / résumé / alertes), puis tableaux ou listes d'aperçu.
- Les KPI cards partagent une même structure et ne mélangent pas plusieurs niveaux de priorité dans une seule carte.
- Les panneaux secondaires utilisent des cartes de même profondeur visuelle pour éviter qu'un rôle paraisse "premium" uniquement par son style.

### Listes, tableaux et formulaires

- Les listes et tableaux dashboard vivent dans un conteneur carte homogène avec header de section et éventuelle zone d'outils.
- Les formulaires affichent systématiquement :
  - libellé ;
  - aide contextuelle quand prévue ;
  - validation inline ;
  - zone d'actions persistante en bas de formulaire ou dans le header selon la longueur.
- En desktop large, une page peut combiner contenu principal + aside contextuel tant que l'aside ne contient pas de logique métier supplémentaire.

### États système

- `loading` : skeletons alignés sur la future structure réelle de la page.
- `empty` : illustration simple optionnelle, message explicite, raison du vide, CTA principal.
- `error` : alerte claire, sans stack trace, avec action de reprise si la spec métier la permet.

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Shell commun sidebar/topbar/contenu sur owner, merchant et admin | integration |
| AC-01-02 | Navigation mobile via drawer commun sans bottom nav spécifique | e2e |
| AC-01-03 | Navigation filtrée strictement par rôle et modules autorisés | contract |
| AC-01-04 | Badge revendications admin alimenté par les données réelles | integration |
| AC-02-01 | Headers overview harmonisés sur les trois home dashboards | integration |
| AC-02-02 | KPI cards suivent une composition commune et responsive | integration |
| AC-02-03 | Graphiques, tableaux et blocs secondaires utilisent des panneaux cohérents | integration |
| AC-02-04 | Empty states overview standardisés avec CTA principal | e2e |
| AC-03-01 | Formulaires dashboards partagent zones de champs, aides et actions | integration |
| AC-03-02 | Listes et tableaux dashboards partagent une structure homogène | integration |
| AC-03-03 | Loading, error et empty states utilisent des composants partagés | e2e |
| AC-04-01 | Contrats métier existants inchangés, seule la route shell est additive | contract |
| AC-04-02 | Aucune dépendance runtime au benchmark externe | integration |
| AC-04-03 | Garde-fous d'accès existants restent la source de vérité | contract |

---

## Out of Scope

- Refonte du guide public Tourist.
- Changement des règles métier Owner, Merchant ou Admin déjà définies dans les specs dépendantes.
- Ajout de nouveaux KPI, nouveaux champs métier ou nouveaux workflows d'approbation.
- Refonte billing fonctionnelle, revenus Stripe, checkout, webhooks ou portail client.
- Création d'un design system parallèle au lieu de réutiliser Shadcn/ui.
- Copie partielle ou totale de code, assets, illustrations, bundle ou structure de dépendances du benchmark externe.
- Modification du schéma Prisma ou création de tables de préférences UI persistées.

---

## Open Questions

Aucune — spec prête pour validation Product Owner.
