# ADR-005 — Stripe Connect pour les commissions

## Statut

`accepted`

---

## Contexte

Le modèle économique prévoit des commissions sur les réservations et des abonnements pour les commerçants et hébergeurs. La plateforme doit pouvoir encaisser pour le compte de tiers et reverser le solde après commission.

---

## Décision

**Stripe + Stripe Connect** est retenu pour la gestion des paiements. Stripe Connect permet à la plateforme d'orchestrer les paiements entre Tourists, Merchants et la plateforme elle-même.

---

## Justification

Stripe Connect est la solution standard pour les marketplaces. Il gère les application fees, les virements, les remboursements, les litiges et la conformité KYC des marchands. L'alternative (développer une gestion de paiement custom) est trop risquée juridiquement et techniquement.

---

## Conséquences

- Les Merchants doivent créer un compte Stripe Connect (onboarding)
- Les paiements utilisent le pattern "authorize → capture" pour les garanties de réservation
- La table `payments` trace tous les Stripe payment intents
- Les remboursements sont déclenchés automatiquement via l'API Stripe en cas de refus restaurateur

---

## Date

2026-05-20

## Auteur

Product Owner
