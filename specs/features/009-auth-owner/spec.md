# Spec — 009 Auth Owner

## Metadata

```yaml
id: 009-auth-owner
title: "Authentification hébergeur"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-05-22
updated_at: 2026-10-01
depends_on: [001-city-guide]
```

---

## Context

Le MVP 2 introduit trois espaces authentifiés distincts :
- `/dashboard/*` → Owner (hébergeur, conciergerie, hôtel)
- `/merchant/*` → Merchant (restaurateur, prestataire, spa, etc.)
- `/admin/*` → Super-Admin (équipe StayLocal)

Cette spec couvre uniquement l'authentification commune aux trois rôles via Supabase Auth (email + mot de passe). Le rôle détermine la redirection post-connexion. Aucune auth sociale en MVP 2.

### Décision Product Owner — 2026-07-19

Un utilisateur Supabase authentifié dont le rôle est absent, inconnu ou égal à `tourist` ne dispose d'aucun accès valide aux espaces protégés. Lorsqu'il accède à `/dashboard/*`, `/merchant/*` ou `/admin/*`, le middleware le redirige vers `/auth/login` afin de resynchroniser son compte, jamais vers une page publique. Le nouveau partage de séjour est différé et ne fait pas partie de cette décision.

### Décision Product Owner — 2026-09-29 — Provisionnement ponctuel Owner

Le Product Owner autorise la création administrative du lot de cinq nouveaux
Owners et de leurs logements explicitement fournis dans la conversation.
Ce lot utilise les vrais emails des propriétaires, un mot de passe initial
commun choisi par le Product Owner et `email_confirm: true` via Supabase Admin.
Les propriétaires pourront ensuite choisir leur mot de passe par le parcours
de réinitialisation existant. Il n'existe pas d'obligation technique de changement
au premier accès dans ce périmètre.

L'opération est exécutée côté serveur, sans nouveau endpoint ni interface. Elle
crée aussi le `User` applicatif, son abonnement `free` / `trial` de douze mois
et le `Lodging` rattaché à une `City` active existante selon la spec `010`.
Elle ne remplace aucun mot de passe existant, ne modifie aucun rôle existant,
ne réactive aucun compte archivé et ne crée aucune ville. Une relance doit
reconnaître les comptes et logements déjà créés afin d'éviter les doublons.
Aucun email n'est envoyé par cette opération ponctuelle : le Product Owner
prépare le contenu avant la remise des accès. Les secrets restent dans un
fichier local protégé, non versionné et absent des logs.

Cette autorisation ne s'applique pas au formulaire public `/auth/register`,
dont la confirmation email reste requise conformément à AC-01-05.

---

### Décision Product Owner — 2026-10-01 — Activation Chalet Remy

Le Product Owner autorise explicitement l'activation du compte Owner existant
associé au Chalet Remy : confirmation administrative de son email, application
du mot de passe fourni en conversation et création de son logement à
Saint-Gervais-les-Bains. Conserver le User actif, le rôle Owner et tout abonnement
existant ; créer l'essai gratuit standard uniquement s'il manque. Aucun doublon,
aucun email envoyé, aucune modification des autres comptes. Vérifier la connexion
et l'accès au logement. Les identifiants secrets restent hors dépôt et hors logs.
Cette exception ponctuelle à la conservation du mot de passe existant ne modifie
pas les règles du formulaire public d'inscription.

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
- **AC-01-05**: Given la confirmation email activée dans Supabase, When l'inscription réussit sans session, Then le formulaire indique qu'un email de confirmation a été envoyé ; le clic de confirmation vérifie le jeton côté serveur et ouvre le dashboard selon le rôle. Sans confirmation valide, aucun accès n'est accordé.
- **AC-01-06**: Given le lot Owner autorisé le 2026-09-29, When son provisionnement administratif est exécuté, Then chaque nouvel Owner possède un compte Auth confirmé, un User `owner`, un seul abonnement d'essai et son logement lié à la bonne ville ; la connexion et la liste des logements sont vérifiées avec le mot de passe initial sans en journaliser la valeur. Une relance ne crée pas de doublon et ne change pas le mot de passe d'un compte existant.

