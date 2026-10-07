# Spec — 089 Calendrier des disponibilités (fiche publique du logement)

## Metadata

```yaml
id: 089-lodging-availability-calendar
title: "Calendrier des disponibilités alimenté par le lien iCal de la plateforme de réservation"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-07
updated_at: 2026-10-07
depends_on:
  - 028-lodging-showcase-seo
  - 079-owner-lodging-page-redesign
bounded_context: lodging-showcase
implementation_gate: "PO 2026-10-07 : « ok pour le calendrier » ; un seul lien iCal par logement ; afficher toutes les dates disponibles, soit 12 mois."
```

## Context

Les voyageurs ne savent pas, depuis la fiche MyStay, si le logement est libre à leurs dates : ils
doivent ouvrir l'annonce Airbnb/Booking. Ces plateformes exportent un calendrier iCal (nuits réservées
ou bloquées), que MyStay peut lire sans saisie manuelle. La réservation reste sur la plateforme.

## Glossary Refs

Owner, Logement, Fiche publique (vitrine), Lien de réservation.

## User Stories

### US-01 — Owner : brancher le calendrier

- **AC-01-01**: Given la page « Logement » de l'Owner, section Réservation, When il colle le lien iCal
  de sa plateforme (« https:// » facultatif) puis enregistre, Then le lien est conservé
  (`availability_ical_url`) ; un lien vide le retire.
- **AC-01-02**: Given un lien invalide (pas une URL publique en https, adresse IP, `localhost`), When
  il enregistre, Then une erreur en rouge s'affiche sous le champ (083) et rien n'est enregistré.

### US-02 — Voyageur : voir les disponibilités

- **AC-02-01**: Given un logement publié avec un lien iCal lisible, When sa fiche s'affiche, Then une
  section « Disponibilités » montre un calendrier mensuel à partir du mois courant, sur 12 mois,
  navigable mois par mois (1 mois sur mobile, 2 côte à côte dès `md`).
- **AC-02-02**: Les nuits couvertes par un événement iCal (DTSTART inclus, DTEND exclu) sont
  affichées indisponibles (grisées, barrées) ; les jours passés sont grisés ; une légende
  « Disponible / Indisponible » accompagne le calendrier, ainsi que « Réservation sur la plateforme ».
- **AC-02-03**: Given un logement sans lien iCal, ou un calendrier illisible / injoignable, When la
  fiche s'affiche, Then la section n'apparaît pas (aucune erreur visible, la page reste rendue).

## Business Rules

- **BR-01**: Un seul lien iCal par logement (PO 2026-10-07).
- **BR-02**: Horizon 12 mois à partir du mois courant ; les événements hors horizon sont ignorés.
- **BR-03**: Le calendrier est lu côté serveur et mis en cache 1 h (fraîcheur ≤ 1 h, pas de cron).
- **BR-04**: Sécurité de la lecture : https uniquement, hôte résolu vers une adresse publique
  (adresses privées, locales et IP littérales refusées), 3 redirections maximum (revérifiées),
  délai 5 s, réponse ≤ 1 Mo.
- **BR-05**: Seules les dates sont exposées au navigateur et dans l'API publique — jamais le lien
  iCal (il contient un jeton privé de la plateforme), ni les résumés ou descriptions des événements.

## Data Model

```prisma
model LodgingPublicProfile {
  // …
  availability_ical_url String? // Spec 089 — lien iCal privé (jamais exposé publiquement)
}
```

Migration additive (colonne nullable).

## API Contract

- `PUT /api/owner/lodgings/{id}/public-profile` (existant) : champ optionnel
  `availability_ical_url: string | null` (normalisé en https, validé BR-04 hors résolution DNS) ;
  400 `VALIDATION_ERROR` avec `details.availability_ical_url` sinon. Le GET Owner renvoie le champ.
- Aucun changement de l'API publique : le lien n'y figure pas (BR-05).

## UI Behaviour

- Owner : champ « Calendrier des disponibilités (lien iCal) » sous le lien de réservation, aide
  « Airbnb : Calendrier › Disponibilités › Exporter le calendrier. Booking : Tarifs et disponibilités ›
  Synchroniser les calendriers. »
- Public : section « Bon à savoir / Disponibilités. » placée entre la carte et la FAQ ; boutons
  précédent / suivant (désactivés aux bornes) ; semaines du lundi au dimanche, en français.

## Acceptance Criteria

AC-01-01, AC-01-02, AC-02-01, AC-02-02, AC-02-03, BR-04, BR-05.

## Out of Scope

- Plusieurs liens iCal cumulés ; prix, séjour minimum ; réservation ou paiement sur MyStay ;
  export d'un calendrier MyStay vers les plateformes ; sélection de dates par le voyageur.

## Open Questions

Aucune.
