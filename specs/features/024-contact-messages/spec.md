# Spec — 024 Contact Messages

## Metadata

```yaml
id: 024-contact-messages
title: "Messages de contact séjour vers dashboard Super-admin"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-06-04
updated_at: 2026-06-04
depends_on: [009-auth-owner, 010-dashboard-owner, 012-guide-customization, 016-dashboard-superadmin]
```

---

## Context

La page `/contact` doit devenir un formulaire exploitable pour les Tourists en séjour. Un Tourist peut envoyer une demande destinée au Propriétaire du logement ou à la Conciergerie. Tous les messages sont centralisés dans le dashboard Super-admin global afin que l'équipe MyStay garde une copie et puisse répondre, suivre ou archiver les demandes.

---

## Glossary References

- **Tourist** : utilisateur final sans compte
- **Lodging** : logement associé au séjour courant
- **Owner** : propriétaire ou gestionnaire du logement
- **Super-Admin** : administrateur global MyStay
- **Contact Message** : message envoyé depuis la page Contact
- **Soft Delete** : suppression logique via timestamp

---

## User Stories

### US-01 — Envoyer une demande de contact

**As a** Tourist  
**I want to** envoyer un message depuis la page Contact de mon séjour  
**So that** je puisse joindre le Propriétaire ou la Conciergerie sans quitter MyStay

#### Acceptance Criteria

- **AC-01-01**: Given un séjour actif, When la page `/contact` s'affiche, Then un formulaire demande nom, email, téléphone optionnel, destination, sujet et message
- **AC-01-02**: Given le Tourist choisit `Propriétaire`, When il envoie un formulaire valide, Then le message est stocké avec le Lodging, l'Owner du Lodging et la destination `owner`
- **AC-01-03**: Given le Tourist choisit `Conciergerie`, When il envoie un formulaire valide, Then le message est stocké avec le Lodging si connu et la destination `concierge`
- **AC-01-04**: Given un formulaire invalide, When le Tourist soumet, Then l'API retourne une erreur Zod structurée et aucun message n'est créé

### US-02 — Voir les messages dans le dashboard Super-admin

**As a** Super-Admin  
**I want to** voir les messages de contact dans mon dashboard global  
**So that** je garde une copie centralisée des demandes voyageurs

#### Acceptance Criteria

- **AC-02-01**: Given un message reçu, When le dashboard `/admin` s'affiche, Then la section Messages affiche le nom du logement, la destination, la date, le sujet et les actions
- **AC-02-02**: Given un message affiché, When le Super-admin clique l'icône oeil, Then un modal affiche les détails complets du message
- **AC-02-03**: Given un message affiché, When le Super-admin clique l'icône corbeille, Then le message est archivé via `archived_at` et reste consultable dans l'onglet Archivés

### US-03 — Répondre à un message

**As a** Super-Admin  
**I want to** répondre depuis le modal du message  
**So that** le Tourist reçoive une réponse et que la trace reste en base

#### Acceptance Criteria

- **AC-03-01**: Given un message ouvert, When le Super-admin saisit une réponse valide, Then la réponse est sauvegardée avec `reply_body`, `replied_at`, `replied_by_user_id` et le statut `replied`
- **AC-03-02**: Given `RESEND_API_KEY` est configuré, When le Super-admin répond, Then un email est envoyé au `sender_email`
- **AC-03-03**: Given `RESEND_API_KEY` est absent, When le Super-admin répond, Then la réponse est sauvegardée et l'API indique que l'email n'a pas été envoyé

---

## Business Rules

- **BR-01**: Tout Contact Message créé depuis un séjour est visible dans l'inbox Super-admin globale, même s'il est destiné au Propriétaire.
- **BR-02**: La destination vaut uniquement `owner` ou `concierge`.
- **BR-03**: La destination `owner` nécessite un `lodging_id` valide avec Owner actif. Sans Lodging valide, l'API refuse la demande.
- **BR-04**: La destination `concierge` peut être créée avec ou sans Lodging, mais si un Lodging est fourni il doit exister et ne pas être soft-deleted.
- **BR-05**: Les messages ne sont jamais supprimés physiquement ; l'action corbeille renseigne `archived_at` et le statut `archived`.
- **BR-06**: Les messages archivés restent visibles dans le dashboard Super-admin via l'onglet Archivés.
- **BR-07**: Seul un utilisateur `admin` peut lister, archiver ou répondre aux messages.
- **BR-08**: Les champs publics sont validés avec Zod : nom 2–120 caractères, email valide, téléphone optionnel max 40 caractères, sujet 2–160 caractères, message 10–2000 caractères.
- **BR-09**: La réponse Super-admin est limitée à 2000 caractères.
- **BR-10**: Le formulaire public ne demande pas de compte Tourist.

---

## Data Model

