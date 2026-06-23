# Commentaire Owner contextuel sur la fiche POI

## Statut

Validé par le Product Owner le 2026-06-23.

## Objectif

Afficher le commentaire personnel d'une recommandation Owner sur la fiche du
POI, uniquement lorsque le Tourist consulte le site dans le contexte du Lodging
qui porte cette recommandation.

## Décision

La page serveur de la fiche POI lit le séjour actif via le cookie
`lodging_id`. Après avoir chargé le `PoiDetail` global, elle effectue une query
contextuelle séparée sur `LodgingFeaturedPoi` avec la paire exacte
`(lodging_id, poi_id)`.

Cette query retourne uniquement :

- le commentaire `owner_note` normalisé ;
- le nom de l'Owner déjà disponible dans le contexte de séjour si nécessaire
  pour le libellé.

Elle retourne `null` si :

- aucun séjour actif n'existe ;
- le Lodging est inactif ou soft-deleted ;
- le POI n'est pas recommandé par ce Lodging ;
- la recommandation est soft-deleted ;
- le POI est inactif ou soft-deleted ;
- `owner_note` est vide après trim.

## Séparation des responsabilités

`getPoiDetail` reste une query globale, mémorisable et indépendante du visiteur.
Le commentaire Owner ne doit pas être ajouté à `PoiDetail`, à l'API publique du
POI, aux metadata ou au JSON-LD.

Une query dédiée du bounded context `guide-customization` expose le commentaire
contextuel à la page serveur. Cette séparation empêche qu'un commentaire d'un
Lodging soit mis en cache ou exposé à un autre séjour.

## Rendu

Un composant de présentation réutilisable rend le bloc :

- surtitre "Le mot de votre hôte" ;
- commentaire en texte simple ;
- style conforme au bloc du mockup
  `docs/DAT/diagrams/mockups/004-poi-detail/carte-resto-last.html`.

Le bloc est placé après les informations principales du POI et avant les blocs
secondaires. Il est utilisable par la fiche POI standard et la fiche randonnée.
Le composant retourne `null` quand aucun commentaire contextuel n'est fourni.

## Isolation

Si plusieurs Lodgings recommandent le même POI, la page ne recherche jamais un
commentaire "par défaut" ou le commentaire le plus récent. Seule la
recommandation correspondant au `lodging_id` du séjour actif est éligible.

La navigation directe vers la même URL sans cookie de séjour reste une fiche
POI générale sans commentaire Owner.

## Tests

- query : retourne la note pour la paire exacte Lodging/POI ;
- query : refuse une recommandation d'un autre Lodging ;
- query : masque les entités inactives, supprimées ou la note vide ;
- page : affiche le bloc avec un séjour actif correspondant ;
- page : n'affiche rien sans séjour actif ou pour un autre Lodging ;
- composant : rend le texte comme texte simple, sans Markdown ou HTML.

## Hors périmètre

- afficher plusieurs commentaires Owner sur une même fiche ;
- afficher un commentaire sans séjour actif ;
- ajouter le commentaire au contrat API POI ;
- indexer le commentaire dans les metadata ou le JSON-LD ;
- afficher le commentaire dans les listes géographiques.
