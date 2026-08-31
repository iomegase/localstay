# Spec — 043 SEO / GEO Content Quality

## Metadata

```yaml
id: 043-seo-content-quality
title: "Audit de qualité éditoriale des contenus publics"
status: approved
mvp: 2
owner: "Product Owner"
created_at: 2026-08-28
updated_at: 2026-08-28
depends_on:
  - 028-lodging-showcase-seo
  - 029-blog-editorial
  - 031-public-marketing-site
  - 041-public-local-discovery
  - 042-seo-public-private-architecture
bounded_context: seo-editorial
implementation_gate: "Conception validée par le Product Owner le 2026-08-28"
```

## Context

La correction technique de la spec 042 ne suffit pas si les pages publiques
contiennent des placeholders, des descriptions génériques répétées, des textes
potentiellement trop proches d'une source externe ou des caractéristiques
logement contradictoires.

Cette feature organise un audit reproductible des contenus réellement publiés
sur `/decouvrir` et `/logements`. Elle produit un rapport de validation sans
supprimer massivement de données, sans réécrire automatiquement un contenu et
sans décider quelle valeur métier est correcte lorsqu'une contradiction existe.

Le seul correctif éditorial directement autorisé est la suppression des
placeholders manifestes présents dans le code public. Si aucun texte approuvé
n'existe, le bloc concerné est masqué.

## Glossary References

- **GEO**
- **Lodging**
- **Lodging Public Profile**
- **POI**
- **Source Content**
- **Tourist**

## User Stories

### US-01 — Identifier les contenus POI à retravailler

**As an** Admin

**I want to** disposer d'une liste argumentée des descriptions publiques fragiles

**So that** je puisse prioriser une rédaction originale MyStay

#### Acceptance Criteria

- **AC-01-01**: Given les POI publiés et éligibles de `/decouvrir`, When
  l'audit est exécuté, Then chaque POI est contrôlé pour placeholder, contenu
  vide, duplication exacte normalisée, forte similarité interne et provenance
  externe déclarée.
- **AC-01-02**: Given un POI signalé, When le rapport est produit, Then il
  contient son identifiant, son URL publique, son nom, sa City, sa catégorie,
  les raisons du signalement et la date de mise à jour.
- **AC-01-03**: Given deux contenus fortement similaires, When ils sont
  signalés, Then le rapport référence les deux POI et indique une mesure
  reproductible sans conclure à un plagiat.
- **AC-01-04**: Given une source externe connue dans les données d'acquisition,
  When le contenu doit être revu, Then la source est citée comme provenance à
  vérifier ; aucun scraping ou republication automatique n'est effectué.

### US-02 — Séparer les rôles éditoriaux d'une fiche POI

**As an** Admin

**I want to** préparer une structure éditoriale MyStay claire

**So that** les faits, le conseil local et la provenance ne soient pas mélangés

#### Acceptance Criteria

- **AC-02-01**: Given le rapport POI, When une fiche est signalée, Then une
  recommandation distingue `description factuelle`, `conseil MyStay`,
  `informations pratiques`, `source externe éventuelle` et `date de mise à
  jour`.
- **AC-02-02**: Given le schéma Prisma actuel, When cette structure nécessite
  de nouveaux champs, Then elle reste une proposition documentée et aucune
  migration n'est appliquée sans nouvelle validation de spec.
- **AC-02-03**: Given une description existante, When l'audit est terminé,
  Then elle n'est ni remplacée ni publiée automatiquement.

### US-03 — Détecter les contradictions logement

**As a** Product Owner

**I want to** connaître les caractéristiques logement incohérentes

**So that** les champs structurés restent la source de vérité avant correction éditoriale

#### Acceptance Criteria

- **AC-03-01**: Given un Lodging Public Profile publié, When il est audité,
  Then `surface_m2`, `bedroom_count`, `bed_count`, `bathroom_count`,
  `max_guests`, localisation et équipements sont comparés aux textes visibles
  et au JSON-LD généré.
- **AC-03-02**: Given une divergence possible, When le rapport est produit,
  Then il présente la valeur structurée, l'extrait textuel contradictoire et
  l'URL publique sans choisir automatiquement une valeur correcte.
- **AC-03-03**: Given le JSON-LD logement, When il est audité, Then aucun fait
  absent des champs structurés ou du contenu visible n'est accepté.
- **AC-03-04**: Given une contradiction, When l'audit se termine, Then aucune
  valeur Prisma n'est modifiée.

### US-04 — Retirer les placeholders indexables

**As a** visiteur public

**I want to** ne jamais voir de texte provisoire

**So that** les pages MyStay restent crédibles et utiles