Correction technique du 2026-09-29 — US-01 : une panne serveur indiquant
explicitement « Error sending confirmation email » déclenche un secours
Supabase Admin `generateLink` de type `signup`, avec le mot de passe et les
métadonnées owner/merchant validés par Zod. Le lien est envoyé par Resend depuis
`MyStay <bonjour@mystay.city>` vers `/auth/confirm-registration?token_hash=…`.
Le compte reste non confirmé jusqu'à la vérification du lien ; aucun flag
`email_confirm: true`, aucune création de session depuis un jeton Admin, aucun
changement de mot de passe d'un compte existant. Les refus 401, quotas 429,
inscriptions désactivées et erreurs de base ne déclenchent pas ce secours.
Un échec d'envoi retourne 503 `EMAIL_SEND_FAILED` en français, sans réponse
brute du fournisseur. Les emails, mots de passe et jetons ne sont pas loggés.
Le compte applicatif et son abonnement sont créés une seule fois, avec les
valeurs trial existantes, et un email déjà utilisé conserve le refus 409.
L'email de bienvenue utilise le même domaine expéditeur vérifié mystay.city.

### US-02 — Connexion

**As a** utilisateur authentifiable
**I want to** me connecter
**So that** j'accède à mon espace

#### Acceptance Criteria

- **AC-02-01**: Given la page `/auth/login`, When l'utilisateur soumet des identifiants valides, Then il est redirigé vers son dashboard selon son rôle
- **AC-02-02**: Given des identifiants incorrects, When l'utilisateur soumet, Then un message générique est affiché ("Email ou mot de passe incorrect") — sans préciser lequel est faux
- **AC-02-03**: Given un utilisateur non authentifié accédant à `/dashboard/*`, `/merchant/*` ou `/admin/*`, When la requête arrive au middleware, Then il est redirigé vers `/auth/login`
- **AC-02-04**: Given un utilisateur Supabase authentifié dont le rôle est absent, inconnu ou égal à `tourist`, When il accède à `/dashboard/*`, `/merchant/*` ou `/admin/*`, Then le middleware le redirige vers `/auth/login` afin de resynchroniser son compte, jamais vers une page publique

- **AC-02-05**: Given le formulaire de connexion, When l'utilisateur active le bouton œil au clic ou au clavier, Then le mot de passe est affiché puis masqué sans modification de valeur ni soumission du formulaire (demande Product Owner du 2026-09-27).

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

Correction technique du 2026-09-29 — AC-04-01 : la réponse neutre concerne
l'existence du compte, pas les pannes d'envoi. Si Supabase refuse l'envoi pour
quota, l'API retourne 429 `EMAIL_RATE_LIMITED` ; toute autre panne retourne 503
`EMAIL_SEND_FAILED`. Le formulaire affiche l'erreur et permet de réessayer,
sans annoncer un email envoyé. Les détails internes du fournisseur ne sont
jamais affichés, et les emails/jetons ne sont jamais journalisés.

Diagnostic technique du 2026-09-29 — AC-04-01 : si le fournisseur retourne 401,
les logs peuvent qualifier un refus explicite « Invalid API key » et indiquer
uniquement le projet public ciblé, le type de clé, la présence d'espaces ou de
guillemets et, pour une clé JWT, si son rôle/projet/expiration correspondent.
La présence d'une variable de clé publishable et le nom de la variable retenue
peuvent être indiqués sans leur valeur.
Aucune clé, charge JWT complète, email ou réponse brute n'est journalisée. Le
message public reste générique et ne révèle pas l'existence d'un compte.

