# Bacs à poubelles structurés (carte « Poubelles » de /le-logement)

**Date :** 2026-07-03
**Statut :** Design validé — prêt pour implémentation
**Surface :** Page invité `/le-logement`, carte « Poubelles » (section fixe `trash`)

## Contexte & objectif

Aujourd'hui la carte « Poubelles » affiche un champ **texte libre markdown** (`trash_info`) que
l'owner rédige à la main (ex. « POUBELLES JAUNES / Tous les déchets recyclables… »). Le code ne
comprend pas la structure, donc impossible d'afficher des repères visuels.

Objectif : remplacer ce texte libre par une **liste de bacs structurés**. Chaque bac affiche un
**gros icône poubelle coloré** + un libellé + une description saisie par l'owner. Le tri sélectif
français ayant un jeu de couleurs standard, on propose une **liste prédéfinie**.

## Décisions de cadrage (brainstorming)

| Question | Décision |
|---|---|
| Jeu de bacs | **Liste prédéfinie française** (pas de bac personnalisé) |
| Champ texte libre `trash_info` | **Remplacé** par les bacs ; colonne conservée en base mais non éditée/affichée |
| Localisation Google Maps (`trash_location`) | **Conservée** |
| Mise en page front | **Icône coloré à gauche + libellé & description à droite** |
| Stockage | **Colonne JSON** (Option A) |

## Catalogue de bacs (preset partagé)

Fichier `src/features/guide-customization/lib/trash-bins.ts`, réutilisé backoffice + front.
Cinq bacs, chacun : `type` (clé stable), `label`, `colorClass` (teinte de l'icône `Trash2`).

| `type` | `label` | Couleur (icône `Trash2`) |
|---|---|---|
| `jaune` | Poubelle jaune | jaune (ex. `text-yellow-400`) |
| `verte` | Poubelle verte | vert (`text-green-600`) |
| `bordeaux` | Poubelle bordeaux | rouge foncé (`text-red-900`) |
| `marron` | Poubelle marron | marron (`text-amber-800`) |
| `bleue` | Poubelle bleue | bleu (`text-blue-500`) |

`TRASH_BIN_TYPES` = tuple des types ; helper `getTrashBin(type)` renvoie l'entrée ou `undefined`.

## Données

Colonne **`trash_bins Json?`** sur `LodgingCustomization`. Contenu : tableau ordonné
`Array<{ type: TrashBinType; description: string }>`. Migration additive (`jsonb` nullable),
non destructive. `trash_info` conservé en base mais plus utilisé.

## Front — `/le-logement`

La carte « Poubelles » est rendue par `PracticalCard`. On ajoute un **cas spécial `key === 'trash'`**
qui, au lieu du markdown, rend la **liste des bacs** : pour chaque bac, une ligne
`[gros icône coloré]  [libellé + description]`. Le bouton Google Maps (`trash_location`) reste.

- La section `trash` de `buildSections` porte désormais les bacs (`bins`) au lieu de `value` markdown.
- `hasValue` du trash = au moins un bac renseigné **ou** une localisation Maps.
- Si aucun bac et pas de Maps → carte masquée (comportement actuel préservé).

## Backoffice — `CustomizationForm`

On remplace le `textarea` « Poubelles » (`trash_info`) par un composant **`TrashBinsEditor`** :

- Les 5 bacs presets affichés en **interrupteurs** (activer/désactiver un bac).
- Chaque bac activé ouvre un champ **description** (texte court).
- L'ordre suit l'ordre du preset.
- Le champ **localisation Maps** (`trash_location`) reste juste en dessous, inchangé.

## API / validation / types

- `customizationSchema` (route customization) : ajout `trash_bins` = `array` de
  `{ type: enum(TRASH_BIN_TYPES), description: string().trim().min(1).max(500) }`. Retrait de
  `trash_info` de la saisie (on ne le lit plus depuis le formulaire).
- Normalisation (`validation.ts`) : `normalizeTrashBins` — drop les bacs de type inconnu ou à
  description vide, dédoublonne par type (garde le premier), préserve l'ordre.
- `types.ts` : `TrashBinInput`/`TrashBinResponse`, ajout à `LodgingCustomizationInput`/`Response`.
- `queries/customization.ts` : lecture (`select trash_bins`) et persistance (`trash_bins` dans
  l'upsert `update`/`create`).

## Découpage en unités

| Unité | Responsabilité | Dépend de |
|---|---|---|
| `trash-bins.ts` | Catalogue preset (types, labels, couleurs) + helpers | — |
| `normalizeTrashBins` | Nettoyage/validation de la liste | `trash-bins.ts` |
| Migration + schema | Colonne `trash_bins` | — |
| API + types + query | Accepter/normaliser/persister/lire | `trash-bins.ts`, schema |
| `TrashBinsEditor` (backoffice) | Saisie owner (toggle + description) | API, `trash-bins.ts` |
| Rendu front (PracticalCard cas trash) | Affichage bacs (icônes colorés + textes) | `trash-bins.ts` |

## Tests (TDD)

- **Unitaires :** catalogue (`getTrashBin`, types) ; `normalizeTrashBins` (types inconnus, vides,
  doublons, ordre) ; persistance query (upsert reçoit `trash_bins`).
- **Composant :** `TrashBinsEditor` (activer un bac → champ description apparaît) ; rendu front d'un
  bac (icône coloré + libellé + description).
- **Contrat :** l'API accepte `trash_bins` valides et rejette un `type` hors preset.

## Migration

Colonne `trash_bins jsonb` nullable, additive. Supabase actif → `npx prisma migrate deploy`.

## Hors scope

- Bacs personnalisés (couleur/libellé libres).
- Migration automatique de l'ancien texte `trash_info` vers des bacs (les données texte existantes
  ne sont pas converties).
- Icônes/pictogrammes dédiés par bac (on teinte l'icône `Trash2` unique).
- Réordonnancement manuel des bacs par l'owner (ordre = preset).
