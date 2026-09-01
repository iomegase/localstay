# Public Demo From Private Guide Reference Design

Date: 2026-09-01
Status: validated
Owner: Product Owner

## Goal

Reconstruire le guide public de démonstration à partir du design et du contenu
fonctionnel du guide privé complet, sans modifier aucun fichier, aucune route,
aucune donnée ni aucun comportement du guide privé.

## Source de vérité

Le guide privé actuellement rendu après activation d'un séjour est une
référence en lecture seule. La démo reproduit son parcours complet : accueil,
coups de cœur, guide logement détaillé, arrivée, informations pratiques,
équipements, départ, carte, fiches POI et randonnée, logements, blog et contact.

Le guide privé ne devient pas un composant partagé et ne reçoit aucun refactor.
La démo possède sa propre présentation sous `src/features/guide-demo/` et copie
le contrat visuel privé avec des données de démonstration.

## Architecture retenue

- `GuideDemoLauncher` et `GuideDemoPhoneButton` restent les déclencheurs
  publics existants.
- `GuideDemoModal` conserve le dialogue smartphone sans route dédiée.
- Une application de démonstration autonome gère les vues avec un état React
  local et ne modifie jamais l'URL du navigateur.
- Les écrans de la démo sont exclusivement implémentés dans le bounded context
  `guide-demo`.
- Les fichiers privés sous `guide-app`, les routes `/sejour/*` et les anciennes
  routes privées de compatibilité sont strictement intouchables.

## Données et sécurité

La démo utilise un bundle TypeScript statique et révisé : logement fictif,
textes fictifs, POI publics autorisés, coordonnées génériques et médias locaux
non sensibles. Elle n'importe aucune query Prisma, ne lit aucun cookie, ne
connaît aucun UUID réel et n'appelle aucune API privée ou interne.

Les valeurs sensibles visibles dans un vrai séjour sont remplacées par des
équivalents explicitement marqués comme fictifs. Les actions de contact,
d'itinéraire et de randonnée restent simulées ou désactivées lorsqu'elles
pourraient produire un effet externe.

## Guide logement de démonstration

Le guide logement reproduit la présentation privée complète : hero logement,
faits du séjour, accès, vidéo, Wi-Fi, équipements, règlement, informations
pratiques, urgences, recyclage et préparation du départ. Les contenus sont
fictifs mais les sections, leur ordre, leurs états et leur hiérarchie visuelle
suivent la référence privée.

## Nettoyage

Après remplacement, chaque ancien fichier de démonstration est recherché dans
les imports du code, des tests et de la traçabilité. Seuls les artefacts du
bounded context `guide-demo` devenus réellement orphelins sont supprimés. Les
routes `/guide`, `/decouvrir`, les composants marketing et tous les fichiers du
guide privé sont hors du nettoyage.

## Vérification

- tests d'intégration de chaque vue et navigation interne ;
- tests de sécurité interdisant cookies, UUID réels, Prisma et API privées ;
- vérification que l'URL reste stable pendant toute la démo ;
- contrôle mobile et desktop du modal ;
- tests de régression des routes privées existantes ;
- inspection Git confirmant l'absence de modification des chemins privés ;
- lint, build Next.js et suite Jest complète, en distinguant les deux échecs
  éditoriaux présents dans la baseline avant ce chantier.

## Décisions écartées

- refactoriser le guide privé en socle partagé : refusé, car le guide privé est
  une référence en lecture seule ;
- dupliquer des données privées : interdit pour la confidentialité ;
- afficher une route privée en iframe : interdit par le contrôle d'accès et les
  cookies ;
- supprimer les routes historiques `/guide` : hors périmètre de ce chantier.

## Auto-revue

Le design ne contient aucun placeholder. La démo est le seul produit modifié,
la frontière de sécurité est explicite et le nettoyage est limité aux fichiers
orphelins de la démo. Aucune décision métier ne reste ouverte.
