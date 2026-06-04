# Spec — 009 Auth Owner

## Metadata

```yaml
id: 009-auth-owner
title: "Authentification hébergeur"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-06-04
depends_on: [001-city-guide]
```

---

## Context

Le MVP 2 introduit trois espaces authentifiés distincts :
- `/dashboard/*` → Owner (hébergeur, conciergerie, hôtel)
- `/merchant/*` → Merchant (restaurateur, prestataire, spa, etc.)
- `/admin/*` → Super-Admin (équipe StayLocal)

Cette spec couvre uniquement l'authentification commune aux trois rôles via Supabase Auth (email + mot de passe). Le rôle détermine la redirection post-connexion. Aucune auth sociale en MVP 2.

---

## Glossary References

- **Owner** : hébergeur, conciergerie ou hôtel — accède à `/dashboard`
- **Merchant** : restaurateur, prestataire, spa — accède à `/merchant`
- **Admin** : équipe StayLocal — accède à `/admin`
- **Role** : `owner` | `merchant` | `admin` — stocké dans `user_metadata` Supabase
- **Subscription** : abonnement créé automatiquement à l'inscription, statut `trial` 12 mois

---

## User Stories

### US-01 — Inscription

**As a** Owner ou Merchant
**I want to** créer un compte StayLocal
**So that** j'accède à mon espace personnel

#### Acceptance Criteria

- **AC-01-01**: Given la page `/auth/register`, When l'utilisateur soumet email + mot de passe + rôle valides, Then un compte Supabase est créé avec le bon rôle et il est redirigé vers son dashboard (`/dashboard` si owner, `/merchant` si merchant)
- **AC-01-02**: Given un email déjà utilisé, When l'utilisateur tente de s'inscrire, Then un message d'erreur clair est affiché — pas de doublon créé
- **AC-01-03**: Given une inscription réussie, When le compte est créé, Then un `Subscription` est créé automatiquement avec `status: trial`, `plan: free`, `trial_ends_at: now + 12 mois`
- **AC-01-04**: Given une inscription réussie, When le compte est créé, Then un email de bienvenue est envoyé via Resend

### US-02 — Connexion

**As a** utilisateur authentifiable
**I want to** me connecter
**So that** j'accède à mon espace

#### Acceptance Criteria

- **AC-02-01**: Given la page `/auth/login`, When l'utilisateur soumet des identifiants valides, Then il est redirigé vers son dashboard selon son rôle
- **AC-02-02**: Given des identifiants incorrects, When l'utilisateur soumet, Then un message générique est affiché ("Email ou mot de passe incorrect") — sans préciser lequel est faux
- **AC-02-03**: Given un utilisateur non authentifié accédant à `/dashboard/*`, `/merchant/*` ou `/admin/*`, When la requête arrive au middleware, Then il est redirigé vers `/auth/login`

### US-03 — Déconnexion

**As a** utilisateur connecté
**I want to** me déconnecter
**So that** ma session est fermée

#### Acceptance Criteria

- **AC-03-01**: Given un utilisateur connecté, When il clique "Se déconnecter", Then la session Supabase est invalidée et il est redirigé vers `/`
- **AC-03-02**: Given une session expirée, When l'utilisateur accède à son dashboard, Then il est redirigé vers `/auth/login` sans erreur

### US-04 — Réinitialisation mot de passe

**As a** utilisateur
**I want to** réinitialiser mon mot de passe oublié
**So that** je retrouve l'accès à mon compte

#### Acceptance Criteria

- **AC-04-01**: Given la page `/auth/forgot-password`, When l'utilisateur soumet son email, Then un email de réinitialisation est envoyé (même réponse si email inexistant)
- **AC-04-02**: Given un lien de réinitialisation valide, When l'utilisateur soumet un nouveau mot de passe, Then le mot de passe est mis à jour et il est redirigé vers `/auth/login`

---

## Business Rules

- **BR-01**: Le middleware Next.js protège `/dashboard/*`, `/merchant/*` et `/admin/*` — jamais dans les composants
- **BR-02**: Le rôle est stocké dans `user_metadata` Supabase à l'inscription
- **BR-03**: Redirection post-login selon le rôle : `owner` → `/dashboard`, `merchant` → `/merchant`, `admin` → `/admin`
- **BR-04**: Un `owner` ne peut pas accéder à `/merchant/*` ou `/admin/*`, et inversement — le middleware redirige vers le dashboard propre au rôle (`/dashboard`, `/merchant` ou `/admin`) si l'utilisateur est authentifié mais accède à un espace interdit
- **BR-05**: Mot de passe minimum 8 caractères — validé Zod côté client et serveur
- **BR-06**: À l'inscription, `Subscription` créé automatiquement en `trial` gratuit 12 mois — aucun paiement
- **BR-07**: Monolingue français en MVP 2 — architecture i18n préparée
- **BR-08**: Aucune auth sociale (Google, Apple) en MVP 2
- **BR-09**: `/auth/login` est la route canonique de connexion. Toute route legacy `/login` doit rediriger vers `/auth/login` et ne doit pas rendre un second formulaire de connexion.

---

## Data Model

```prisma
model User {
  id          String   @id @default(uuid())
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  deleted_at  DateTime?

  supabase_id String   @unique
  email       String   @unique
  role        String   @default("owner")  # owner | merchant | admin
  first_name  String?
  last_name   String?
  phone       String?
  is_active   Boolean  @default(true)

  subscriptions Subscription[]
  // lodgings relation ajoutée dans spec 010-dashboard-owner
}

model Subscription {
  id            String   @id @default(uuid())
  created_at    DateTime @default(now())
  updated_at    DateTime @updatedAt
  deleted_at    DateTime?

  user_id       String
  user          User     @relation(fields: [user_id], references: [id])
  plan          String   @default("free")   # free | basic | pro | concierge
  status        String   @default("trial")  # trial | active | past_due | cancelled
  trial_ends_at DateTime
  ends_at       DateTime?
  stripe_subscription_id String?
  stripe_customer_id     String?
}
```