```prisma
enum ContactMessageDestination {
  owner
  concierge
}

enum ContactMessageStatus {
  new
  replied
  archived
}

model ContactMessage {
  id                 String   @id @default(uuid())
  created_at         DateTime @default(now())
  updated_at         DateTime @updatedAt
  deleted_at         DateTime?

  lodging_id         String?
  lodging            Lodging? @relation(fields: [lodging_id], references: [id])
  owner_id           String?
  owner              User?    @relation("ContactMessageOwner", fields: [owner_id], references: [id])

  destination        ContactMessageDestination
  status             ContactMessageStatus @default(new)
  sender_name        String
  sender_email       String
  sender_phone       String?
  subject            String
  message            String
  archived_at        DateTime?
  reply_body         String?
  replied_at         DateTime?
  replied_by_user_id String?

  @@index([created_at])
  @@index([lodging_id])
  @@index([owner_id])
  @@index([status])
}
```

Le modèle `Lodging` expose `contact_messages ContactMessage[]`. Le modèle `User` expose `owned_contact_messages ContactMessage[] @relation("ContactMessageOwner")`.

---

## API Contract

```yaml
paths:
  /api/public/contact-messages:
    post:
      summary: "Créer un message de contact public"
      tags: [contact-messages]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required: [sender_name, sender_email, destination, subject, message]
              properties:
                lodging_id: { type: string, format: uuid, nullable: true }
                destination: { type: string, enum: [owner, concierge] }
                sender_name: { type: string, minLength: 2, maxLength: 120 }
                sender_email: { type: string, format: email }
                sender_phone: { type: string, maxLength: 40, nullable: true }
                subject: { type: string, minLength: 2, maxLength: 160 }
                message: { type: string, minLength: 10, maxLength: 2000 }
      responses:
        "201":
          description: Message reçu
          content:
            application/json:
              schema:
                type: object
                required: [id, status]
                properties:
                  id: { type: string }
                  status: { type: string, enum: [received] }
        "400":
          $ref: "#/components/responses/ValidationError"

  /api/admin/contact-messages/{id}:
    delete:
      summary: "Archiver un message de contact"
      tags: [contact-messages]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema: { type: string, format: uuid }
      responses:
        "200":
          description: Message archivé
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"

  /api/admin/contact-messages/{id}/reply:
    post:
      summary: "Répondre à un message de contact"
      tags: [contact-messages]
      security:
        - bearerAuth: []
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
              required: [reply_body]
              properties:
                reply_body: { type: string, minLength: 1, maxLength: 2000 }
      responses:
        "200":
          description: Réponse sauvegardée
          content:
            application/json:
              schema:
                type: object
                required: [message, email_sent]
                properties:
                  message: { type: string }
                  email_sent: { type: boolean }
        "401":
          $ref: "#/components/responses/Unauthorized"
        "403":
          $ref: "#/components/responses/Forbidden"
        "404":
          $ref: "#/components/responses/NotFound"
```

Les erreurs suivent la structure globale :

```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

---

## UI Behaviour

### Page publique `/contact`

- En mode séjour, la page affiche le nom du Lodging et de la City.
- Le formulaire est mobile-first, en carte blanche sobre, avec champs :
  - Nom
  - Email
  - Téléphone optionnel
  - Destination : `Propriétaire` ou `Conciergerie`
  - Sujet
  - Message
- Après succès, un état de confirmation indique que la demande a été transmise.
- Le bloc urgences existant reste affiché sous le formulaire s'il existe.

### Dashboard Super-admin `/admin`

- Une section "Messages voyageurs" est ajoutée au dashboard global.
- La liste affiche : nom du logement, destination, date, sujet, statut et actions.
- L'action oeil ouvre un modal avec détail complet, coordonnées du Tourist, message et formulaire de réponse.
- L'action corbeille archive le message et le déplace vers l'onglet Archivés.
- Les actions utilisent des icônes Lucide React (`Eye`, `Trash2`, `Send`).

---

## Acceptance Criteria Summary

| Criterion | Description | Test Type |
|---|---|---|
| AC-01-01 | Formulaire contact séjour complet | integration |
| AC-01-02 | Message propriétaire créé avec Lodging + Owner | contract |
| AC-01-03 | Message conciergerie créé avec Lodging si connu | contract |
| AC-01-04 | Formulaire invalide rejeté Zod | contract |
| AC-02-01 | Dashboard Super-admin affiche messages | integration |
| AC-02-02 | Icône oeil ouvre modal détail | unit |
| AC-02-03 | Icône corbeille archive message | contract + unit |
| AC-03-01 | Réponse sauvegardée en base | contract |
| AC-03-02 | Email envoyé si Resend configuré | contract |
| AC-03-03 | Réponse sauvegardée sans email si Resend absent | contract |

---

## Out of Scope

- Inbox Owner dédiée dans `/dashboard`.
- Chat temps réel ou notifications push.
- Pièces jointes.
- SLA ou assignation interne par opérateur.
- Suppression physique des messages.

---

## Open Questions

Aucune question ouverte. Décision Product Owner du 2026-06-04 : les messages restent dans le dashboard Super-admin global, qu'ils soient destinés au Propriétaire ou à la Conciergerie, afin que le Super-admin conserve toujours une copie.
