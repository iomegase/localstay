# Commentaires inter-villes et recommandations sur la fiche logement

Ce design complète et remplace partiellement
`2026-06-22-cross-city-recommendations-design.md` pour ajouter la fiche publique
du logement comme surface de restitution, sans modifier les listes
géographiques du Guide.

## Statut

Validé par le Product Owner le 2026-06-23.

## Objectif

Étendre le commentaire Owner aux POI sélectionnés dans "Recommandations ailleurs" et afficher correctement toutes les recommandations Owner sur la fiche publique du logement.

## Décisions produit

- Un POI local et un POI inter-ville utilisent le même champ `owner_note`.
- Le commentaire est facultatif, limité à 300 mots et rendu comme texte simple.
- Le formulaire Owner affiche un compteur de mots pour chaque POI inter-ville sélectionné.
- La fiche logement sépare les recommandations en deux blocs :
  - recommandations locales ;
  - "À découvrir ailleurs", groupé par City.
- `/nos-recommandations` conserve la même séparation.
- Une recommandation pointe toujours vers la fiche POI de sa City réelle.

## Formulaire Owner

`OtherCityRecommendations` doit recevoir et modifier `owner_note` dans chaque `OtherCityPoiSelection`. Lorsqu'un POI est coché, son commentaire est initialisé à `null`. La sélection affiche ensuite un textarea "Votre mot pour les voyageurs" et un compteur `X / 300 mots`.

Le composant parent conserve une seule liste `featured_pois`. À la sauvegarde, les recommandations locales et inter-villes transmettent toutes `poi_id`, `owner_note` et `sort_order`. Le bouton de sauvegarde est désactivé si un commentaire local ou inter-ville dépasse 300 mots.

## Fiche publique du logement

La query de détail logement sélectionne pour chaque `LodgingFeaturedPoi` :

- `owner_note` ;
- le POI et sa photo ;
- sa catégorie ;
- sa City réelle.

Le résultat public sépare les items en deux collections sans nouveau modèle de données :

- local si `poi.city_id === lodging.city_id` ;
- ailleurs sinon.

Le bloc local conserve le rendu actuel. Le bloc "À découvrir ailleurs" apparaît en dessous, groupé par City. Chaque card affiche le commentaire Owner lorsqu'il existe. Son URL utilise `poi.city.slug`.

## Sécurité et intégrité

- Les POI inactifs ou soft-deleted sont exclus.
- Aucun commentaire n'est rendu comme Markdown ou HTML.
- Les recommandations inter-villes n'apparaissent pas dans les listes géographiques du Guide local.
- Aucun changement Prisma supplémentaire n'est nécessaire.

## Tests attendus

- Test composant : commentaire saisi sur un POI inter-ville, compteur et payload.
- Test composant : sauvegarde bloquée au-delà de 300 mots.
- Test query logement : City réelle et `owner_note` sont retournés.
- Test fiche logement : deux sections distinctes, regroupement par City et liens corrects.
- Test de non-régression : recommandations locales inchangées et POI invalides exclus.

## Hors périmètre

- Rating Owner.
- Injection des recommandations inter-villes dans `/guide/[city-slug]`.
- Distances ou cartes inter-villes.
- Traduction automatique des commentaires.