Correction technique de livraison du 2026-09-29 — AC-04-01 : si Supabase
retourne une erreur serveur indiquant explicitement l'échec de l'envoi du mail
de récupération, le serveur peut générer un lien `recovery` via Supabase Admin
et l'envoyer avec Resend, depuis `MyStay <bonjour@mystay.city>`. Le lien pointe
directement vers `/auth/reset-password?token_hash=…`. Une réponse 200 est
autorisée uniquement après acceptation Resend (identifiant d'email présent),
ou pour un compte inexistant (réponse neutre). Les refus 401 et quotas 429 de
Supabase ne déclenchent jamais ce secours. Un échec du secours reste 503,
ou 429 s'il s'agit d'un quota du fournisseur. Les jetons, adresses et corps des
emails ne sont pas journalisés ; seul l'identifiant d'envoi peut l'être. Aucun
compte ni mot de passe n'est créé ou modifié lors de la demande de lien.

Compatibilité technique du 2026-09-29 — AC-04-02 : la réinitialisation accepte
le lien personnalisé `token_hash` et le lien standard Supabase contenant un
`code` PKCE. Le code est échangé côté serveur avec le vérificateur du navigateur
à la soumission, avant la mise à jour du mot de passe. Aucun accès n'est accordé
sans vérification réussie par Supabase. Un jeton manquant, expiré ou un code
non vérifiable ne déclenche aucune mise à jour.

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
- **BR-10**: Un utilisateur Supabase authentifié dont le rôle est absent, inconnu ou `tourist` ne possède aucun accès valide aux espaces protégés ; toute tentative d'accès à `/dashboard/*`, `/merchant/*` ou `/admin/*` redirige vers `/auth/login` pour resynchronisation, jamais vers une page publique.

Contrainte technique — correction du build du 2026-09-29 : importer les helpers
Supabase serveur ne doit pas créer de client navigateur. Les clients serveur
sont créés lors des requêtes. Sans URL/clé configurées, une requête utilisant
Supabase reste en échec ; aucun client de remplacement ni contournement de
l'authentification n'est autorisé. Les variables
`NEXT_PUBLIC_SUPABASE_URL`, une clé publique et `SUPABASE_SERVICE_ROLE_KEY`
doivent être disponibles dans l'environnement Vercel cible. Les clients
authentifiés utilisent `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` en priorité,
puis `NEXT_PUBLIC_SUPABASE_ANON_KEY` si la première variable est absente ou
vide ; les espaces autour des valeurs sont retirés. La clé service-role reste
exclusivement côté serveur et n'est jamais un remplacement de la clé publique.
Cette compatibilité technique couvre les clients de route, de page et de
middleware, sans modifier les règles d'accès ni le contrat de récupération.

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
        "429":
          description: Envoi temporairement limité
        "503":
          description: Email de confirmation indisponible (EMAIL_SEND_FAILED)

  /api/auth/confirm-registration:
    post:
      summary: Confirmation email d'une inscription owner ou merchant
      tags: [auth]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              oneOf:
                - required: [token]
                  not:
                    required: [code]
                - required: [code]
                  not:
                    required: [token]
              properties:
                token:
                  type: string
                  minLength: 1
                code:
                  type: string
                  minLength: 1
      responses:
        "200":
          description: Email confirmé et session initialisée
          content:
            application/json:
              schema:
                type: object
                required: [redirect_to]
                properties:
                  redirect_to:
                    type: string
        "400":
          description: Lien manquant, invalide ou expiré
        "403":
          description: Rôle non éligible à une inscription publique
        "503":
          description: Service de confirmation indisponible

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
        "400":
          $ref: "#/components/responses/BadRequest"
        "429":
          description: Envoi temporairement limité (EMAIL_RATE_LIMITED)
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "503":
          description: Service d'envoi indisponible (EMAIL_SEND_FAILED)
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

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
              required: [password]
              oneOf:
                - required: [token]
                  not:
                    required: [code]
                - required: [code]
                  not:
                    required: [token]
              properties:
                token:
                  type: string
                  minLength: 1
                  description: token_hash extrait du lien personnalisé
                code:
                  type: string
                  minLength: 1
                  description: Code PKCE du lien standard Supabase, vérifié avec le cookie du navigateur
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
        confirmation_required:
          type: boolean
          description: Présent sur l'inscription, vrai si aucune session n'a été créée et l'adresse doit être confirmée
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
- Décision Product Owner du 2026-09-27 — **AC-02-05** : mot de passe masqué par défaut ; un bouton œil accessible au clavier permet de l'afficher puis de le masquer sans modifier sa valeur ni soumettre le formulaire. Son libellé accessible indique « Afficher le mot de passe » ou « Masquer le mot de passe ».
- Décision Product Owner du 2026-09-29 — **AC-04-01** : l'accès à
  `/auth/forgot-password` est une action dédiée « Réinitialiser mon mot de passe »
  sous « Se connecter », hors du formulaire de connexion. Elle est visible sans
  saisie du mot de passe, soulignée et possède une zone cliquable d'au moins
  44 px de haut sur toute la largeur du formulaire. Elle remplace le petit lien
  près du libellé Mot de passe et reste disponible après un échec de connexion.
- Lien "Créer un compte" → `/auth/register`
- **Loading** : bouton désactivé + spinner
- **Error** : message inline "Email ou mot de passe incorrect"
- Design : charte MyStay (`#FAF9F6`, serif italic, `max-w-[430px]`)

### Page : `/auth/register`
- Formulaire : prénom + nom + email + mot de passe + sélecteur rôle (Hébergeur / Prestataire)
- Validation temps réel : mot de passe ≥ 8 caractères
- **Success** : redirection automatique vers le bon dashboard selon le rôle si
  Supabase a créé une session. Sinon, confirmation d'envoi du mail et invitation
  à valider l'adresse, sans redirection vers un espace protégé.

### Page : `/auth/confirm-registration`
- Formulaire de confirmation avec bouton « Confirmer mon adresse email ».
- Le jeton ou code n'est vérifié qu'au clic explicite, pour éviter sa consommation
  par une prévisualisation d'email. Aucun jeton n'est journalisé.
- Sans jeton/code, bouton désactivé et message de lien invalide.
- Après réponse API 200, redirection selon le rôle vérifié : owner `/dashboard`,
  merchant `/merchant/onboarding`. Aucun paramètre de redirection libre.
- Un échec affiche un message français et permet de revenir à la connexion.

### Page : `/auth/forgot-password`
- Formulaire : email + bouton "Envoyer le lien"
- **Success** : "Si cet email existe, un lien vous a été envoyé" après une réponse
  API 200, identique pour un compte connu ou inconnu.
- **Error** : refus d'envoi ou problème réseau annoncé dans une alerte ; email
  saisi conservé et bouton réactivé, aucun faux message de succès.

### Page : `/auth/reset-password`
- Accessible uniquement via un lien Supabase contenant `token_hash` ou `code`
  en query param. Le formulaire reste désactivé en l'absence de l'un des deux.
- Formulaire : nouveau mot de passe + confirmation + bouton "Définir le mot de passe"
- Demande Product Owner du 2026-09-29 — **AC-04-02** : chacun des deux champs
  possède un bouton œil pour afficher ou masquer sa valeur indépendamment.
  Les valeurs restent masquées par défaut ; le bouton est accessible au clavier,
  annonce Afficher/Masquer et ne modifie ni la saisie ni la validation, sans
  soumettre le formulaire.
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
| AC-01-05 | Email requis → attente visible, confirmation vérifiée puis dashboard | integration |
| AC-02-01 | Connexion valide → redirection selon rôle | integration |
| AC-02-02 | Identifiants incorrects → message générique | unit |
| AC-02-05 | Œil : afficher/masquer le mot de passe sans modifier la saisie ni soumettre | integration |
| AC-02-03 | Accès dashboard sans auth → redirect /auth/login | e2e |
| AC-02-04/BR-10 | Rôle absent, inconnu ou tourist sur espace protégé → redirect /auth/login, jamais page publique | unit |
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
