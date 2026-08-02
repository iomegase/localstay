# Réactivation du guidage randonnée depuis le guide privé

## Objectif

Rendre actif le bouton `Démarrer` affiché sur la fiche d'un POI randonnée du
guide privé. L'action ouvre le mode de navigation randonnée MyStay existant,
sans modifier son rendu ni ses règles métier.

## Référence fonctionnelle

- Spec approuvée : `specs/features/021-trail-navigation/spec.md`
- Compatibilité inter-ville : `specs/features/012-guide-customization/spec.md`
  (`BR-03`, `BR-08`)
- Critères concernés : `AC-01-05`, `AC-02-01`, `AC-02-02`, `AC-02-03`
- Règles concernées : `BR-01`, `BR-04`, `BR-05`, `BR-15`

## Comportement

- En mode `private`, le bouton `Démarrer` reste visible uniquement lorsque la
  randonnée possède une géométrie valide et une qualité autorisant le suivi.
- Au clic, le guide ouvre la route canonique
  `/guide/[city-slug]/rando/[trail-slug]/start` avec le slug de la City réelle
  du POI, y compris pour une recommandation Owner inter-ville.
- Cette route continue de rendre le composant `TrailNavigationMap` existant :
  fond Mapbox Outdoor, tracé, relief, consentement GPS et suivi local.
- Aucun GPS n'est demandé avant l'action explicite prévue dans le mode de
  navigation.
- En mode `demo`, le bouton demeure désactivé et aucune route privée ou de
  navigation n'est ouverte.

## Architecture

La query du guide privé transmet au `GuideApp` le slug de la City réelle de
chaque POI. Le shell construit l'action de démarrage uniquement pour le mode
privé, utilise ce slug en priorité et conserve le `citySlug` du contexte de
séjour comme repli de compatibilité pour les POI qui ne le portent pas encore.
Il transmet ensuite l'action à `GuidePoiDetails`. La fiche ne duplique ni la
requête randonnée ni le composant de carte : elle déclenche seulement la route
existante avec les slugs du POI sélectionné.

## Erreurs et garde-fous

- Sans contexte privé, sans slug de City de repli, sans slug de POI ou sans
  `trackingEnabled`, aucune action de démarrage n'est exposée.
- La route existante conserve son `notFound()` si la randonnée publiée n'est
  plus disponible.
- La démo reste isolée du guidage actif.

## Tests

- Test d'intégration : le bouton privé actif déclenche la route canonique avec
  la City réelle d'une recommandation inter-ville.
- Test unitaire : l'adaptateur privé conserve le slug de City réel du POI.
- Test d'intégration : la démo conserve son bouton désactivé.
- Régression : les tests `021-trail-navigation` existants continuent de passer.

## Hors périmètre

- Modification visuelle de la fiche randonnée.
- Modification de `TrailNavigationMap`.
- Ajout d'un fond IGN ou d'une nouvelle source cartographique.
- Modification des règles GPS, du tracé ou des statistiques de session.