```typescript
// src/shared/types/roles.ts
export type Role = 'owner' | 'merchant' | 'admin'

export const DASHBOARD_ROUTES: Record<Role, string> = {
  owner: '/dashboard',
  merchant: '/merchant',
  admin: '/admin',
}
```

```typescript
// src/middleware.ts
export const config = {
  matcher: [
    '/dashboard/:path*',
    '/merchant/:path*',
    '/admin/:path*',
  ]
}
```

---

## API Contract

```yaml
paths:
  /api/auth/register:
    post:
      summary: "Inscription Owner ou Merchant"
      tags: [auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password, role, first_name, last_name]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                role:
                  type: string
                  enum: [owner, merchant]
                first_name:
                  type: string
                last_name:
                  type: string
      responses:
        "201":
          description: Compte créé
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AuthResult"
        "409":
          description: Email déjà utilisé
        "400":
          $ref: "#/components/responses/BadRequest"

  /api/auth/login:
    post:
      summary: "Connexion"
      tags: [auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email, password]
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
      responses:
        "200":
          description: Session initialisée
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AuthResult"
        "401":
          description: Identifiants incorrects

  /api/auth/logout:
    post:
      summary: "Déconnexion"
      tags: [auth]
      responses:
        "200":
          description: Session invalidée

  /api/auth/forgot-password:
    post:
      summary: "Demande de réinitialisation mot de passe"
      tags: [auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [email]
              properties:
                email:
                  type: string
                  format: email
      responses:
        "200":
          description: Email envoyé (même réponse si email inexistant)

  /api/auth/reset-password:
    post:
      summary: "Mise à jour du mot de passe via token de réinitialisation"
      tags: [auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [token, password]
              properties:
                token:
                  type: string
                  description: Token extrait de l'URL du lien Supabase
                password:
                  type: string
                  minLength: 8
      responses:
        "200":
          description: Mot de passe mis à jour
          content:
            application/json:
              schema:
                type: object
                properties:
                  success:
                    type: boolean
        "400":
          description: Token invalide ou expiré
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

components:
  schemas:
    AuthResult:
      type: object
      required: [user, subscription, redirect_to]
      properties:
        user:
          type: object
          properties:
            id:
              type: string
            email:
              type: string
            role:
              type: string
            first_name:
              type: string
            last_name:
              type: string
        subscription:
          type: object
          properties:
            plan:
              type: string
            status:
              type: string
            trial_ends_at:
              type: string
              format: date-time
        redirect_to:
          type: string
          description: "URL de redirection selon le rôle (/dashboard, /merchant, /admin)"

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

  responses:
    BadRequest:
      description: Paramètre manquant ou invalide
      content:
        application/json:
          schema:
            $ref: "#/components/schemas/Error"
```

---

## UI Behaviour

### Page : `/auth/login`
- Formulaire : email + mot de passe + bouton "Se connecter"
- Lien "Mot de passe oublié ?" → `/auth/forgot-password`
- Lien "Créer un compte" → `/auth/register`
- **Loading** : bouton désactivé + spinner
- **Error** : message inline "Email ou mot de passe incorrect"
- Design : charte MyStay (`#FAF9F6`, serif italic, `max-w-[430px]`)

### Page : `/auth/register`
- Formulaire : prénom + nom + email + mot de passe + sélecteur rôle (Hébergeur / Prestataire)
- Validation temps réel : mot de passe ≥ 8 caractères
- **Success** : redirection automatique vers le bon dashboard selon le rôle

### Page : `/auth/forgot-password`
- Formulaire : email + bouton "Envoyer le lien"
- **Success** : "Si cet email existe, un lien vous a été envoyé" (toujours affiché)

### Page : `/auth/reset-password`
- Accessible uniquement via le lien Supabase (contient le token en query param)
- Formulaire : nouveau mot de passe + confirmation + bouton "Définir le mot de passe"
- Validation : mots de passe identiques, minimum 8 caractères
- **Success** : redirection vers `/auth/login` avec message "Mot de passe mis à jour"
- **Error** : message "Lien invalide ou expiré" si le token est invalide ou expiré

---

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Inscription valide → compte + rôle + redirection correcte | integration |
| AC-01-02 | Email déjà utilisé → erreur, pas de doublon | unit |
| AC-01-03 | Inscription → Subscription trial créée | integration |
| AC-01-04 | Inscription → email bienvenue Resend | integration |
| AC-02-01 | Connexion valide → redirection selon rôle | integration |
| AC-02-02 | Identifiants incorrects → message générique | unit |
| AC-02-03 | Accès dashboard sans auth → redirect /auth/login | e2e |
| AC-03-01 | Déconnexion → session invalidée + redirect / | e2e |
| AC-03-02 | Session expirée → redirect /auth/login sans erreur | e2e |
| AC-04-01 | Forgot password → email envoyé (réponse identique) | unit |
| AC-04-02 | Reset password → mdp mis à jour + redirect login | integration |
| BR-09 | `/login` legacy redirige vers `/auth/login` | unit |

---

## Out of Scope

- Auth sociale Google / Apple (MVP 3+)
- Auth Tourist (MVP 4)
- 2FA / MFA (post-MVP)
- Gestion des rôles admin depuis l'interface (spec 016)
- Invitation d'un collaborateur par un Owner (post-MVP)

---

## Open Questions

Aucune — spec complète et prête pour review.
