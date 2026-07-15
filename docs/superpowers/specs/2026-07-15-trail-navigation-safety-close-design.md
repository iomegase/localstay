# Trail Navigation — suppression de la liaison dangereuse et fermeture fiable

Date : 2026-07-15  
Spec concernée : `021-trail-navigation`  
Statut : validé par le Product Owner

## Contexte

Deux défauts ont été constatés sur la carte de randonnée :

1. une liaison rouge-blanche relie la position du Tourist au point le plus proche du tracé à vol d'oiseau ;
2. la croix située en haut à gauche ne permet pas toujours de quitter la carte plein écran.

La liaison droite peut être comprise comme un itinéraire praticable alors qu'elle peut traverser une pente, une falaise, un cours d'eau ou une propriété privée. Elle ne doit donc jamais être affichée. Le calcul local de distance reste utile pour déterminer l'éligibilité au départ et informer le Tourist sous forme textuelle.

L'inspection du composant montre aussi que les contrôles supérieurs ne possèdent pas de niveau d'empilement explicite au-dessus de Mapbox. Le mode intercepté utilise `router.back()`, tandis que la page directe utilise un lien fixe. Le comportement produit validé est un retour à l'écran précédent dans les deux cas.

## Approches étudiées

### 1. Suppression totale et retour historique — retenue

- supprimer la source GeoJSON et les couches Mapbox de liaison d'approche ;
- conserver la distance au tracé uniquement dans les messages textuels ;
- maintenir les phases `pre_start`, `ready_to_join`, `approaching` et `tracking` ;
- placer la barre de contrôles dans un plan interactif explicite au-dessus de Mapbox ;
- faire appeler `router.back()` par la croix en mode intercepté et plein écran.

Cette solution supprime l'ambiguïté de sécurité sans modifier les calculs GPS ni les statistiques.

### 2. Masquage après démarrage — rejetée

La ligne resterait visible avant le clic « Démarrer ici » et conserverait le même risque d'interprétation.

### 3. Remplacement par un itinéraire piéton — rejetée

Cette solution nécessiterait un service de routage, réintroduirait l'envoi de coordonnées et ne garantirait pas la sécurité réelle du terrain. Elle dépasse le périmètre de `021`.

## Design retenu

### Carte et données

`TrailNavigationMap` continue de calculer localement le point le plus proche et la distance au tracé. Ces données alimentent l'éligibilité à 1 500 m, la transition à 35 m et les messages textuels. Aucun objet `approachLine`, aucune source `approach-line` et aucune couche rouge-blanche ne sont rendus.

La phase d'approche reste comptée dans la distance réelle depuis le point choisi par le Tourist. Le fil d'Ariane de la session, qui représente les positions réellement parcourues après le départ, reste autorisé.

### Fermeture

La barre supérieure reçoit un `z-index` explicite et des événements pointeur actifs. La croix conserve une cible minimale de 44 × 44 px et un nom accessible « Fermer ».

La croix appelle un callback unique de retour historique fondé sur `router.back()`. La route interceptée et la page plein écran utilisent ainsi le même comportement : revenir à l'écran immédiatement précédent. La fermeture démonte la carte et déclenche le nettoyage existant de `watchPosition` sans générer de résumé de session.

### Sécurité et erreurs

- aucun guidage directionnel n'est déduit de la droite géométrique vers le tracé ;
- la distance affichée reste qualifiée d'indicative ;
- si l'historique navigateur ne contient pas d'écran StayLocal, le navigateur applique son comportement standard de retour ;
- Mapbox ne peut pas intercepter le clic ou le focus de la croix ;
- le bouton Stop conserve la priorité pendant une session active.

## Tests attendus

- aucune source ou couche `approach-line` n'est rendue en `pre_start`, `ready_to_join` ou `approaching` ;
- la distance textuelle et les transitions de phase restent fonctionnelles ;
- la croix appelle exactement une fois le retour historique en mode modal ;
- la croix appelle exactement une fois le retour historique sur la page plein écran ;
- la cible reste interactive au-dessus de Mapbox et accessible au clavier ;
- quitter la carte arrête le watcher GPS sans ouvrir la modale de résumé ;
- les tests de confidentialité et de session existants restent verts.

## Hors périmètre

- calcul d'un itinéraire pédestre vers le tracé ;
- ouverture automatique de Google Maps depuis la croix ;
- modification des seuils GPS, de la distance de session ou du récapitulatif ;
- persistance de la position ou de la session.
