# Audit qualité SEO / GEO des contenus publics

Généré le 2026-08-31T16:32:33.026Z.

## Résumé

- POI publics audités : **9**
- Logements publics audités : **4**
- Constats détaillés : **11**

- `EXTERNAL_SOURCE_REVIEW_REQUIRED` : **7**
- `LODGING_STRUCTURED_TEXT_CONFLICT` : **4**

Les fiches sans constat contribuent aux totaux audités mais ne sont pas détaillées.

## Méthode reproductible

- Contenu trop court : moins de **80 caractères**.
- Similarité interne : descriptions normalisées d’au moins **120 caractères**.
- Normalisation Unicode **NFKD**, suppression des diacritiques et de la ponctuation, casse et espaces uniformisés.
- Mesure : Jaccard des **trigrammes de mots**, seuil **0.85**.
- La similarité est un **indicateur de similarité** destiné à la revue humaine, jamais une conclusion de copie.
- Les champs structurés restent la source de vérité ; une absence de mention textuelle n’est pas une contradiction.
- Audit en lecture seule, sans scraping, réécriture, publication ou dépublication automatique.

## Résultats POI

| Code | URL publique | Identifiant public | Mise à jour | Preuves courtes |
|---|---|---|---|---|
| EXTERNAL_SOURCE_REVIEW_REQUIRED | /decouvrir/saint-gervais-les-bains/alimentation/boutique-traiteur-seracgourmet | 0885196f-d087-46d3-9c01-16499095425f | 2026-08-24T18:20:21.230Z | POI : Boutique Traiteur Séracgourmet<br>City : Saint-Gervais-les-Bains<br>Catégorie : Alimentation<br>Provenance déclarée à vérifier : google_places (run : google_places_primary).<br>Site source déclaré : www.3serac.fr.<br>Un texte source présent dans les données d’acquisition requiert une revue humaine. |
| EXTERNAL_SOURCE_REVIEW_REQUIRED | /decouvrir/saint-gervais-les-bains/alimentation/maison-des-alpes | e55abd98-1a71-4a1c-abe3-0571eb7f4646 | 2026-08-24T18:18:40.773Z | POI : Maison des Alpes<br>City : Saint-Gervais-les-Bains<br>Catégorie : Alimentation<br>Provenance déclarée à vérifier : google_places (run : google_places_primary).<br>Site source déclaré : maisondesalpes.com.<br>Un texte source présent dans les données d’acquisition requiert une revue humaine. |
| EXTERNAL_SOURCE_REVIEW_REQUIRED | /decouvrir/saint-gervais-les-bains/boulangerie/aux-petits-gourmands | e7979c3e-3b8a-4bc0-9db4-5250129d89fd | 2026-08-24T19:01:12.842Z | POI : Aux petits gourmands<br>City : Saint-Gervais-les-Bains<br>Catégorie : Boulangerie<br>Provenance déclarée à vérifier : google_places (run : google_places_primary).<br>Site source déclaré : www.petitsgourmands.fr. |
| EXTERNAL_SOURCE_REVIEW_REQUIRED | /decouvrir/saint-gervais-les-bains/culture/la-cure | 66ae3710-163b-4907-82bc-2e30665cea1f | 2026-08-24T18:22:04.658Z | POI : La Cure<br>City : Saint-Gervais-les-Bains<br>Catégorie : Culture<br>Provenance déclarée à vérifier : google_places (run : google_places_primary).<br>Site source déclaré : www.saintgervais.com.<br>Un texte source présent dans les données d’acquisition requiert une revue humaine. |
| EXTERNAL_SOURCE_REVIEW_REQUIRED | /decouvrir/saint-gervais-les-bains/diner/lupa | d89b3068-3f56-4a4d-b9e6-374ff0cb4124 | 2026-08-24T18:58:58.605Z | POI : Lupa<br>City : Saint-Gervais-les-Bains<br>Catégorie : Restaurant<br>Provenance déclarée à vérifier : google_places (run : google_places_primary).<br>Site source déclaré : www.lupapizzastgervais.com.<br>Un texte source présent dans les données d’acquisition requiert une revue humaine. |
| EXTERNAL_SOURCE_REVIEW_REQUIRED | /decouvrir/saint-gervais-les-bains/soin/cryo-du-mont-blanc | d5497980-c202-494f-87e9-6dc4bf8aacc2 | 2026-08-24T15:05:28.081Z | POI : Cryo du mont blanc<br>City : Saint-Gervais-les-Bains<br>Catégorie : Soin<br>Provenance déclarée à vérifier : google_places (run : google_places_primary).<br>Site source déclaré : www.cryodumontblanc.fr.<br>Un texte source présent dans les données d’acquisition requiert une revue humaine. |
| EXTERNAL_SOURCE_REVIEW_REQUIRED | /decouvrir/saint-nicolas-de-veroce/diner/pizzeria-specialites-pagu-s-monchu-s | 39f3f9ea-1725-4b3e-986c-c77b200429c8 | 2026-08-24T19:06:48.212Z | POI : Pizzeria & Spécialités Pagu's Monchu's<br>City : Saint-Nicolas-de-Véroce<br>Catégorie : Restaurant<br>Provenance déclarée à vérifier : google_places (run : google_places_primary).<br>Site source déclaré : pagusmonchus.eatbu.com.<br>Un texte source présent dans les données d’acquisition requiert une revue humaine. |

