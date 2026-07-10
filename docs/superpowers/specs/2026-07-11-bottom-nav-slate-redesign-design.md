# Refonte nav bottom — maquette « pill slate-800 »

Date : 2026-07-11
Fichier : `src/features/city-guide/components/PublicBottomNav.tsx` (+ son test)

## Objectif

Refondre la barre de navigation basse pour coller à la maquette : barre blanche
en pilule (stadium), item actif en pilule sombre `slate-800`, items inactifs en
gris. S'applique aux **deux modes** (logement et anonyme).

## Décisions validées

1. Le cœur « Coup de cœur » devient **gris contour** (plus de rouge plein), il
   suit la couleur de l'item comme les autres icônes.
2. Le **bouton GPS est conservé** et restylé, mais **garde ses couleurs d'état**
   (vert activé / rouge inactif / orange chargement) ; pas de pilule active.
3. Refonte appliquée aux **deux modes**.

## Design

**Barre extérieure**
- `rounded-full` (au lieu de `rounded-[28px]`), `bg-white`, ombre douce, bord fin.
- `px-3 py-2.5`, `flex items-center justify-around`.
- Conservés : `fixed bottom-8 left-1/2 -translate-x-1/2 z-50`, `max-w-[390px]`,
  scroll-hide (`isScrolling`), `immersive-hide`, `surfaceClassName`.

**NavItem**
- Base : `flex flex-col items-center justify-center gap-1.5 rounded-full transition-colors`.
- Actif : `bg-slate-800 text-white px-5 py-2.5`.
- Inactif : `text-[#6f7480] hover:text-[#4b5563] px-3 py-2`.
- Icône : `w-6 h-6`, couleur héritée (`currentColor`) — retirer les couleurs
  explicites, notamment `text-red-500 fill-red-500` du cœur.
- Label : `text-[9px] font-bold uppercase tracking-wider leading-[1.1]`, multi-lignes
  via `\n`.

**GeoNavButton**
- Même structure (icône `w-6 h-6` + label), mais conserve `colorClassName`
  (états vert/rouge/orange). Pas de pilule active.

## Tests (TDD)

`tests/unit/public-bottom-nav.test.tsx` :
- Remplacer les assertions `text-pink-600` (actif) par le nouvel état : l'item
  actif porte `bg-slate-800` (et `text-white`) ; l'inactif porte `text-[#6f7480]`.
- Conserver les autres assertions (présence des items, hrefs, mode).

## Hors périmètre

Aucune autre page ; logique de navigation (items, modes, géoloc) inchangée.
