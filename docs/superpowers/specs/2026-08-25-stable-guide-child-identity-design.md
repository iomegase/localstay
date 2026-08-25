# Identité stable des contenus du guide privé

**Date :** 2026-08-25  
**Statut :** validé par le Product Owner  
**Spec concernée :** 012 — Guide Customization

## Problème

Chaque sauvegarde archive actuellement tous les `LodgingPracticalBlock` et
`LodgingArrivalInstruction`, puis recrée toute la liste. Une simple correction
de texte change donc les UUID et produit des lignes archivées inutiles.

## Décision

- Un élément existant conserve son UUID et est mis à jour dans la transaction.
- Un élément sans UUID persistant est créé une seule fois.
- Un élément actif absent du payload est le seul à recevoir `deleted_at`.
- Un UUID fourni doit désigner un élément actif du même Lodging ; sinon la
  sauvegarde est refusée.
- Les identifiants temporaires d'interface utilisent le préfixe `tmp-` et ne
  sont jamais interprétés comme des UUID persistants.
- Aucun hard delete et aucune migration Prisma ne sont nécessaires.

## Flux

Le serveur normalise les listes en conservant les UUID persistants. Dans la
transaction, il relit les enfants actifs du Lodging, valide les UUID reçus,
met à jour les lignes conservées, crée les nouvelles lignes, puis soft-delete
uniquement les lignes actives qui ne figurent plus dans le payload. La réponse
relit ensuite les listes actives et renvoie leurs UUID définitifs au formulaire.

## Erreurs et sécurité

Les UUID dupliqués, inconnus, archivés ou appartenant à un autre Lodging sont
refusés avec une erreur de validation métier. Aucune ligne d'un autre Lodging
ne peut être mise à jour ou restaurée.

## Vérification

Les tests couvrent la conservation d'UUID, la création ciblée, l'archivage
ciblé, le rejet d'UUID étranger et les identifiants temporaires du dashboard.
