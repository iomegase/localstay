# Spec — 053 Help Contact Modal

## Metadata

```yaml
id: 053-help-contact-modal
title: "Formulaire « Aide & contact » en modal depuis le footer marketing"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-01
updated_at: 2026-10-15
depends_on:
  - 024-contact-messages
  - 031-public-marketing-site
  - 052-seminar-lead-modal
bounded_context: marketing-leads
implementation_gate: "Demande du Product Owner en conversation le 2026-10-01 (audit home, point 16)"
```

## Context

Le lien « Aide & contact » du footer mène aujourd'hui au formulaire
propriétaire (`/confier-mon-logement`), alors que la demande peut venir d'un
voyageur, d'une entreprise ou de toute autre personne. Le Product Owner demande
un formulaire au style MyStay, ouvert en modal, alimentant la même boîte de
réception que les formulaires propriétaire et séminaire (spec 024 : section
Messages de l'admin et notification à `bonjour@mystay.city`).

## Glossary References

- ContactMessage : message public stocké et traité dans l'admin (spec 024).

## User Stories

### US-01 — Poser une question à MyStay sans quitter la page

**As a** visiteur anonyme
**I want to** écrire à MyStay depuis le footer
**So that** j'obtienne une réponse sans dépendre de ma messagerie

#### Acceptance Criteria

- **AC-01-01**: Given une page marketing, When le visiteur active « Aide &
  contact » dans le footer, Then une modal accessible s'ouvre (rôle dialog,
  titre « Nous écrire », fermeture par Échap, bouton fermer et clic sur le
  fond) sans changer d'URL.
- **AC-01-02**: Given la modal ouverte, When elle s'affiche, Then le formulaire
  demande : Prénom et nom*, Adresse e-mail*, Téléphone, Vous êtes* (Voyageur ·
  Propriétaire · Entreprise · Autre), Votre message* (10 à 2000 caractères), un
  champ anti-spam caché et le consentement obligatoire « J'accepte que MyStay
  utilise ces informations uniquement pour répondre à ma demande. ».
- **AC-01-03**: Given un formulaire valide, When le visiteur l'envoie, Then
  `POST /api/public/contact-messages` reçoit `source: "help_contact"`,
  `destination: "concierge"`, `lodging_id: null`, l'objet
  `Aide & contact — [Vous êtes]` et le message saisi ; un ContactMessage est
  créé et une notification « Nouveau message Aide & contact MyStay » est
  envoyée à `bonjour@mystay.city` (échec d'envoi journalisé, sans bloquer la
  demande).
- **AC-01-04**: Given l'envoi réussi, When la réponse arrive, Then la modal
  affiche « Merci. Votre message a bien été envoyé. Nous vous répondons au plus
  vite. » et le formulaire est réinitialisé ; en cas d'échec, un message
  d'erreur invite à vérifier les champs et réessayer.
- **AC-01-05**: Given une demande `help_contact` avec un logement ou une
  destination `owner`, When l'API la reçoit, Then elle répond 400 au format
  d'erreur standard et ne crée aucun message.

## Business Rules

- **BR-01**: Réutilise intégralement le circuit ContactMessage de la spec 024 ;
  aucune modification du modèle de données.
- **BR-02**: Le champ anti-spam rempli renvoie un succès silencieux sans rien
  stocker (comportement existant).
- **BR-03**: Le consentement est obligatoire ; aucune donnée n'est utilisée hors
  de la réponse à la demande.

## Data Model

Aucun changement. `ContactMessage` (spec 024) avec `destination = concierge`.

## API Contract

`POST /api/public/contact-messages` (spec 024) accepte désormais
`source: "owner_lead" | "seminar_lead" | "help_contact"` (optionnel). Pour
`help_contact` : `destination` doit valoir `concierge` et `lodging_id` être nul,
sinon `400 VALIDATION_ERROR`. Réponse inchangée : `201 { id, status: "received" }`.

## UI Behaviour

- Déclencheur : « Aide & contact » du footer, rendu comme les autres liens du
  footer (bouton texte).
- Modal identique à la spec 052 : centrée, fond flouté, carte blanche arrondie,
  eyebrow « Aide & contact », titre « Nous écrire », bouton « Envoyer mon
  message ».
- Mobile : la modal occupe la largeur disponible et défile verticalement.

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | integration |
| AC-01-02 | integration |
| AC-01-03 | contract + integration |
| AC-01-04 | integration |
| AC-01-05 | contract |

## Out of Scope

- Une page `/contact` publique dédiée, un FAQ d'aide ou un chat.
- Tout nouveau champ en base, tableau de bord dédié ou CRM.

## Open Questions

Aucune.

## Amendement approuvé — Préambule par profil (PO 2026-10-15)

Validation explicite du Product Owner en conversation le 2026-10-15 (option A,
3 profils). Constat PO : « Nous contacter » de l'en-tête menait les voyageurs vers
la page propriétaires. Aucun changement d'API ni de modèle : chaque formulaire
réutilise sa source existante. Remplace AC-01-02 (le menu « Vous êtes » disparaît).

### US-02 — Être orienté vers le bon formulaire

**As a** visiteur anonyme
**I want to** dire d'abord qui je suis
**So that** je remplisse un formulaire adapté à ma demande

- **AC-02-01** : la modale contact (titre « Nous écrire ») s'ouvre sur un préambule
  « Vous êtes… » proposant trois choix : `Voyageur`, `Propriétaire`, `Entreprise`.
- **AC-02-02** : `Voyageur` affiche : Prénom et nom*, Adresse e-mail*, Téléphone,
  Logement concerné (liste des logements de la page quand elle est fournie, sinon
  texte libre ; facultatif), Dates souhaitées, Nombre de voyageurs, Votre message*
  (10 à 1650 caractères, pour rester sous la limite API de 2000 avec les lignes préfixées), anti-spam caché, consentement obligatoire. L'envoi
  utilise `source: "help_contact"`, `destination: "concierge"`, `lodging_id: null`,
  l'objet `Aide & contact — Voyageur` et un message préfixé des lignes renseignées
  (`Logement : …`, `Dates souhaitées : …`, `Voyageurs : …`).
- **AC-02-03** : `Propriétaire` affiche le formulaire existant `OwnerLeadForm`
  (`owner_lead`, spec 024 AC-05) ; `Entreprise` affiche le formulaire de demande
  séminaire existant (`seminar_lead`, spec 052), pour le Pays du Mont-Blanc.
- **AC-02-04** : chaque formulaire propose un retour « ← Changer de profil » vers le
  préambule ; fermer la modale réinitialise le préambule.
- **AC-02-05** : déclencheurs : « Aide & contact » du footer et « Nous contacter » de
  l'en-tête (desktop et menu mobile) ouvrent le préambule ; les CTA voyageurs des
  landings locations (spec 046 AC-03-09, AC-03-13) ouvrent directement le formulaire
  Voyageur, avec la liste des logements de la page. Les boutons « Nous contacter »
  du contenu de la home restent des liens vers `/confier-mon-logement`.
