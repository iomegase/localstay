# Spec — 064 Récupération des anciennes URL /guide encore indexées

## Metadata

```yaml
id: 064-legacy-guide-url-recovery
title: "Rediriger vers /decouvrir les anciennes URL /guide indexées dont le lieu a changé de catégorie ou disparu"
status: review
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 041-public-local-discovery
  - 042-seo-public-private-architecture
bounded_context: seo
amends:
  - "042 BR-10 et AC-04-03 (404 systématique sans équivalent exact)"
implementation_gate: "Ne pas coder avant status: approved et réponse PO aux Open Questions OQ-01 à OQ-03."
```

---

## Context

Inspection Search Console du 2026-10-06 (API URL Inspection sur les 98 URL connues :
sitemap + toutes les pages ayant eu au moins une impression en 16 mois) :

- 31 pages indexées, dont **23 anciennes URL `/guide/*`** explorées avant le noindex
  du 2026-08-29 (commit `b456f7c6`).
- Les anciennes fiches catégorie / POI sont déjà prises en charge par la spec 042
  (AC-04-01, AC-04-02) : redirection 308 vers `/decouvrir` **si le même couple
  catégorie + slug existe** et est éligible, 404 sinon (BR-10).

Problème : les pages `/guide` qui ramènent le plus d'impressions répondent 404
aujourd'hui, parce que le lieu a changé de catégorie ou que la catégorie n'existe plus.
Elles sortiront de l'index sans transmettre leur historique à `/decouvrir`.

| Ancienne URL (indexée) | Impr. 16 mois | Réponse actuelle | Cause constatée en base |
|---|---|---|---|
| `/guide/saint-gervais-les-bains/location-de-ski` | 62 | 404 | catégorie `location-de-ski` supprimée |
| `/guide/saint-gervais-les-bains/location-de-ski/blanc-sport` | 41 | 404 | POI existant, éligible, déplacé en `shopping` |
| `/guide/saint-gervais-les-bains/location-de-ski/claude-penz-sports` | 33 | 404 | POI absent de la base |
| `/guide/saint-gervais-les-bains/location-de-ski/sport-2000-loca-ski-…` | 7 | 404 | POI absent de la base |
| `/guide/saint-nicolas-de-veroce/culture/eglise-saint-nicolas-de-veroce` | 2 | 404 | POI existant, même catégorie, **non éligible** (photo manquante) |
| `/guide/chamonix-mont-blanc/boulangerie/aux-petits-gourmands` | 1 | 404 | slug présent uniquement à Saint-Gervais (`cafes`) |

Pour comparaison, `/guide/saint-gervais-les-bains/diner/avanti-1` redirige déjà
correctement en 308 vers sa fiche `/decouvrir`.

Les pages `agenda` et `mes-favoris` encore indexées ne relèvent pas de cette spec :
elles portent déjà `noindex` et sortiront de l'index au prochain passage de Google.

---

## Glossary References

- **POI** — Point of Interest (`PointOfInterest`).
- **POI éligible** — POI publiable sur `/decouvrir` selon la spec 041
  (`getPoiDiscoveryEligibility`).
- **Ancienne URL SEO** — URL `/guide/{ville}`, `/guide/{ville}/{categorie}` ou
  `/guide/{ville}/{categorie}/{poi}` demandée sans séjour actif (spec 042).
- **Catégorie retirée** — slug de catégorie présent dans d'anciennes URL mais absent
  de la table `Category`.

---

## User Stories

### US-01 — Retrouver un lieu qui a changé de catégorie

**As a** visiteur arrivant depuis Google sur une ancienne URL `/guide`

**I want to** atterrir sur la fiche actuelle du lieu

**So that** le lien reste utile et Google transfère l'historique à la nouvelle URL

#### Acceptance Criteria

- **AC-01-01**: Given une ancienne URL `/guide/{ville}/{categorie}/{poi}` demandée
  sans séjour actif, When aucun POI éligible n'existe pour ce triplet mais qu'un POI
  éligible de la même ville porte ce slug dans une autre catégorie, Then la réponse
  est une 308 vers `/decouvrir/{ville}/{categorieActuelle}/{poi}`.
  Exemple : `…/location-de-ski/blanc-sport` → `/decouvrir/saint-gervais-les-bains/shopping/blanc-sport`.
- **AC-01-02**: Given le même cas avec un séjour actif, When l'URL est demandée,
  Then le comportement privé existant (spec 042 AC-03-03) est inchangé.
- **AC-01-03**: Given un slug présent uniquement dans **une autre ville**, When
  l'ancienne URL est demandée, Then aucune redirection inter-villes n'est faite
  (réponse selon US-03).

### US-02 — Rediriger une catégorie retirée

**As a** visiteur arrivant sur une ancienne liste de catégorie

**I want to** atterrir sur la liste publique qui la remplace

**So that** je trouve les mêmes adresses

#### Acceptance Criteria

- **AC-02-01**: Given une ancienne URL `/guide/{ville}/{categorieRetiree}` dont la
  catégorie figure dans la table de correspondance (BR-03), When elle est demandée
  sans séjour actif, Then la réponse est une 308 vers
  `/decouvrir/{ville}/{categorieRemplacante}`, si cette page publique existe.
- **AC-02-02**: Given une catégorie retirée absente de la table de correspondance,
  When l'URL est demandée, Then la réponse reste 404 (spec 042 AC-04-03).

### US-03 — Signaler clairement un lieu disparu

**As a** moteur de recherche

**I want to** recevoir une réponse explicite pour un lieu qui n'existe plus

**So that** je retire l'URL de l'index rapidement

