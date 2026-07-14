# Design — Entrée libre et récapitulatif de session randonnée

## Statut

- Feature source : `021-trail-navigation`
- Décisions validées par le Product Owner le 2026-07-14
- Cible : MVP 2, navigation publique sans compte
- Document normatif principal : `specs/features/021-trail-navigation/spec.md`

## Problème

Le mode randonnée sait afficher le tracé, suivre la position GPS et projeter la position sur le parcours, mais son comportement historique associe encore la progression au départ officiel. Ce modèle ne couvre pas correctement deux situations courantes :

- un Tourist commence son déplacement à proximité du parcours, mais pas au départ officiel ;
- un Tourist rejoint volontairement un segment intermédiaire du parcours.

La distance affichée ne doit pas inclure artificiellement la portion du tracé située avant l'entrée réelle du Tourist. La session doit aussi pouvoir se terminer sans supposer que le Tourist atteindra l'arrivée officielle, notamment sur une boucle ou après une entrée à mi-parcours.

## Décisions produit

1. L'approche retenue est une session GPS entièrement locale, sans persistance et sans envoi de trace à une API.
2. Après activation explicite du GPS, `Démarrer ici` est disponible si la dernière position est récente, précise et située à 1 500 m ou moins du point le plus proche de toute la géométrie du tracé.
3. La position GPS courante au clic `Démarrer ici` devient le départ réel de la session, même si elle n'est pas encore sur le tracé.
4. La distance et la durée repartent de zéro au clic. La phase d'approche restante fait partie de la session.
5. À 35 m ou moins du tracé, la session passe automatiquement de `approaching` à `tracking`.
6. Il n'existe aucune fin automatique. Le Tourist termine avec un bouton `Stop` toujours accessible après démarrage.
7. `Stop` arrête le GPS, fige les statistiques et ouvre une modale de récapitulatif.
8. Une métrique indisponible n'est pas rendue. Le nombre de pas n'est pas calculé en MVP 2.

## Approches étudiées

### A — Session GPS locale, retenue

La distance est calculée depuis les points GPS filtrés après le clic de départ. La durée et, lorsque possible, le dénivelé sont calculés localement. Cette approche réutilise le fil d'Ariane GPS existant, respecte la confidentialité de `021` et fonctionne sans compte.

### B — GPS et capteurs de mouvement

Cette variante tenterait d'estimer le nombre de pas depuis les accélérations du téléphone. Elle demande des permissions et des algorithmes supplémentaires, varie selon les navigateurs et augmente la consommation. Elle n'est pas retenue.

### C — Enrichissement serveur

Cette variante transmettrait la trace pour recalculer les statistiques. Elle est écartée parce qu'elle modifierait le contrat de confidentialité, introduirait des traitements de données de localisation et nécessiterait une nouvelle spec.

## Parcours utilisateur

### Avant le démarrage

1. Le mode s'ouvre en `ready` sans requête GPS.
2. `Activer le suivi GPS` déclenche `watchPosition` après consentement.
3. La dernière position ne rend `Démarrer ici` disponible que si :
   - elle date de 10 secondes ou moins ;
   - sa précision horizontale est inférieure ou égale à 30 m ;
   - sa distance au point le plus proche du tracé est inférieure ou égale à 1 500 m.
4. Au-delà de 1 500 m, l'état reste `pre_start` et demande au Tourist de se rapprocher.
5. Le point le plus proche est recherché sur tous les segments du `LineString` ou `MultiLineString`, pas seulement au départ officiel.

### Démarrage et approche

Au clic `Démarrer ici`, le système :

- copie la dernière position fiable dans `sessionStartPosition` ;
- fixe `sessionStartedAt` ;
- efface les points et temps collectés avant le clic ;
- enregistre la position de départ comme premier point de session ;
- passe en `approaching` ;
- conserve la liaison vers le point le plus proche du tracé.

La caméra peut suivre le Tourist après ce démarrage explicite. La phase d'approche est comptée dans la distance réelle. Quand la distance au tracé devient inférieure ou égale à 35 m, la session passe en `tracking` et la liaison d'approche disparaît.

### Arrêt

Après le démarrage, `Stop` reste accessible en `approaching`, `tracking`, `off_track`, `low_accuracy` et en cas de perte du signal. Le premier clic :

- appelle `clearWatch` une seule fois ;
- fixe `sessionStoppedAt` ;
- empêche toute nouvelle mutation des statistiques ;
- passe la session en `stopped` ;
- ouvre la modale `Randonnée terminée`.

Les clics suivants sont sans effet. Atteindre l'arrivée officielle ne déclenche aucun arrêt.

## Statistiques locales

### Distance parcourue

La distance est la somme des distances de Haversine entre les points acceptés après `sessionStartedAt`. Un point est accepté si :

- sa précision horizontale est inférieure ou égale à 30 m ;
- au moins 3 secondes le séparent du dernier point accepté ;
- il représente un déplacement d'au moins 5 m ;
- la vitesse calculée entre les deux points ne dépasse pas 8 m/s.

