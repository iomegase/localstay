# Spec — 073 Acquisition POI guidée par les types Google

## Metadata

```yaml
id: 073-acquisition-google-types
title: "Filtrer l'acquisition par types Google configurés dans la taxonomie et trier la revue par correspondance"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-06
updated_at: 2026-10-06
depends_on:
  - 017-admin-taxonomy
  - 018-poi-acquisition-pipeline
  - 072-acquisition-run-reliability
bounded_context: poi-acquisition
implementation_gate: "PO 2026-10-06 : « lance spec 073 » puis option A confirmée explicitement (lieux au type principal différent conservés, repliés en bas de revue avec un badge)."
```

---

## Context

Mesure du 2026-10-06, « Cafés Saint-Gervais-les-Bains » : 20 résultats dont 1 seul de
type principal `cafe` (9 `french_restaurant`, 3 `bar`, 3 `restaurant`…). Notre
recherche n'envoie que du texte et ne lit pas le type des lieux. Avec
`includedType=cafe` + `strictTypeFiltering`, 6 résultats (5 restaurants se déclarant
aussi « café », 1 café).

---

## User Stories

### US-01 — Types Google dans la taxonomie

#### Acceptance Criteria

- **AC-01-01**: Given Admin › Taxonomie, When l'admin édite une catégorie ou une
  sous-catégorie, Then il peut saisir ses « Types Google » (liste séparée par des
  virgules ; `*_restaurant` accepte toutes les variantes d'un suffixe).
- **AC-01-02**: Given la migration, When elle est appliquée, Then les catégories et
  sous-catégories de référence reçoivent des types par défaut (BR-04).

### US-02 — Recherche filtrée par type

#### Acceptance Criteria

- **AC-02-01**: Given une catégorie avec des types, When un lancement s'exécute, Then une
  requête Google est faite par type exact distinct (catégorie + sous-catégories) avec
  `includedType` et `strictTypeFiltering`, au lieu des requêtes texte seules.
- **AC-02-02**: Given un type appartenant à une seule sous-catégorie, When un lieu est
  trouvé par cette requête, Then il est proposé dans cette sous-catégorie.
- **AC-02-03**: Given une catégorie sans type (ou un type refusé par Google), When le
  lancement s'exécute, Then la recherche texte actuelle s'applique (repli).

### US-03 — Revue triée par correspondance

#### Acceptance Criteria

- **AC-03-01**: Given un candidat, When il est créé, Then son type principal Google
  (`primary_type`) et sa correspondance (`type_match` : `primary` si le type principal
  est accepté, `secondary` si seul un type secondaire l'est, `unknown` sans type) sont
  enregistrés.
- **AC-03-02**: Given la revue d'un run, When elle s'affiche, Then les candidats
  `primary` / `unknown` apparaissent d'abord ; les `secondary` sont regroupés à la fin
  dans une section repliée « Autres types (N) ».
- **AC-03-03**: Given un candidat, When il s'affiche, Then un badge indique son type
  principal en français (ex. « Restaurant », « Café », « Bar »).

---

## Business Rules

- **BR-01**: Option A (PO) : un lieu au type principal non accepté n'est jamais écarté
  automatiquement ; il est seulement relégué.
- **BR-02**: Un type n'est envoyé à Google (`includedType`) que s'il est exact (sans
  `*`) ; les motifs `*_suffixe` servent uniquement à la correspondance.
- **BR-03**: Une requête refusée par Google (type inconnu) est refaite en texte seul,
  sans faire échouer le lancement.
- **BR-04**: Types par défaut (codés dans la taxonomie de référence et la migration) :
  Restaurant `restaurant, *_restaurant, bistro` · Cafés `cafe, coffee_shop, tea_house,
  bakery, pastry_shop, breakfast_restaurant, brunch_restaurant` · Bars `bar, wine_bar,
  pub, lounge_bar, cocktail_bar` · Soin `spa, massage, sauna` · Shopping `store,
  clothing_store, gift_shop, grocery_store, food_store, market, book_store,
  sporting_goods_store` · Culture `museum, art_gallery, historical_landmark, church,
  library` · Loisirs `tourist_attraction, amusement_center, bowling_alley, ski_resort,
  swimming_pool, movie_theater` · Mobilité `taxi_stand, parking, train_station,
  bus_station, car_rental` · Famille `playground, park, amusement_park, zoo,
  swimming_pool` · Urgences `pharmacy, doctor, hospital, veterinary_care` · Rando :
  aucun (pipeline dédié 019). Sous-catégories : Petit-déjeuner `breakfast_restaurant,
  brunch_restaurant, bakery` · Café `cafe, coffee_shop` · Salon de thé `tea_house,
  pastry_shop` · Location de ski `sporting_goods_store` · Souvenirs `gift_shop` ·
  Produits régionaux `grocery_store, food_store, market` · Pharmacie `pharmacy` ·
  Médecin `doctor` · Vétérinaire `veterinary_care`.

---

## Data Model

```prisma
model Category    { google_types String[] @default([]) }
model SubCategory { google_types String[] @default([]) }
model PoiAcquisitionCandidate {
  primary_type String?
  type_match   String?   // primary | secondary | unknown
}
```

Migration additive avec mise à jour des types par défaut (par slug).

---

## API Contract

- `PATCH /api/admin/taxonomy/categories/{id}` et `/subcategories/{id}` : champ optionnel
  `google_types: string[]` (chaque entrée `^[a-z*_]{2,60}$`, 20 max).
- `GET /api/admin/poi-acquisition/runs/{id}` : candidats avec `primary_type`, `type_match`.

---

## Acceptance Criteria Summary

| ID | Critère | Type de test |
|---|---|---|
| AC-01-01..02 | Types Google éditables, valeurs par défaut | unit + contract + integration |
| AC-02-01..03 | Requêtes par type, sous-catégorie, repli | unit |
| AC-03-01..03 | primary_type / type_match, revue triée, badge | unit + integration |

---

### Révision 2026-10-08 (incident run « Culture » Combloux)

- **BR-05**: Les résultats Google situés à plus de 30 km du centre de la ville sont écartés avant de
  devenir des candidats (`locationBias` n'est qu'une préférence : avec peu de lieux autour, Google
  complète avec Genève, Nyon, Paris). Un résultat sans position est conservé, le géocodage tranche.
- **BR-06**: Géocodage d'acquisition : au-delà de 30 km, statut `rejected` quelle que soit la confiance
  Mapbox (règle globale des zones, AGENTS §10) ; `pending_review` reste réservé aux adresses dans la
  zone mais incertaines.

## Out of Scope

- Écarter automatiquement les lieux `secondary` (option B).
- Traduction exhaustive de tous les types Google (repli : type brut).

---

## Open Questions

Aucune.
