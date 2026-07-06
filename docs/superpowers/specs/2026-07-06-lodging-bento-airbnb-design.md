# Redesign cartes bento « guide du logement » façon Airbnb

Date : 2026-07-06
Fichier concerné : `src/app/(public)/le-logement/page.tsx`

## Objectif

Aligner le design (CSS uniquement, pas le contenu) des cartes bento de la page
`/le-logement` sur le style Airbnb : cartes blanches épurées, bord fin, ombre
discrète, tuiles d'icône gris clair, typographie neutre. Supprimer la couleur
`slate` en fond de carte.

## Décisions validées

1. **Urgences** garde son fond rouge plein (`themes.red`). Seul `slate` disparaît.
2. **Chrome** : bord fin `#EBEBEB` + ombre très discrète, suppression des grosses
   ombres portées (`shadow-[0_10px_28px_rgba(0,0,0,0.10)]`) et du `hover:scale`.
3. **Icônes** dans une tuile carrée `bg-[#F7F7F7]` arrondie.

## Changements

### Thèmes (`themes` record)
- Supprimer le thème `slate`.
- `light` = thème « Airbnb » :
  - `bg: 'bg-white'`
  - nouveau token `border: 'border border-[#EBEBEB]'`
  - nouveau token `shadow: 'shadow-[0_1px_2px_rgba(0,0,0,0.06)]'`
  - `text: 'text-[#222222]'`, `muted: 'text-[#717171]'`
  - `iconTileBg: 'bg-[#F7F7F7]'`, `iconColor: 'text-[#222222]'`
  - `actionBg: 'bg-[#F7F7F7]'`, `actionIcon: 'text-[#222222]'`
- `red` (Urgences) conservé, filled :
  - pas de bord, `shadow` discrète conservée
  - tuile d'icône `bg-white/15`, icône blanche
  - `actionBg: 'bg-white'`, `actionIcon: 'text-red-500'`
- Toutes les références `themes.slate` dans `buildSections` (Adresse, Parking,
  Règlement) → `themes.light`.
- L'alternance des blocs recommandations `index % 2 === 0 ? light : slate`
  → toujours `themes.light`.

### Chrome commun (`PracticalCard` + `PracticalBlockCard`)
- Rayon harmonisé `rounded-[24px]` (au lieu de 32/40px).
- Classes carte : `${theme.bg} ${theme.text} ${theme.border ?? ''} ${theme.shadow}`.
- Retirer `transition-transform hover:scale-[1.01|1.02]`, ajouter
  `transition-colors hover:border-[#DDDDDD]` (sans effet sur le rouge, pas de bord).

### Icône (tuile Airbnb)
- Remplacer l'icône nue par :
  `<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.iconTileBg}"><icon className="... ${theme.iconColor}" /></div>`
- Fonctionne pour `PracticalCard` (icônes lucide) et `PracticalBlockCard`
  (`CategoryIcon`).
- Variante carrée (`isSquare`, Urgences) : tuile plus petite acceptable, garder
  `h-10 w-10` si l'espace manque.

### Typographie
- Titres : `font-semibold` (600) au lieu de `font-bold` (700), couleur `#222222`.
- Muted/secondaire : `#717171`.
- Pill « Google Maps » : `bg-[#F7F7F7] text-[#222222]` sur cartes claires.

## Hors périmètre
- Aucune modification du contenu, des requêtes Prisma, du pager, du markdown,
  des ratios d'image, ni des autres pages.

## Vérification
- Lancer l'app, ouvrir `/le-logement` (mode logement actif) et vérifier
  visuellement : cartes blanches à bord fin, icônes en tuile grise, Urgences
  toujours rouge, plus aucune carte slate/bleu-gris.