La distance théorique entre le départ officiel et le point d'entrée ne participe jamais à ce compteur. Le pourcentage de tracé peut seulement localiser le point d'entrée avant le démarrage.

### Durée

La durée est `sessionStoppedAt - sessionStartedAt`. Une perte GPS ne suspend pas le temps ; elle empêche seulement l'ajout de distance jusqu'au prochain point fiable.

### Dénivelé positif

Un échantillon altitude est exploitable si le point horizontal associé est accepté, si `altitude` et `altitudeAccuracy` sont finis et si `altitudeAccuracy <= 20 m`.

Le dénivelé est rendu seulement avec au moins trois échantillons exploitables. Les altitudes sont lissées par médiane glissante sur trois valeurs, puis seuls les gains successifs d'au moins 3 m sont additionnés. Si ces conditions ne sont pas réunies, la carte de dénivelé n'existe pas dans la modale.

### Pas

Le nombre de pas n'est ni calculé ni estimé. Aucune carte `Pas`, valeur `0` ou valeur `n/a` n'est affichée.

## Interface

Le panneau de navigation distingue les données théoriques du parcours et les statistiques de session :

- avant `Démarrer ici` : distance, durée et dénivelé théoriques du Trail peuvent rester visibles ;
- après `Démarrer ici` : la distance et la durée de session deviennent les valeurs de progression principales ;
- le pourcentage depuis le départ officiel ne porte jamais le libellé `distance parcourue`.

La modale de fin affiche :

- `Distance parcourue` ;
- `Durée` ;
- `Dénivelé positif` uniquement quand disponible ;
- les actions `Voir le tracé` et `Quitter la rando`.

`Voir le tracé` ferme la modale mais ne reprend pas la session. `Quitter la rando` ferme le mode de navigation. Aucune action de reprise n'est prévue.

## Découpage technique

- `TrailNavigationMap` orchestre Mapbox, la position, les états et les composants de présentation.
- Un hook de session isolé possède le départ réel, le chronomètre, les points acceptés, l'arrêt idempotent et le résumé figé.
- Une bibliothèque pure calcule la distance cumulée, filtre les altitudes et calcule le dénivelé.
- Un composant de modale reçoit un résumé immuable et masque les champs absents.
- Aucun modèle Prisma, aucune migration et aucune route API ne sont ajoutés.

Les unités restent petites : le hook ne connaît pas Mapbox, les fonctions statistiques ne connaissent ni React ni le navigateur, et la modale ne recalcule aucune métrique.

L'état de session et la santé GPS sont deux axes distincts afin qu'une perte de précision ne fasse pas oublier qu'une session est active :

- phase de session : `idle | pre_start | ready_to_join | approaching | tracking | stopped` ;
- santé GPS : `inactive | prompting | good | low_accuracy | denied | unavailable` ;
- écart au tracé après atteinte physique : indicateur dérivé `off_track`.

Cette séparation garantit que `Stop` reste affichable en `approaching` ou `tracking` même si la santé GPS passe temporairement à `low_accuracy` ou `unavailable`.

## États et transitions

```text
idle
  -> ready_to_join       GPS good et distance au tracé <= 1500 m
  -> pre_start           GPS good et distance au tracé > 1500 m

ready_to_join
  -> approaching         clic Démarrer ici

approaching
  -> tracking            distance au tracé <= 35 m
  -> stopped             clic Stop

tracking
  -> stopped             clic Stop

gpsHealth
  inactive -> prompting -> good | low_accuracy | denied | unavailable
  low_accuracy | unavailable -> good dès réception d'un nouveau fix fiable
```

Une perte GPS après démarrage conserve la session et ses valeurs acquises. `Stop` reste disponible. La fermeture de la page appelle `clearWatch` et détruit la session sans récapitulatif.

## Vérification

Les tests doivent couvrir au minimum :

- la limite inclusive de 1 500 m et le refus à 1 500 m dépassés ;
- le calcul du point le plus proche sur un segment intermédiaire ;
- l'absence de démarrage sans GPS, avec un point de plus de 10 secondes ou une précision supérieure à 30 m ;
- la copie exacte de la position au clic et la remise à zéro des points antérieurs ;
- l'inclusion de l'approche dans la distance ;
- l'exclusion de la progression théorique depuis le départ officiel ;
- le passage en `tracking` à 35 m ;
- la visibilité permanente de `Stop` après démarrage ;
- l'idempotence de l'arrêt et l'appel unique à `clearWatch` ;
- le gel du résumé après arrêt ;
- l'affichage conditionnel du dénivelé ;
- l'absence du nombre de pas ;
- l'absence de persistance ou d'envoi réseau de la trace.

## Hors scope

- persistance, synchronisation ou partage de session ;
- reprise après arrêt ou rechargement ;
- podomètre ou estimation des pas ;
- recalcul serveur du dénivelé ;
- fin automatique d'une boucle ou d'un parcours linéaire ;
- navigation vocale, cartographie hors ligne ou détection d'accident.
