# Design — Invalidation du cache de l’image hero marketing

## Contexte

L’image `public/marketing/hero-chalet.png` a été remplacée en conservant le même
chemin. Le nouveau binaire est présent dans Git et servi localement, mais le
front Vercel peut continuer à afficher une transformation `next/image` déjà
mise en cache sous cette URL.

## Décision

L’image est renommée `hero-chalet-v2.png`. Toutes les références actives à
`/marketing/hero-chalet.png` sont remplacées par
`/marketing/hero-chalet-v2.png`.

Le changement de chemin crée une nouvelle clé pour le cache d’optimisation
d’images Vercel. Aucun purge CDN, paramètre de requête ou changement global de
configuration Next.js n’est nécessaire.

## Périmètre

- Renommer le fichier public existant sans modifier son contenu.
- Mettre à jour la home marketing, la page séminaires et les fallbacks du guide
  qui utilisent actuellement cette image.
- Mettre à jour les tests qui constituent le contrat de ces chemins publics.
- Conserver `next/image`, `object-cover`, les dimensions et les overlays actuels.

## Vérification

- Un test échoue tant qu’une référence active utilise l’ancien chemin.
- Les tests marketing et guide ciblés passent avec le nouveau chemin.
- Le build de production passe.
- Le nouveau chemin est présent dans le commit poussé et l’ancien chemin n’est
  plus référencé par le code actif.

## Hors périmètre

- Modification du visuel fourni.
- Purge manuelle du cache Vercel.
- Changement des règles globales de cache ou d’optimisation d’images.
