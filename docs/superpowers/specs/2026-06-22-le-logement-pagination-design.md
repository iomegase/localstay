# Page `/le-logement` — pagination glissable (2 pages) — Design

**Date:** 2026-06-22
**Statut:** approuvé (brainstorming), à planifier

## Objectif

Réorganiser la page publique `/le-logement` en deux pages glissables horizontalement (style « stories ») :

- **Page 1 — « Infos pratiques »** : les sections fixes actuelles (adresse, Wi-Fi, parking, équipements, départ, poubelles, règlement, urgences, services), dans l'ordre actuel inchangé.
- **Page 2 — « À découvrir »** : les blocs personnalisés (`LodgingPracticalBlock`) de l'hôte.

Le swipe horizontal navigue entre les deux ; des dots de pagination indiquent la page active. La séparation en deux pages **est** la « réorganisation » demandée — l'ordre des sections fixes ne change pas.

## Contraintes & contexte

- Coquille publique mobile-first (`max-w-[430px]`), header collant + barre de nav flottante (`PublicBottomNav`, mode `lodging` : Bienvenue · Logement · Vos favoris · Guide). Inchangés.
- `/le-logement/page.tsx` est un **Server Component** qui fait 2 requêtes Prisma (`lodgingCustomization` + `lodgingPracticalBlock`). **Data flow inchangé.**
- Stack : Next 16 (App Router, RSC), React 19, TypeScript, Tailwind 3.4, Jest + Testing Library. `framer-motion` et `dnd-kit` présents mais **non utilisés** ici.

## Mécanisme retenu : CSS scroll-snap natif

Conteneur horizontal `overflow-x-auto snap-x snap-mandatory` contenant deux panneaux pleine largeur (`w-full shrink-0 snap-start`). Le swipe utilise le défilement natif (inertie mobile) ; le scroll vertical à l'intérieur de chaque panneau reste natif et sans conflit d'axe. Choisi contre framer-motion `drag` (conflit axe vertical, surdimensionné) et contre une lib carousel (YAGNI pour 2 pages).

## Architecture & composants

### `LodgingPager` (nouveau, `'use client'`)
`src/features/public-menu/components/LodgingPager.tsx`

```ts
interface LodgingPagerProps {
  titles: [string, string]      // ['Infos pratiques', 'À découvrir']
  children: ReactNode           // exactement 2 panneaux
}
```

Responsabilités :
- Affiche le **titre de la page active** + les **dots** au-dessus de la zone glissable.
- Rend le conteneur scroll-snap horizontal et place chaque enfant dans un panneau `w-full shrink-0 snap-start` qui scrolle verticalement.
- Suit la page active via `IntersectionObserver` (seuil 0.5) sur les panneaux → met à jour le titre + `aria-current` du dot.
- Tap sur un dot → `scrollIntoView({ behavior: 'smooth', inline: 'start' })` vers le panneau correspondant.

A11y : conteneur `role="group"` + `aria-roledescription="carrousel"` ; chaque dot est un `<button>` avec `aria-label="Aller à {titre}"` et `aria-current` quand actif.

### `LeLogementPage` (Server Component, modifié)
`src/app/(public)/le-logement/page.tsx`

- Conserve les requêtes Prisma, `buildSections`, `hasContent`.
- Branche de rendu :
  - **`!hasContent`** → état vide global actuel (inchangé).
  - **`hasContent` && `practicalBlocks.length === 0`** → rendu actuel (liste verticale unique, **pas** de `LodgingPager`, pas de dots, pas de swipe). Aucune régression pour les hôtes sans blocs.
  - **`hasContent` && `practicalBlocks.length > 0`** → header fixe puis `LodgingPager` à 2 panneaux.

```
<div>
  <Header/>                       ← LE LOGEMENT / nom / ville (fixe)
  <LodgingPager titles={['Infos pratiques','À découvrir']}>
     <section>…sections fixes…</section>   ← panneau 1
     <section>…blocs perso…</section>      ← panneau 2
  </LodgingPager>
</div>
```

### Composants présentationnels
- `PracticalCard` (existant) reste pour les sections fixes.
- Le rendu d'un bloc perso (icône + titre + photo + markdown) est extrait en un petit composant présentationnel réutilisé dans le panneau 2 (pas de logique, pur affichage).

## Comportement & cas limites

- **Page 1 sans info fixe mais avec blocs** : le panneau 1 affiche un état vide léger (« Aucune info pratique renseignée ») au lieu d'un panneau blanc ; le panneau 2 montre les blocs.
- **Hauteur** : les deux panneaux partagent la zone glissable ; `min-height` raisonnable pour éviter un saut visuel lors du swipe quand les contenus ont des hauteurs différentes.
- **Dots** : reflètent la page visible (IntersectionObserver) ; tap = scroll fluide.

## Tests

- **`LodgingPager` (jsdom)** : rend 2 panneaux + 2 dots avec les bons titres ; tap sur le dot 2 appelle `scrollIntoView` du 2e panneau ; `aria-current` suit la page active. `IntersectionObserver` mocké.
- **Intégration `/le-logement`** :
  - avec ≥1 bloc → pager présent (2 dots, titres « Infos pratiques » / « À découvrir »), blocs rendus dans le 2e panneau ;
  - sans bloc → pas de pager, rendu liste simple (non-régression du test existant `le-logement.practical-blocks.test.tsx`) ;
  - état vide global inchangé.
- Pas de nouveau test DB (data flow inchangé).

## Hors périmètre (YAGNI)

- Pas de réordonnancement ni de regroupement des sections fixes.
- Pas plus de 2 pages (pas de page par bloc, pas de pages thématiques).
- Pas d'animation custom (scroll-snap natif suffit).
- Aucune modification de l'éditeur owner ni du modèle de données.
