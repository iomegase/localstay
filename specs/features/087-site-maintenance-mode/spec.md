# Spec — 087 Mode maintenance du site public

## Metadata

```yaml
id: 087-site-maintenance-mode
title: "Bouton admin pour mettre le site public en maintenance"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 016-dashboard-superadmin
bounded_context: admin
implementation_gate: "PO 2026-10-06 : « créer un bouton dans le dashboard admin pour mettre le site en maintenance » ; périmètre : site public seul ; message modifiable avec message par défaut ; logo MyStay puis message, centrés au milieu de la page."
```

## User Stories

### US-01 — Interrupteur admin

- **AC-01-01**: Given le cockpit /admin, When il s'affiche, Then une carte « Mode maintenance »
  présente l'état (actif / inactif), un interrupteur, un champ message (message par défaut
  pré-rempli) et « Enregistrer ».
- **AC-01-02**: Given un enregistrement, When il réussit, Then l'état est appliqué au site public
  en 15 s maximum.

### US-02 — Site public en maintenance

- **AC-02-01**: Given le mode actif, When un visiteur ouvre une page du site public (accueil,
  /decouvrir, /logements, /conciergerie, /seminaires, /locations-vacances, /journal, pages
  légales…), Then il voit la page de maintenance avec le statut HTTP 503, `Retry-After` et
  `noindex`.
- **AC-02-02**: Given le mode actif, When on ouvre /connexion, /auth, /sejour (guide voyageur),
  /dashboard, /admin ou une API, Then ils fonctionnent normalement.
- **AC-02-03**: Given la page de maintenance, When elle s'affiche, Then le logo MyStay puis le
  message sont centrés au milieu de l'écran.

## Business Rules

- **BR-01**: Message par défaut : « Nous améliorons MyStay. Le site revient très vite, merci de
  votre patience. » (500 caractères maximum).
- **BR-02**: En cas d'erreur de lecture de l'état, le site reste ouvert.

## Data Model

```prisma
model SiteMaintenance {
  id         String    @id @default(uuid())
  created_at DateTime  @default(now())
  updated_at DateTime  @updatedAt
  deleted_at DateTime?
  enabled    Boolean   @default(false)
  message    String?
  updated_by String?
}
```

Migration additive (une seule ligne utilisée).

## API Contract

- `GET /api/admin/maintenance` → `{ data: { enabled, message } }` (admin).
- `PUT /api/admin/maintenance` `{ enabled: boolean, message: string | null }` (Zod, message ≤ 500)
  → `{ data: { enabled, message } }` ; 400 `VALIDATION_ERROR` ; 401/403 hors admin.

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..02 | Carte admin, enregistrement, cache 15 s | unit + contract + integration |
| AC-02-01..03 | Proxy 503 sur le site public, exceptions, page centrée | unit + integration |

## Out of Scope

- Aperçu du site par l'admin pendant la maintenance ; programmation horaire.

## Open Questions

Aucune.