#### Acceptance Criteria

- **AC-04-01**: Given les pages publiques indexables, When leur sortie rendue
  est inspectée, Then `Lorem ipsum`, `TODO`, `TBD`, `placeholder`,
  `description des principes` et leurs variantes manifestes ne sont pas rendus
  comme contenu éditorial. Les attributs de formulaire `placeholder` légitimes
  ne sont pas concernés.
- **AC-04-02**: Given la section « Notre vision » de `/concept`, When aucun
  descriptif approuvé n'existe pour un principe, Then le placeholder est retiré
  et le titre du principe reste rendu sans espace vide artificiel.
- **AC-04-03**: Given une section entièrement provisoire, When aucun contenu
  final n'existe, Then la section est masquée plutôt que remplacée par un texte
  inventé.

### US-05 — Obtenir un livrable exploitable sans fuite de données

**As a** Product Owner

**I want to** relire un rapport versionné et limité au contenu public

**So that** je puisse prendre les décisions éditoriales suivantes

#### Acceptance Criteria

- **AC-05-01**: Given l'audit terminé, When le livrable est écrit, Then il vit
  sous `docs/audits/`, contient un résumé, les méthodes, les résultats POI, les
  contradictions logement et les décisions requises.
- **AC-05-02**: Given le rapport, When il est inspecté, Then il ne contient
  aucun cookie, token, UUID de séjour, code d'accès, mot de passe ou donnée
  personnelle de voyageur.
- **AC-05-03**: Given une fiche sans problème détecté, When le rapport est
  produit, Then elle n'encombre pas la liste détaillée mais contribue au total
  audité.

## Business Rules

- **BR-01**: L'audit porte uniquement sur les POI `PUBLISHED` éligibles à
  `/decouvrir` et les Lodging Public Profiles `published`, actifs et non
  soft-deleted.
- **BR-02**: Une description vide, composée uniquement d'espaces ou plus courte
  que 80 caractères est signalée `CONTENT_TOO_THIN`; ce seuil sert au tri
  éditorial et ne dépublie jamais automatiquement une fiche.
- **BR-03**: La normalisation de détection convertit le texte en minuscules,
  normalise Unicode en NFKD, retire les diacritiques et la ponctuation, réduit
  les espaces et conserve les mots. Elle ne modifie jamais le contenu stocké.
- **BR-04**: Deux descriptions identiques après normalisation sont signalées
  `EXACT_INTERNAL_DUPLICATE`.
- **BR-05**: Pour deux descriptions normalisées d'au moins 120 caractères, une
  similarité Jaccard des trigrammes de mots supérieure ou égale à `0.85` est
  signalée `HIGH_INTERNAL_SIMILARITY`. Le rapport précise qu'il s'agit d'un
  indicateur, pas d'une preuve de copie.
- **BR-06**: Les marqueurs manifestes `lorem ipsum`, `TODO`, `TBD`,
  `placeholder`, `description des principes` et texte composé uniquement de
  points de suspension sont signalés `PLACEHOLDER_CONTENT` lorsqu'ils sont
  rendus comme texte éditorial. Les attributs de saisie, commentaires de code,
  noms de tests et libellés techniques ne sont pas des constats.
- **BR-07**: Une source externe enregistrée, un texte d'acquisition brut ou
  une attribution ne suffit pas à conclure que le contenu public est copié. Le
  rapport utilise `EXTERNAL_SOURCE_REVIEW_REQUIRED` et demande une revue
  humaine.
- **BR-08**: Aucun contenu tiers n'est récupéré, copié ou republié
  automatiquement par cette feature.
- **BR-09**: L'audit ne modifie ni `description`, ni statut de publication, ni
  champ de provenance, ni date métier.
- **BR-10**: La structure éditoriale cible sépare les faits, le conseil MyStay,
  les informations pratiques, la source éventuelle et la mise à jour. Elle ne
  devient pas un schéma Prisma sans nouvelle décision Product Owner.
- **BR-11**: Les champs structurés Prisma sont la source de vérité des
  caractéristiques logement. Le texte et le JSON-LD ne peuvent pas les
  remplacer.
- **BR-12**: Une divergence est rapportée ; elle n'est jamais corrigée
  arbitrairement. La résolution doit identifier la valeur validée et le champ
  à corriger.
- **BR-13**: Les comparaisons textuelles logement recherchent les mentions de
  surface, chambres, lits/couchages, salles de bain, capacité, localisation et
  équipements, puis fournissent les extraits au Product Owner.
- **BR-14**: Une absence de mention textuelle n'est pas une contradiction. Seule
  une valeur différente ou un fait JSON-LD non justifié est signalé.
