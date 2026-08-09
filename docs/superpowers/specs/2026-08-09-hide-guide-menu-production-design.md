# Masquage temporaire du menu des guides en production

## Contexte

Le bouton burger du `GuideApp` partagé ne doit momentanément pas être proposé
aux visiteurs en production. Cette restriction concerne uniquement le guide
privé (`/sejour/*`) et le guide de démonstration. Les autres menus publics du
site ne changent pas.

## Décision

`GuideApp` détermine la disponibilité du menu à partir de l'environnement
d'exécution : le menu est disponible lorsque `NODE_ENV !== 'production'` et
indisponible lorsque `NODE_ENV === 'production'`.

Cette disponibilité est transmise explicitement à `GuideHeader`. Lorsque le
menu est indisponible :

- le bouton burger n'est pas rendu ;
- l'overlay du menu n'est pas monté ;
- aucun espace vide n'est réservé à droite du header ;
- le logo et son action de retour à l'accueil restent inchangés.

En développement local et dans les environnements de test, le comportement
actuel est conservé afin de permettre les vérifications du menu.

## Périmètre

- Guide privé, pour toutes les routes utilisant le `GuideApp` partagé.
- Guide de démonstration utilisant le même `GuideApp`.
- Aucun changement du menu des autres pages publiques.
- Aucune variable Vercel supplémentaire et aucune modification de données.

## Tests

Les tests couvrent les deux états du contrat :

- hors production, le bouton burger et l'overlay restent disponibles ;
- en production, le bouton burger et l'overlay sont absents du DOM ;
- le logo du guide reste visible et utilisable dans les deux états.

La spec approuvée `034-private-guide-app` sera amendée avant toute modification
du code afin de tracer cette divergence temporaire avec son comportement
historique.
