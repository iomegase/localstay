# Traces manquantes — Combloux et Saint-Gervais

Vérification du 30 septembre 2026, spec approuvée 019 (AC-01-02, AC-01-07, AC-02-01).

## Diagnostic confirmé

Les 48 candidats ne représentaient pas 48 tracés. Avant cette investigation : Combloux 3 géométries / 17 candidats ; Saint-Gervais 17 / 31. Les 28 manquants comprenaient 17 candidats Gemini (découverte éditoriale sans géométrie par conception) et 11 candidats Camptocamp dont le payload importé contient `geom_detail: null` et seulement un point dans `geom`. Ces 11 géométries n'ont donc pas été perdues à la conversion.

L'import officiel n'allait pas chercher les fichiers GPX liés dans le HTML ; il ne lisait que les éventuelles coordonnées intégrées. Les deux acquisitions initiales ne sélectionnaient pas la source officielle et n'avaient pas d'URL officielle renseignée. IGN enrichit l'altimétrie des géométries déjà acquises, sans rechercher de nouvelles traces.

La correction précédente bornait Overpass à 65 secondes, mais sans délai propre à chaque serveur. Un serveur primaire suspendu pouvait épuiser tout le budget avant le recours aux serveurs suivants.

## Preuves sur les sources publiques

Téléchargements HTTP 200 et fichiers XML contrôlés :

| Fiche officielle | Points GPX | Résultat |
| --- | ---: | --- |
| [Petit et Grand Croisse Baulet](https://www.combloux.com/itineraires/randonnee-pedestre-petit-et-grand-croisse-baulet/) | 1193 | Trace récupérée et rattachée au candidat Combloux dont le départ est Cuchet |
| [Sentier des Graniteurs](https://www.combloux.com/itineraires/sentier-pedestre-des-graniteurs/) | 56 | Trace récupérée et rattachée au candidat Combloux |
| [Chalet de Miage par la Gruvaz](https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/chalet-de-miage-par-la-gruvaz-les-contamines-montjoie-fr-4433457/) | 599 | GPX disponible ; boucle via le Truc, non rattachée automatiquement au candidat générique Miage |

## Correctifs locaux

- Lecture des liens GPX d'une fiche officielle fournie à l'import, téléchargement borné à 5 MB, validation des coordonnées, attribution et conservation des segments disjoints.
- Téléchargements uniquement depuis la même origine ou les éditeurs publics Apidae et Geotrek Haute-Savoie ; redirections de pièces jointes refusées.
- Pas de rattachement d'une pièce jointe à plusieurs candidats d'une page de liste ; erreurs d'acquisition conservant le contenu déjà trouvé.
- Extraction des titres corrigée pour ne pas absorber le titre suivant dans le bloc précédent.
- Overpass : délai par serveur de 20 secondes et budget serveur de 18 secondes, conservant le budget global existant et permettant les serveurs de secours.
- Pas de découverte automatique des sites officiels : la règle existante de la spec exige une URL de source fournie à l'import. Ce correctif ne crée pas un moteur de recherche de GPX par nom de randonnée.

## Récupération en base

Mises à jour conditionnelles sur `updated_at`, `review_status=needs_review`, `geometry_status=missing`, sans publication, avec journal `candidate_gpx_recovered` et note de validation :

- Grand Croisse Baulet : `7a851617-ea27-4560-9a28-68a0360cc1e6`.
- Graniteurs : `61999e3b-04c8-46f5-bc83-818a4de8fce9`.

Après récupération : **Combloux 5/17 ; Saint-Gervais 17/31 ; total 22/48**. Restent **26 candidats sans trace**. Une trace du même sommet ne démontre pas qu'il s'agit du même parcours : vérifier départ, variante, sens et description avant rattachement.

Validation : 16 suites Jest, 56 tests réussis ; TypeScript et ESLint réussis ; diff sans erreur d'espacement. Vérification réseau des pages officielles et comptage indépendant en base. Correctifs applicatifs non déployés ; les deux récupérations en base sont effectives.

## Collecte élargie demandée par le propriétaire

Le propriétaire a ensuite demandé de récupérer toutes les traces disponibles, y compris les variantes, en lui laissant la décision sur leur exploitabilité. La collecte a récupéré **91 fichiers GPX** (55 975 points) : 46 provenant des offices de tourisme, 30 de Camptocamp (notamment les sorties associées aux itinéraires), 14 de Geotrek Haute-Savoie, 1 de VisuGPX.

Les **26 candidats restants** ont reçu une trace proposée, avec le nom d’origine de la trace dans la description, la source, une note de correspondance à examiner et un journal d’audit. Les variantes ne sont pas présentées comme des correspondances certifiées. Les géométries déjà présentes n’ont pas été écrasées. **65 candidats supplémentaires** ont été créés, tous en `needs_review` :

- Combloux : 12, run `bed4d4c1-c7a2-46c9-afd8-1c1cdeeda292`.
- Saint-Gervais : 53, run `9676ff7c-6839-4508-b86c-71bd15891469`.

Dossier : `artifacts/trails-recovery-2026-09-30/`, avec index HTML recherchable, inventaire CSV, manifestes des sources et des correspondances en base. Archive : `artifacts/traces-gpx-combloux-saint-gervais-2026-09-30.zip` (91 GPX, intégrité ZIP vérifiée). Les GPX ont été analysés en XML, leurs coordonnées et segments vérifiés avant import ; aucune publication n’a été effectuée.