#### Acceptance Criteria

- **AC-03-01**: Given une ancienne URL POI dont le slug n'existe dans aucune
  catégorie de la ville, When elle est demandée sans séjour actif, Then la réponse
  suit la décision OQ-02.
- **AC-03-02**: Given un POI existant mais non éligible, When son ancienne URL est
  demandée, Then la réponse suit la décision OQ-03, sans révéler aucune donnée du POI.

---

## Business Rules

- **BR-01**: La recherche de repli (US-01) se fait par `ville + slug POI` et ignore la
  catégorie demandée. Elle n'aboutit que si **exactement un** POI éligible correspond ;
  sinon, pas de redirection.
- **BR-02**: Aucune redirection vers une autre ville que celle de l'URL demandée.
- **BR-03**: La correspondance des catégories retirées est une table statique versionnée
  dans le code (`src/features/seo/lib/legacy-category-map.ts`), validée par le PO.
  Contenu initial proposé (voir OQ-01) : `location-de-ski` → `shopping`.
- **BR-04**: Toutes les redirections sont des 308 (cohérent avec la spec 042) et ne
  conservent aucun paramètre de requête, hormis ceux déjà conservés par la spec 042.
- **BR-05**: L'entrée QR (`?lodging=`) et le séjour actif restent prioritaires sur ces
  redirections (spec 042, inchangé).
- **BR-06**: Aucune donnée privée ni aucun détail d'un POI non éligible n'apparaît dans
  la réponse.
- **BR-07**: Aucune modification du schéma de base de données.
- **Amendement de 042 BR-10** : « un contenu historique ne redirige en 308 que si son
  équivalent public est publié et éligible » reste vrai ; l'équivalent peut désormais
  être trouvé par slug dans la même ville (BR-01) ou par la table de correspondance
  (BR-03), et pas seulement par correspondance exacte de l'URL.

---

## Data Model

Aucun changement.

---

## API Contract

Pas de route API. Comportement HTTP des pages existantes, sans séjour actif :

| Requête | Condition | Réponse |
|---|---|---|
| `GET /guide/{ville}/{cat}/{poi}` | triplet exact éligible | 308 → `/decouvrir/{ville}/{cat}/{poi}` (inchangé) |
| `GET /guide/{ville}/{cat}/{poi}` | slug éligible unique dans une autre catégorie de la ville | 308 → `/decouvrir/{ville}/{catActuelle}/{poi}` |
| `GET /guide/{ville}/{cat}/{poi}` | slug inconnu dans la ville | selon OQ-02 |
| `GET /guide/{ville}/{cat}/{poi}` | POI existant non éligible | selon OQ-03 |
| `GET /guide/{ville}/{cat}` | catégorie publique existante | 308 → `/decouvrir/{ville}/{cat}` (inchangé) |
| `GET /guide/{ville}/{cat}` | catégorie retirée présente dans BR-03 | 308 → `/decouvrir/{ville}/{catRemplacante}` |
| `GET /guide/{ville}/{cat}` | autre cas | 404 (inchangé) |

---

## UI Behaviour

Aucune interface nouvelle. Les pages 404 / 410 éventuelles utilisent la page d'erreur
existante.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01 | POI déplacé de catégorie → 308 vers sa catégorie actuelle | unit + contract |
| AC-01-02 | Séjour actif : comportement privé inchangé | unit |
| AC-01-03 | Pas de redirection inter-villes | unit |
| AC-02-01 | Catégorie retirée mappée → 308 vers la catégorie remplaçante | unit + contract |
| AC-02-02 | Catégorie retirée non mappée → 404 | unit |
| AC-03-01 | Slug inconnu → réponse OQ-02 | unit |
| AC-03-02 | POI non éligible → réponse OQ-03, aucune donnée exposée | unit |

Vérification après déploiement : les 6 URL du tableau de contexte répondent comme
prévu (curl), puis demande de validation de la correction dans Search Console.

---

## Out of Scope

- Pages `/guide/*/agenda/*` et `mes-favoris` (déjà en noindex ; une réponse 410 pour
  les événements passés relèverait d'une modification de la spec 026).
- Recréation des POI disparus (`claude-penz-sports`, `sport-2000-…`) ou ajout de la
  photo manquante de l'église de Saint-Nicolas : travail de contenu dans l'admin, pas
  de code.
- Redirections inter-villes (ex. `aux-petits-gourmands` Chamonix → Saint-Gervais).
- Demandes de suppression dans Search Console (action manuelle du PO).
- Ajout de ces URL au sitemap (les anciennes URL n'y figurent jamais).

---

## Open Questions

- **OQ-01** — `pending` — Catégorie retirée `location-de-ski` (62 impressions) :
  rediriger vers `/decouvrir/saint-gervais-les-bains/shopping` (où se trouvent
  aujourd'hui les loueurs, ex. Blanc Sport) **ou** la laisser en 404 ?
  Recommandation : `shopping`.
- **OQ-02** — `pending` — POI disparu de la base (`claude-penz-sports`,
  `sport-2000-…`) : répondre **410 Gone** (sortie d'index la plus rapide, pas de
  contenu trompeur) **ou** 308 vers la liste de la catégorie (Google la traite
  souvent comme une soft 404) **ou** garder 404 ?
  Recommandation : 410.
- **OQ-03** — `pending` — POI existant mais non éligible (église de Saint-Nicolas,
  photo manquante) : garder **404** (042 BR-10, la fiche reviendra en 308 dès qu'elle
  sera éligible) **ou** 308 vers la liste de sa catégorie ?
  Recommandation : 404, et compléter la photo dans l'admin.
