# Parité visuelle du guide public de démonstration

## Statut et traçabilité

- Décision Product Owner : validée le 24 août 2026.
- Spec porteuse : `031-public-marketing-site`, statut `approved`.
- Critères concernés : AC-05-01 à AC-05-05 et AC-05-09.
- Règles concernées : BR-23, BR-24, BR-26, BR-29 et BR-30.
- Specs de présentation partagée : `034-private-guide-app`,
  `036-private-guide-lodging-home`, `037-private-guide-arrival`,
  `038-private-guide-practical-info` et
  `039-private-guide-departure-frame`.

## Objectif

La démonstration publique doit montrer une expérience aussi riche et crédible
que le guide logement privé, tout en restant entièrement fictive et sans accès
à un séjour réel. Elle reprend le style MyStay visible dans le guide de
référence : surface blanche, cartes bleu nuit, accents roses, grands rayons,
logo MyStay et navigation basse fixe.

La démonstration reste une déclinaison du `GuideApp` partagé. Elle ne crée pas
une seconde interface et ne copie pas les composants du guide privé.

## Parcours retenu

1. Le modal s'ouvre sur l'accueil `Bienvenue au 305`.
2. `Découvrir le livret d'accueil` ouvre le sommaire du Guide.
3. Le sommaire affiche les horaires d'arrivée et de départ, puis quatre entrées :
   `Accéder au logement`, `Informations pratiques`, `Équipements` et
   `Préparer le départ`.
4. Chaque entrée ouvre la vue partagée correspondante.
5. La navigation basse conserve `Accueil`, `Guide`, `Favoris` et `Carte`.
6. La navigation est volontairement simple. Aucun nouveau workflow, stockage
   ou service externe n'est ajouté pour cette amélioration.

## Architecture

`GuideDemoModal` continue de rendre `GuideApp` en `mode="demo"`. Le composant
reçoit uniquement les constantes statiques `demoLodging` et `demoPois`.

La parité est obtenue en complétant la fixture de démonstration selon le
contrat `GuideLodging`, pas en ajoutant une branche JSX propre à la démo. Les
vues Accès, Informations pratiques, Équipements et Départ restent celles de
`GuideLodgingViews`, avec les composants partagés du guide privé.

La démo n'importe ni Prisma, ni chargeur privé, ni contexte de séjour. Elle ne
lit aucun cookie, ne reçoit aucun UUID réel et n'effectue aucun appel vers une
route privée.

## Données fictives

La fixture présente un logement fictif nommé `Le 305`, à
Saint-Gervais-les-Bains, avec les éléments suivants :

- arrivée à 16:00 et départ à 10:00 ;
- adresse fictive ne correspondant pas à une résidence réelle ;
- instructions d'accès génériques sans digicode ni procédure exploitable ;
- réseau Wi-Fi et mot de passe explicitement fictifs ;
- urgences publiques et contacts génériques ;
- règlement intérieur, télévision et équipements représentatifs ;
- neuf consignes de départ partagées, sans persistance.

Les POI continuent de provenir de l'unique collection statique `demoPois`.

## Politique des médias

Les photographies existantes peuvent être réutilisées uniquement lorsqu'elles
montrent une pièce, un paysage ou un équipement non sensible et que leur droit
d'utilisation par MyStay est acquis.

Sont interdits dans le bundle public :

- serrure, digicode, boîte à clés ou clé identifiable ;
- entrée privée, accès garage ou cheminement exploitable ;
- plaque, adresse, document ou donnée permettant d'identifier le logement ;
- capture contenant un mot de passe, un code ou un numéro privé ;
- média dont le caractère non sensible n'a pas été vérifié.

Les emplacements d'accès utilisent des médias génériques locaux. Lorsqu'un
média autorisé manque ou échoue, le fallback MyStay local existant est rendu.

## Contrat visuel

- Le modal conserve son téléphone de 360 px par 720 px maximum.
- Le guide privé conserve sa frame de 430 px par 820 px maximum.
- Aucun `zoom`, aucune mise à l'échelle artificielle et aucun thème parallèle.
- Les couleurs, typographies, rayons, ombres, icônes et espacements proviennent
  des composants MyStay partagés.
- Sur mobile, le contenu utilise toute la surface disponible sans débordement
  horizontal.
- Le contenu interne défile, tandis que la navigation basse reste dans la
  frame.

## États et comportements

- La checklist de départ reste locale à la session et n'est jamais persistée.
- Les interactions déjà fournies par les composants partagés peuvent rester
  actives ; aucune nouvelle interaction complexe n'est ajoutée.
- L'absence d'une donnée facultative masque proprement le bloc concerné ou
  utilise le fallback non sensible déjà prévu par `GuideApp`.
- Une erreur de média n'expose aucune information technique et déclenche le
  fallback local.
- La fermeture du modal, le focus, `Escape`, l'overlay et
  `prefers-reduced-motion` conservent le contrat existant.

## Vérification

Les tests doivent démontrer :

1. l'ouverture sur `Bienvenue au 305` ;
2. le passage de l'accueil au sommaire Guide ;
3. la présence et l'ouverture des quatre rubriques ;
4. le rendu par les composants partagés, sans seconde implémentation visuelle ;
5. l'usage exclusif de constantes statiques fictives ;
6. l'absence d'UUID, de cookie, de chargeur privé et de donnée sensible ;
7. le fallback des médias absents ou invalides ;
8. l'absence de régression du guide privé ;
9. le rendu sans débordement aux largeurs mobile et desktop prévues.

## Hors périmètre

- Refonte du guide privé.
- Persistance de la checklist ou des favoris de démonstration.
- Géolocalisation automatique du visiteur.
- Ajout d'une API ou d'une migration Prisma.
- Publication d'un média d'accès réel.
- Reproduction des secrets visibles dans les captures de référence.

## Décisions closes

- Le parcours commence par l'accueil, puis ouvre le sommaire Guide.
- L'approche retenue enrichit le `GuideApp` partagé et sa fixture de démo.
- La navigation demandée est simple.
- Les données textuelles sont fictives.
- Seuls les médias réels vérifiés comme non sensibles peuvent être réutilisés.
- Le style MyStay existant est le seul contrat visuel.

Il ne reste aucune question ouverte pour la rédaction du plan d'implémentation.
