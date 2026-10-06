# Spec — 075 Admin Analytics : des données justes

## Metadata

```yaml
id: 075-admin-analytics-data-fix
title: "Fiabiliser /admin/analytics : sources réelles, trafic public seul, villages, totaux par période"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 030-admin-analytics-dashboard
  - 064-legacy-guide-gone
bounded_context: admin
implementation_gate: "PO 2026-10-06 : chantier « données vides ou fausses » ; option A pour Vercel (blocs retirés, lien vers Vercel)."
```

---

## Context

Diagnostic du 2026-10-06 (après réinitialisation de la base) :

1. La synchro Vercel (030) n'appelle aucune API : elle renvoie toujours 0 ligne avec un
   statut « réussi ». Vercel n'offre pas d'API publique de lecture Web Analytics /
   Speed Insights ; le bloc « Live » dépend d'un Drain (plan Pro). Ces blocs restent vides.
2. GA4 compte la navigation privée (`/admin/*`, `/auth/*`…) : le traceur reste actif lors
   d'une navigation client du site public vers l'admin.
3. Le rattachement aux villages ne reconnaît que `/guide/<ville>` (410 depuis 064) :
   aucune page actuelle n'est rattachée, la table « Villes » est vide.
4. Les tableaux Pages / Requêtes / Villes listent une ligne par jour au lieu d'un total
   sur la période (une page répétée N fois).

---

## User Stories

### US-01 — Sources réelles uniquement (option A)

- **AC-01-01**: Given /admin/analytics, When elle s'affiche, Then seules les sources GA4 et
  Search Console ont une carte d'état ; les blocs « Live Vercel » et « Core Web Vitals »
  sont retirés et remplacés par un encart « Trafic temps réel et performance : voir dans
  Vercel » avec un lien vers le tableau de bord Vercel.
- **AC-01-02**: Given une synchro « all » (cron ou admin), When elle s'exécute, Then elle
  ne traite que GA4 et Search Console ; une demande explicite d'une source Vercel est
  refusée (400).

### US-02 — GA4 : trafic public uniquement

- **AC-02-01**: Given un visiteur ayant accepté la mesure, When il navigue vers une page
  privée, Then aucun page_view GA4 n'est envoyé (désactivation du tag sur ces chemins).
- **AC-02-02**: Given la synchro GA4, When les rapports sont demandés, Then les chemins
  privés sont exclus (filtre de dimension `pagePath`) pour les totaux journaliers, les
  pages et le bloc « aujourd'hui ».
- **AC-02-03**: Given des lignes de pages privées déjà enregistrées, When la synchro GA4
  s'exécute, Then elles sont retirées (soft delete).

### US-03 — Rattachement aux villages

- **AC-03-01**: Given un chemin public, When il est analysé, Then il est rattaché à la
  ville pour : `/decouvrir/<ville>[/…]` (city_discovery), `/conciergerie/<ville>`
  (city_concierge), `/seminaires/<ville>` (city_seminars), `/locations-vacances/<ville>`
  (city_lodgings) ; les anciens chemins `/guide/<ville>…` restent reconnus.

### US-04 — Totaux par période

- **AC-04-01**: Given la période affichée, When les tableaux Pages, Requêtes et Villes
  s'affichent, Then chaque page / requête / ville apparaît une seule fois avec la somme de
  ses métriques sur la période (position moyenne pondérée par les impressions).

---

## Business Rules

- **BR-01**: Chemins privés : `/admin`, `/auth`, `/login`, `/dashboard`, `/merchant`,
  `/connexion`, `/acces-reserve`, `/cities`, `/api` (préfixes de segment).
- **BR-02**: Les composants de collection Vercel (`<Analytics />`, `<SpeedInsights />`)
  restent sur le site public : les données restent consultables dans Vercel.
- **BR-03**: Aucune suppression physique : les lignes retirées le sont par `deleted_at`.
- **BR-04**: Le consentement analytics (030) reste inchangé.

---

## Data Model

Aucun changement de schéma (`page_type` est une chaîne libre ; l'enum
`AnalyticsSourceKind` est conservé pour l'historique).

---

## API Contract

- `POST /api/internal/analytics/sync` : `source` ∈ `ga4 | gsc | all` ; une source Vercel → 400
  `VALIDATION_ERROR`.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..02 | Sources GA4/GSC seules, encart Vercel, refus des sources Vercel | unit + contract + integration |
| AC-02-01..03 | Tag désactivé sur chemins privés, filtre des rapports, retrait | unit + integration |
| AC-03-01 | Rattachement des chemins actuels | unit |
| AC-04-01 | Agrégation par période | unit |

---

## Out of Scope

- Suppression des routes et tables Drain / Live Vercel (code mort conservé, non affiché).
- Graphiques d'évolution, choix de période, nouvelles métriques.

---

## Open Questions

Aucune.
