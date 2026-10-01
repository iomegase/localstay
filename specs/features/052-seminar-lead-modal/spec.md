# Spec — 052 Seminar Lead Modal

## Metadata

```yaml
id: 052-seminar-lead-modal
title: "Formulaire de demande séminaire en modal sur les landings séminaires"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-01
updated_at: 2026-10-01
depends_on:
  - 024-contact-messages
  - 046-local-seo-city-cluster
  - 048-admin-local-landing-management
bounded_context: marketing-leads
implementation_gate: "Demande et décisions du Product Owner en conversation le 2026-10-01"
```

## Context

Les landings `/seminaires/[city-slug]` proposent aujourd'hui un bouton qui ouvre la
messagerie de l'utilisateur (`mailto:`). Ce parcours convertit mal : il dépend
d'un client e-mail configuré et ne structure pas la demande. Le Product Owner
demande un formulaire dans une modal au style MyStay, qui alimente la même
boîte de réception que le formulaire propriétaire (spec 024 : section Messages
de l'admin et notification e-mail à `bonjour@mystay.city`).

## Glossary References

- Landing séminaire : page locale `/seminaires/[city-slug]` (spec 046/048).
- ContactMessage : message public stocké et traité dans l'admin (spec 024).

## User Stories

### US-01 — Demander une proposition de séminaire sans quitter la page

**As a** décideur d'entreprise (visiteur anonyme)

**I want to** décrire mon projet de séminaire dans un formulaire court

**So that** MyStay me recontacte avec une proposition, sans dépendre de ma messagerie

#### Acceptance Criteria

- **AC-01-01**: Given une landing séminaire, When le visiteur active le bouton
  principal (hero ou bloc final), Then une modal accessible s'ouvre (rôle
  dialog, titre, fermeture par Échap, bouton fermer et clic sur le fond) sans
  changer d'URL ; le libellé du bouton reste celui saisi dans l'admin
  (`cta_label`).
- **AC-01-02**: Given la modal ouverte, When elle s'affiche, Then le formulaire
  demande : Prénom et nom*, Entreprise*, Adresse e-mail*, Téléphone, Nombre de
  participants* (Moins de 10 · 10 à 15 · 16 à 26 · Plus de 26), Dates
  souhaitées, Votre projet* (10 à 1800 caractères), un champ anti-spam caché et
  le consentement obligatoire « J'accepte que MyStay utilise ces informations
  uniquement pour répondre à ma demande. ».
- **AC-01-03**: Given un formulaire valide, When le visiteur l'envoie, Then
  `POST /api/public/contact-messages` reçoit `source: "seminar_lead"`,
  `destination: "concierge"`, `lodging_id: null`, l'objet
  `Demande séminaire — [Entreprise] — [Commune]` et un message reprenant
  entreprise, participants, dates et projet ; un ContactMessage est créé et une
  notification « Nouvelle demande séminaire MyStay » est envoyée à
  `bonjour@mystay.city` (échec d'envoi journalisé, sans bloquer la demande).
- **AC-01-04**: Given l'envoi réussi, When la réponse arrive, Then la modal
  affiche « Merci. Votre demande a bien été envoyée. Nous revenons vers vous
  sous 48 h. » et le formulaire est réinitialisé ; en cas d'échec, un message
  d'erreur invite à vérifier les champs et réessayer.
- **AC-01-05**: Given une demande `seminar_lead` avec un logement ou une
  destination `owner`, When l'API la reçoit, Then elle répond 400 au format
  d'erreur standard et ne crée aucun message.
- **AC-01-06**: Given une landing séminaire, When elle s'affiche, Then la FAQ
  s'intitule « Vos questions, nos réponses. » et le bloc final « Parlons de
  votre prochain séminaire. » (textes du code validés par le Product Owner le
  2026-10-01 ; les landings conciergerie gardent leurs titres). Le titre de la
  FAQ est placé au-dessus des questions, réparties sur 2 colonnes à partir de
  `md` (une colonne sur mobile), en deux piles indépendantes ; la home et les
  landings conciergerie gardent leur disposition. Dans le bloc final, le bouton
  principal est centré verticalement et seul le lien « Découvrir la région »
  est conservé (« Voir les logements » et « Tous les séminaires » retirés).

## Business Rules

- **BR-01**: Réutilise intégralement le circuit ContactMessage de la spec 024
  (stockage, section Messages de l'admin, réponse admin) ; aucune modification
  du modèle de données.
- **BR-02**: Le champ anti-spam rempli renvoie un succès silencieux sans rien
  stocker (comportement existant).
- **BR-03**: Le consentement est obligatoire ; aucune donnée n'est utilisée hors
  de la réponse à la demande.
- **BR-04**: Les landings conciergerie et locations de vacances ne changent
  pas ; seule l'intention séminaire utilise la modal.
- **BR-05**: Depuis le 2026-10-01 (spec 031 AC-01-09), la page générale
  `/seminaires` utilise aussi la modal pour ses boutons « Recevoir une
  proposition » ; sans commune, l'objet devient `Demande séminaire —
  [Entreprise] — Pays du Mont-Blanc` et le sous-titre « dans le Pays du
  Mont-Blanc ».

## Data Model

Aucun changement. `ContactMessage` (spec 024) avec `destination = concierge`.

## API Contract

`POST /api/public/contact-messages` (spec 024) accepte désormais
`source: "owner_lead" | "seminar_lead"` (optionnel). Pour `seminar_lead` :
`destination` doit valoir `concierge` et `lodging_id` être nul, sinon
`400 VALIDATION_ERROR`. Réponse inchangée : `201 { id, status: "received" }`.

## UI Behaviour

- Bouton principal inchangé visuellement (style primaire MyStay).
- Modal centrée, fond flouté, carte blanche arrondie, titre « Recevoir une
  proposition », sous-titre rappelant la commune, champs au style du
  formulaire propriétaire, bouton « Envoyer ma demande ».
- Mobile : la modal occupe la largeur disponible et défile verticalement.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | integration |
| AC-01-02 | integration |
| AC-01-03 | contract + integration |
| AC-01-04 | integration |
| AC-01-05 | contract |
| AC-01-06 | integration |

## Out of Scope

- Les landings conciergerie et locations de vacances.
- Tout nouveau champ en base, tableau de bord dédié ou CRM.

## Open Questions

Aucune.
