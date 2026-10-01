# Récupération des dénivelés — 30 septembre 2026

Demande : compléter les statuts « Élév. missing » (spec 019, AC-02-02 et BR-07).

La collecte GPX précédente avait enregistré les géométries sans exécuter l'enrichissement altimétrique pour les traces dépourvues de métriques dans leurs métadonnées. 53 candidats actifs sur 128 avaient un dénivelé manquant ; tous possédaient une géométrie.

## Opération appliquée à la base réelle

- 18 dénivelés positifs calculés depuis les altitudes déjà présentes dans les GPX.
- 34 dénivelés positifs calculés après récupération des altitudes de tous les sommets des traces par le service IGN Géoplateforme `elevation.json`, ressource `ign_rge_alti_wld`, requêtes POST par lots de 200 points, cache des coordonnées et reprises bornées.
- 1 dénivelé importé de la sortie Camptocamp exacte : Tour du Mont-Blanc, sortie 1335859, `height_diff_up = 9003` m. L'IGN ne couvrait pas tous ses points ; aucune altitude fictive n'a été ajoutée sur cette trace.
- Somme des différences positives entre altitudes successives, indépendamment dans chaque segment, sans interpolation entre segments disjoints et sans lissage. Les dénivelés restent dépendants de la résolution et du bruit de leur source.
- Les altitudes récupérées ont été ajoutées comme troisième coordonnée sur les 52 traces calculées ; les coordonnées horizontales sont inchangées.
- Statut `elevation_status = valid`, métrique, provenance et journal d'audit enregistrés. Les valeurs préexistantes, photos, décisions de revue et publications sont préservées. Aucune nouvelle randonnée publiée.

## Vérification indépendante

Lecture après écriture : 128 candidats actifs, aucun dénivelé manquant. Recalcul indépendant des 52 profils, comparaison de la valeur Camptocamp avec sa source, contrôle des coordonnées, des altitudes, des valeurs précédemment présentes et de la conservation des photos : aucune anomalie.

Livrables : `artifacts/trail-elevations-2026-09-30/` contient l'inventaire CSV, les résultats, 52 profils, la réponse source Camptocamp et `verification.json`.

Sources techniques :
- https://cartes.gouv.fr/aide/fr/guides-utilisateur/utiliser-les-services-de-la-geoplateforme/calcul-altimetrique/
- https://www.camptocamp.org/outings/1335859

Il s'agit d'une récupération de données directement appliquée ; aucun déploiement applicatif n'est nécessaire pour ces dénivelés. Le pipeline applicatif n'a pas été modifié dans cette opération.
