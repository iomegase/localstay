# Spec — 098 Enrichissement des descriptions courtes des POI

## Metadata

```yaml
id: 098-poi-description-enrichment
title: "Enrichir en lot, avec relecture, les descriptions courtes des POI publiés"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-10-15
updated_at: 2026-10-17
depends_on:
  - 049-poi-description-assistance
  - 093-longer-descriptions
  - 094-description-sources
bounded_context: discovery-content
implementation_gate: "Validée par le PO le 2026-10-15 (« plus longue sans bullshit », puis « A » : site officiel + recherche web). OQ-01 et OQ-02 retenues telles que proposées."
```

---

## Context

Sur 78 POI publiés, 51 ont une description de moins de 60 mots et seuls 6 affichent
leurs sources (mesure du 2026-10-15). La spec 093 a allongé les textes générés, mais
n'a pas touché aux descriptions existantes (BR-03, régénération en masse hors périmètre).
Le PO veut des fiches plus riches, **sans remplissage ni formules creuses**.

## Glossary References

POI, Description, Sources (spec 094), Assistant de description (spec 049).

## User Stories

### US-01 — Enrichir les fiches courtes sans les ouvrir une par une

**As an** admin
**I want to** voir la liste des POI publiés à description courte et générer des propositions en lot
**So that** je relise et publie des descriptions riches en quelques minutes

#### Acceptance Criteria

- **AC-01-01**: Given `/admin/pois/enrichissement`, When la page s'affiche, Then elle liste les
  POI publiés, non supprimés, dont la description fait moins de 120 mots (nom, commune,
  catégorie, nombre de mots actuel), du plus court au plus long.
- **AC-01-02**: Given la liste, When l'admin clique « Générer les propositions » (10 POI au
  plus par clic) ou « Générer » sur une ligne, Then chaque POI passe par le générateur
  existant (spec 049/093/094), **un à la fois** ; l'état de chaque ligne s'affiche
  (en cours, proposition prête, sources insuffisantes, échec).
- **AC-01-03**: Given une proposition prête, When l'admin l'ouvre, Then il voit côte à côte
  la description actuelle et la proposition (rendu Markdown, nombre de mots, sources
  cliquables, avertissements BR-03).
- **AC-01-04**: Given une proposition, When l'admin clique « Publier », Then la description
  et ses sources sont enregistrées comme avec « Utiliser cette proposition » (spec 094
  AC-01), la fiche publique est revalidée et la ligne sort de la liste ; « Ignorer » laisse
  la description actuelle inchangée.
- **AC-01-05**: Given « sources insuffisantes », When la ligne s'affiche, Then aucune
  proposition n'est montrée et la description actuelle reste en place (pas de texte de
  repli).

### US-02 — Des descriptions sans remplissage

- **AC-02-01**: Given n'importe quel générateur de description (assistance, enrichissement,
  acquisition POI, randonnées), When Gemini rédige, Then la consigne commune (BR-01, BR-02)
  s'applique.
- **AC-02-02**: Given une proposition contenant une formule de la liste BR-02, When elle est
  affichée en relecture, Then la formule est surlignée avec l'avertissement « Formule creuse » ;
  la publication reste possible (le PO tranche).

## Business Rules

- **BR-01 — Faits seulement** : chaque phrase apporte un fait vérifiable tiré des sources
  (ce qu'on y mange ou fait, spécialités, lieu et bâtiment, histoire, public, saison,
  accès). Pas de phrase d'ambiance sans fait, pas de question rhétorique, pas d'appel à
  l'action (« venez découvrir »), pas de répétition du nom ou de la commune pour allonger.
- **BR-02 — Formules interdites** (liste initiale, extensible) : « incontournable », « à ne
  pas manquer », « cadre idyllique », « havre de paix », « niché », « véritable institution »,
  « ravira petits et grands », « pour tous les goûts », « une expérience unique »,
  « ambiance chaleureuse et conviviale », « un lieu où l'on se sent bien », « laissez-vous
  tenter », « que vous soyez… ou… ».
