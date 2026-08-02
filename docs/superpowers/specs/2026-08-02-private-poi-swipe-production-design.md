# Private POI Swipe and Production Routing Design

## Goal

Rendre la fiche POI du nouveau GuideApp plus naturelle sur mobile et mettre en
production les correctifs déjà validés pour la randonnée et le retour vers la
carte interne.

## Root cause confirmed

La production suit `main`, actuellement arrêtée au commit `68723ca`, alors que
les correctifs randonnée et carte ont été vérifiés puis poussés sur
`agent/private-guide-practical` jusqu'au commit `c7cfb47`.

La version de `main` explique directement les deux symptômes :

- `GuidePoiDetails` rend le bouton randonnée sans callback `onClick` ;
- `PRIVATE_GUIDE_ROUTES.map` pointe encore vers `/map`, donc le retour d'une
  fiche ouverte depuis la carte quitte le GuideApp et recharge l'ancienne carte.

La correction de production consiste à fusionner la branche validée dans
`main`, sans créer un second correctif divergent.

## Swipe architecture

`PoiDetailHeroCarousel` conserve son API partagée et reçoit une variante de
navigation explicite pour le nouveau GuideApp. Cette variante rend toutes les
photos dans une rangée horizontale native :

- chaque slide occupe exactement 100 % de la largeur du hero ;
- le conteneur utilise `overflow-x-auto`, `snap-x` et `snap-mandatory` ;
- le navigateur gère directement le geste tactile et l'inertie ;
- l'index actif est synchronisé pendant le scroll ;
- les indicateurs restent visibles et deviennent des boutons accessibles ;
- aucune flèche gauche/droite n'est rendue dans cette variante.

`GuidePoiDetails` active cette variante en modes privé et démonstration. Les
fiches historiques qui suivent encore le contrat à flèches et la variante Blog
ne sont pas modifiées dans cet incrément.

## Preserved behavior

- Le swipe horizontal ne bloque pas le scroll vertical du panneau POI.
- La photo hero administrée reste prioritaire et les fallbacks restent
  disponibles si la galerie est absente ou qu'une image échoue.
- Le signalement de photo morte, le badge « Ouvert » et les overlays restent
  fonctionnels.
- Le bouton randonnée reste actif uniquement en mode privé et continue de
  naviguer vers la route de démarrage validée par la spec 021.
- Le bouton Retour conserve l'origine `map` dans l'état interne de `GuideApp` et
  n'appelle jamais l'ancienne route `/map`.

## Testing and release

- Test unitaire du carousel : scroll-snap, absence de flèches, indicateurs et
  synchronisation de l'index.
- Test d'intégration GuideApp : retour d'une fiche vers la carte interne sans
  `router.push('/map')`.
- Test d'intégration privé : le bouton randonnée possède le callback et ouvre
  la route de démarrage.
- Lint, TypeScript, tests GuideApp et build de production avant fusion.
- Fusion locale de `agent/private-guide-practical` vers `main`, puis push de
  `main` afin de déclencher le déploiement Vercel.

## Out of scope

- Refonte des fiches POI historiques hors GuideApp.
- Modification des données POI, du GPS ou du moteur de randonnée.
- Ajout des boutons Favori/Partage : aucun changement de ces actions n'est
  inclus dans cet incrément.