- **BR-15**: Un placeholder public est supprimé sans texte de remplacement
  inventé. Si le bloc n'a plus de contenu utile, il est masqué.
- **BR-16**: Le rapport est versionné, daté et reproductible. Il distingue les
  constats automatiques des validations humaines encore requises.
- **BR-17**: Le rapport exclut toute donnée privée de séjour et toute donnée
  personnelle de Tourist, Owner ou Merchant non déjà affichée publiquement.
- **BR-18**: Cette feature ne refait aucun design et ne modifie aucun contenu
  métier sauf retrait d'un placeholder manifeste dans le code public.

## Data Model

Aucune migration Prisma n'est autorisée par cette feature.

La structure suivante est un contrat de rapport, pas un modèle de base :

```ts
type SeoContentAuditFinding = {
  publicUrl: string
  entityType: 'poi' | 'lodging' | 'public-page'
  entityId: string | null
  code:
    | 'CONTENT_TOO_THIN'
    | 'EXACT_INTERNAL_DUPLICATE'
    | 'HIGH_INTERNAL_SIMILARITY'
    | 'PLACEHOLDER_CONTENT'
    | 'EXTERNAL_SOURCE_REVIEW_REQUIRED'
    | 'LODGING_STRUCTURED_TEXT_CONFLICT'
    | 'JSON_LD_VISIBLE_CONTENT_CONFLICT'
  evidence: string[]
  updatedAt: string | null
  requiresOwnerDecision: boolean
}
```

## API Contract

Aucune API publique ou privée n'est créée ou modifiée.

L'audit est une opération interne en lecture seule. S'il est automatisé par un
script, le script utilise Prisma sans mutation et écrit uniquement le rapport
versionné sous `docs/audits/`.

## UI Behaviour

### `/concept`

- La composition et le design existants sont conservés.
- Le texte `description des principes` n'est plus rendu.
- Les titres des principes validés restent visibles.
- Aucun texte marketing de remplacement n'est généré automatiquement.

### Pages `/decouvrir` et `/logements`

- Aucun changement visuel automatique n'est appliqué depuis les constats du
  rapport.
- Les pages restent en ligne selon leurs règles de publication actuelles.
- Toute correction éditoriale ultérieure passe par les workflows Admin/Owner
  et les validations des specs concernées.

### Rapport

- Le résumé indique le nombre d'entités auditées et de constats par code.
- Chaque tableau détaillé contient l'URL publique et des preuves courtes.
- Les décisions métier sont regroupées dans une section distincte.
- Les extraits restent minimaux et ne reproduisent pas intégralement une source
  tierce.

## Acceptance Criteria Summary

| ID | Description | Test type |
|---|---|---|
| AC-01-01 | Tous les POI publics sont audités par règle | unit + integration |
| AC-01-02 | Chaque constat POI est traçable | unit |
| AC-01-03 | Similarité reproductible sans accusation | unit |
| AC-01-04 | Provenance externe signalée sans scraping | unit + manual review |
| AC-02-01 | Structure éditoriale cible documentée | documentation review |
| AC-02-02 | Aucun nouveau champ sans nouvelle spec | schema regression |
| AC-02-03 | Aucune réécriture/publication automatique | integration regression |
| AC-03-01 | Champs logements comparés au texte et JSON-LD | unit + integration |
| AC-03-02 | Contradictions documentées sans arbitrage | unit |
| AC-03-03 | JSON-LD justifié par données et contenu visible | unit |
| AC-03-04 | Audit sans mutation Prisma | integration |
| AC-04-01 | Scan des placeholders publics | unit |
| AC-04-02 | Placeholder `/concept` retiré proprement | integration |
| AC-04-03 | Section provisoire masquée sans invention | integration |
| AC-05-01 | Rapport complet sous `docs/audits/` | documentation review |
| AC-05-02 | Rapport sans donnée privée | security regression |
| AC-05-03 | Rapport détaillé limité aux constats | unit |

## Out of Scope

- Réécriture automatique ou massive des descriptions.
- Dépublication automatique selon un score de contenu.
- Scraping de sites tiers ou comparaison web exhaustive.
- Ajout de champs Prisma pour la structure éditoriale cible.
- Correction arbitraire d'une capacité, surface, chambre, couchage, salle de
  bain, localisation ou équipement.
- Modification des workflows de publication Admin/Owner.
- Refonte visuelle de `/concept`, `/decouvrir` ou `/logements`.
- Audit des guides privés ou de données de séjour.

## Open Questions

Aucune question ouverte. Toute contradiction logement et toute proposition de
nouveau champ éditorial découverte pendant l'audit devient une décision métier
distincte avant modification.