- **BR-03 — Longueur sans plancher forcé** : 120 à 300 mots visés (spec 093), mais un texte
  plus court et entièrement factuel est préféré à un texte rallongé. Une proposition de
  moins de 80 mots porte l'indication « Sources maigres ».
- **BR-04 — Pas de publication automatique** : rien n'est publié sans clic « Publier » de
  l'admin. Les propositions non publiées ne sont pas conservées (aucune table nouvelle).
- **BR-05 — Coût maîtrisé** : génération déclenchée uniquement par l'admin, 10 POI au plus
  par clic, appels séquentiels (pas de cron, pas de génération au chargement de la page).
- **BR-07 — Site officiel mince + recherche web** (option A du PO, 2026-10-15) : quand le
  texte lu sur le site officiel fait moins de 1 500 caractères (site vitrine, carte en
  images…), le générateur complète avec une recherche web (offices de tourisme, guides,
  presse locale) en plus de la page officielle ; les sources s'additionnent (site
  officiel en premier). Cas réel : Pizzeria delizio (≈ 460 caractères visibles).
- **BR-08 — Profil de réseau social** (PO 2026-10-17 : « il faut tout récupérer », Brasserie les
  Rhodos) : un « site » Instagram, Facebook, TikTok, X, Linktree, LinkedIn, Pinterest, YouTube ou
  Threads n'est pas un site officiel. Il n'est pas lu (la page ne livre qu'une coquille : « 868
  Followers, 118 Posts… », 5 200 caractères qui passaient le seuil de BR-07) : la description vient
  de la recherche web seule (`source_mode = web_search`), en création comme en acquisition, et
  aucune « photo du site officiel » n'en est tirée.
- **BR-08** : le texte ne cite ni horaires ou jours d'ouverture, ni prix, ni téléphone,
  ni e-mail (la fiche les affiche déjà ; ils changent souvent). Si la recherche web ne
  cite aucune page, le texte combiné est écarté et la description est régénérée depuis
  le seul site officiel (aucun fait sans source). Budget de sortie du modèle relevé
  (12 288 jetons) : sa réflexion coupait les réponses avec recherche (`MAX_TOKENS`).
- **BR-06** : règles existantes inchangées — aucun fait inventé, ni prix, horaires,
  disponibilités, GPS, distances, dénivelé (ADR-006).

## Data Model

Aucun changement de schéma. Lecture de `PointOfInterest.description` et
`description_sources` ; écriture via le contrat existant de mise à jour admin d'un POI.

## API Contract

Réutilise `POST` de l'assistance de description (spec 049) et la mise à jour admin du POI
(spec 094 AC-01). Ajout d'une lecture admin :

```yaml
GET /api/admin/pois/enrichment:
  auth: admin
  200:
    items: [{ id, name, city_name, category_name, word_count, public_path }]
  401/403: { error: { code, message, details } }
```

## UI Behaviour

- Page admin dans la section POI, lien « Enrichir les descriptions (n) » depuis `/admin/pois`.
- Tableau : POI, commune, catégorie, mots actuels, état, actions.
- Panneau de relecture : actuelle / proposée, mots, sources, avertissements, « Publier » /
  « Ignorer ».
- Mobile admin non prioritaire (usage desktop).

## Acceptance Criteria

| Criterion | Test type |
|---|---|
| AC-01-01 | integration |
| AC-01-02 | integration |
| AC-01-03 | integration |
| AC-01-04 | contract + integration |
| AC-01-05 | integration |
| AC-02-01 | unit |
| AC-02-02 | unit |
| BR-07 | unit |
| BR-08 | unit |

## Out of Scope

- Régénération automatique ou planifiée ; publication sans relecture.
- Rubriques éditoriales supplémentaires (« Ce qu'on aime », « Le conseil MyStay ») :
  à spécifier séparément si souhaité.
- Descriptions des logements et des randonnées existantes (le lot ne vise que les POI).

## Open Questions

- **OQ-01** (resolved 2026-10-15) : liste BR-02 retenue telle que proposée (extensible).
- **OQ-02** (resolved 2026-10-15) : seuil « description courte » à 120 mots retenu.
