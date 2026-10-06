# Spec — 064 Nettoyage des anciennes URL /guide (410 Gone)

## Metadata

```yaml
id: 064-legacy-guide-url-recovery
title: "Répondre 410 Gone à toute ancienne URL /guide demandée sans séjour actif"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 042-seo-public-private-architecture
bounded_context: seo
amends:
  - "042 AC-02-03, AC-02-04, AC-03-05, AC-04-01, AC-04-02, AC-04-03, BR-07A, BR-10 (redirections 308 / 404 des anciennes URL /guide)"
implementation_gate: "PO 2026-10-06 : « je m'en fous des redirections […] je veux juste qu'on travaille sur le nouveau sitemap et enlever toutes les anciennes URL. Je veux un truc clean » puis « commence déjà par nettoyer toutes les anciennes URL avec une réponse 410 »."
```

---

## Context

Inspection Search Console du 2026-10-06 : 31 pages indexées, dont 23 anciennes URL
`/guide/*` (agenda, location de ski, mes-favoris…) explorées avant le noindex du
2026-08-29. La base des POI a été réinitialisée depuis : ces URL ne correspondent plus
à aucun contenu.

Décision PO : pas de redirection. Le sitemap actuel (`/decouvrir`, `/logements`,
`/journal`…) est la seule surface publique. Toute ancienne URL `/guide` demandée hors
séjour répond **410 Gone**, signal le plus net pour que Google la retire de l'index.

`/guide` reste la couche technique du guide privé (séjour actif, entrée QR
`?lodging=`), qui n'est pas modifiée.

---

## Glossary References

- **Séjour actif** — cookie `lodging_id` valide (spec 031 / 059).
- **Entrée QR** — URL portant `?lodging={uuid}` valide.
- **Ancienne URL /guide** — toute URL `/guide/{ville}[/…]`.

---

## User Stories

### US-01 — Retirer les anciennes URL de l'index

**As a** Product Owner

**I want to** que toute ancienne URL `/guide` réponde 410 hors séjour

**So that** Google les retire de l'index et que seul le nouveau sitemap subsiste

#### Acceptance Criteria

- **AC-01-01**: Given aucune entrée QR valide et aucun séjour actif, When une URL
  `/guide/{ville}` ou plus profonde est demandée (ville, catégorie, POI, `start`,
  agenda, événement, logements, mes-favoris, contact), Then la réponse est **410**,
  sans redirection ni réécriture.
- **AC-01-02**: Given la réponse 410, When elle est servie, Then elle porte
  `X-Robots-Tag: noindex`, `Cache-Control: private, no-store`, un corps HTML en
  français indiquant que la page n'existe plus, avec un lien vers l'accueil et une
  phrase invitant un voyageur à rescanner le QR code de son logement.
- **AC-01-03**: Given une entrée QR `?lodging={uuid}` valide, When une URL `/guide`
  est demandée, Then le comportement existant (cookie + redirection `/sejour` ou accès
  à la surface privée) est inchangé.
- **AC-01-04**: Given un séjour actif, When une URL `/guide` est demandée, Then le
  confinement existant (redirection `/sejour` ou accès autorisé) est inchangé.
- **AC-01-05**: Given un identifiant `?lodging=` invalide et aucun séjour actif, When
  une URL `/guide` est demandée, Then la réponse est 410.

### US-02 — Ne plus produire de lien interne vers une ancienne URL publique

**As a** Admin, Owner ou Merchant

**I want to** que les liens « voir la page publique » du back-office mènent à `/decouvrir`

**So that** ils ne tombent pas sur une 410

#### Acceptance Criteria

- **AC-02-01**: Admin › Villes, bouton « Voir le guide » → `/decouvrir/{ville}`.
- **AC-02-02**: Dashboard Owner › vitrine logement, bouton « Ouvrir le guide » →
  `/decouvrir/{ville}`.
- **AC-02-03**: Dashboard Merchant, URL publique du POI →
  `/decouvrir/{ville}/{categorie}/{poi}`.

---

## Business Rules

- **BR-01**: L'entrée QR valide puis le séjour actif sont évalués avant la règle 410.
- **BR-02**: Les QR « ville » historiques sans logement (`/guide/{ville}`) répondent
  aussi 410 (décision PO « toutes les anciennes URL » ; remplace 042 BR-07A).
- **BR-03**: Aucune ancienne URL `/guide` n'est ajoutée au sitemap ni redirigée.
- **BR-04**: La réponse 410 est produite par le proxy, sans requête base de données.
- **BR-05**: Les routes privées hors `/guide` (`/sejour`, `/mes-favoris`, `/map`…)
  gardent l'écran « Accès par lien » ; elles ne sont pas concernées.

---

## Data Model

Aucun changement.

---

## API Contract

| Requête (sans séjour actif ni QR valide) | Avant | Après |
|---|---|---|
| `GET /guide/{ville}` | 308 → `/decouvrir/{ville}` ou `/decouvrir` | 410 |
| `GET /guide/{ville}/{cat}[/{poi}]` | 308 → `/decouvrir/…` ou 404 | 410 |
| `GET /guide/{ville}/logements[/{slug}]` | 308 → `/logements[/…]` ou 404 | 410 |
| `GET /guide/{ville}/agenda[/…]`, `mes-favoris`, `contact`, `…/start` | 200 écran « Accès par lien » | 410 |

---

## UI Behaviour

Page 410 minimale servie par le proxy : titre « Cette page n'existe plus », lien
« Retour à l'accueil » vers `/`, mention « Vous séjournez dans un logement MyStay ?
Scannez à nouveau le QR code de votre logement. »

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01 | Toute URL /guide hors séjour → 410 | unit |
| AC-01-02 | En-têtes et corps de la 410 | unit |
| AC-01-03 | Entrée QR valide inchangée | unit |
| AC-01-04 | Séjour actif inchangé | unit |
| AC-01-05 | `?lodging=` invalide → 410 | unit |
| AC-02-01..03 | Liens back-office vers /decouvrir | unit |

---

## Out of Scope

- Redirections vers `/decouvrir` (abandonnées par décision PO).
- Lien « Démarrer » de l'aperçu de randonnée dans l'admin POI (déjà soumis à
  l'écran « Accès par lien » avant cette spec).
- Liens internes du guide privé vers `/guide/*` (servis en séjour actif, inchangés).
- Refonte de la page `/decouvrir` à partir de la taxonomie admin (spec suivante).
- Publication des POI sans photo (spec suivante).
- Demandes de suppression manuelles dans Search Console.

---

## Open Questions

Aucune.
