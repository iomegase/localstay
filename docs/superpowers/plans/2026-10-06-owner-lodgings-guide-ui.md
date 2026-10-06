# Plan — 077 Logements et guide propriétaire

1. Retrait message d'accueil : formulaire, API (schéma), requêtes customization, types, guide privé (accroche), ancien guide en séjour, city-guide, traductions (store), le-logement.
2. Retrait des bacs : `lib/trash-bins.ts`, `TrashBinsEditor`, normalisation, API, requêtes, types, le-logement, guide privé, guide-demo ; `trash_info` retiré de l'API / types.
3. Tests : suppression des tests des bacs, mise à jour des tests touchés, nouveaux tests 077 (API ignore, guide sans message/bacs).
4. Liste `/dashboard/lodgings` en cartes ; libellés Guide / Logement ; surtitre « Logement » sur /showcase.
5. Page Guide : sections numérotées + sommaire fixe, barre d'état (modifié / enregistré), confirmation avant de quitter.
6. Traçabilité, suite complète, build.