## Contradictions logements

| Code | URL publique | Identifiant public | Mise à jour | Preuves courtes |
|---|---|---|---|---|
| LODGING_STRUCTURED_TEXT_CONFLICT | /logements/le-chalet-remy | 3ba039a8-1dec-4148-91ee-603552b6fbac | 2026-08-24T05:55:21.551Z | Champ structuré bedroom_count : 10.<br>Extrait contradictoire : « Avec 525 m² répartis sur quatre niveaux, il propose de vastes espaces de vie et peut accueillir de 14 à 26 personnes dans 9 chambres et suites ». |
| LODGING_STRUCTURED_TEXT_CONFLICT | /logements/le-chalet-remy | 3ba039a8-1dec-4148-91ee-603552b6fbac | 2026-08-24T05:55:21.551Z | Champ structuré bedroom_count : 10.<br>Extrait contradictoire : « Chalet d’exception au Bettex, face au Mont-Blanc : 525 m², 9 chambres, jusqu’à 26 voyageurs, jacuzzi, sauna, cinéma et accès direct aux pistes ». |
| LODGING_STRUCTURED_TEXT_CONFLICT | /logements/le-chalet-remy | 3ba039a8-1dec-4148-91ee-603552b6fbac | 2026-08-24T05:55:21.551Z | Champ structuré surface_m2 : 575.<br>Extrait contradictoire : « Avec 525 m² répartis sur quatre niveaux, il propose de vastes espaces de vie et peut accueillir de 14 à 26 personnes dans 9 chambres et suites ». |
| LODGING_STRUCTURED_TEXT_CONFLICT | /logements/le-chalet-remy | 3ba039a8-1dec-4148-91ee-603552b6fbac | 2026-08-24T05:55:21.551Z | Champ structuré surface_m2 : 575.<br>Extrait contradictoire : « Chalet d’exception au Bettex, face au Mont-Blanc : 525 m², 9 chambres, jusqu’à 26 voyageurs, jacuzzi, sauna, cinéma et accès direct aux pistes ». |

## Structure éditoriale recommandée

Cette **proposition documentaire** distingue :

- description factuelle ;
- conseil MyStay ;
- informations pratiques ;
- source externe éventuelle ;
- date de mise à jour.

Elle n’autorise **aucune migration Prisma** ni publication automatique sans nouvelle validation de spec.

## Décisions Product Owner requises

Aucune valeur n’est corrigée automatiquement. Chaque point ci-dessous demande une validation humaine :

- `EXTERNAL_SOURCE_REVIEW_REQUIRED` — /decouvrir/saint-gervais-les-bains/alimentation/boutique-traiteur-seracgourmet — POI : Boutique Traiteur Séracgourmet
- `EXTERNAL_SOURCE_REVIEW_REQUIRED` — /decouvrir/saint-gervais-les-bains/alimentation/maison-des-alpes — POI : Maison des Alpes
- `EXTERNAL_SOURCE_REVIEW_REQUIRED` — /decouvrir/saint-gervais-les-bains/boulangerie/aux-petits-gourmands — POI : Aux petits gourmands
- `EXTERNAL_SOURCE_REVIEW_REQUIRED` — /decouvrir/saint-gervais-les-bains/culture/la-cure — POI : La Cure
- `EXTERNAL_SOURCE_REVIEW_REQUIRED` — /decouvrir/saint-gervais-les-bains/diner/lupa — POI : Lupa
- `EXTERNAL_SOURCE_REVIEW_REQUIRED` — /decouvrir/saint-gervais-les-bains/soin/cryo-du-mont-blanc — POI : Cryo du mont blanc
- `EXTERNAL_SOURCE_REVIEW_REQUIRED` — /decouvrir/saint-nicolas-de-veroce/diner/pizzeria-specialites-pagu-s-monchu-s — POI : Pizzeria & Spécialités Pagu's Monchu's
- `LODGING_STRUCTURED_TEXT_CONFLICT` — /logements/le-chalet-remy — Champ structuré bedroom_count : 10.
- `LODGING_STRUCTURED_TEXT_CONFLICT` — /logements/le-chalet-remy — Champ structuré bedroom_count : 10.
- `LODGING_STRUCTURED_TEXT_CONFLICT` — /logements/le-chalet-remy — Champ structuré surface_m2 : 575.
- `LODGING_STRUCTURED_TEXT_CONFLICT` — /logements/le-chalet-remy — Champ structuré surface_m2 : 575.
