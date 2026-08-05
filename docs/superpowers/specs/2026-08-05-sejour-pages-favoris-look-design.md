# Pages du séjour au look « favoris » (dans le cadre guide)

Date : 2026-08-05

## Contexte

Depuis le menu burger du séjour ([PublicMenu](../../../src/features/city-guide/components/PublicMenu.tsx)),
les liens « Tous nos logements » (`/logements`) et « Blog » (`/blog`) sortent vers
le **site marketing** (`MarketingShell`), car [proxy.ts](../../../src/proxy.ts) les
classe en routes marketing. Seule la page contact (`/guide/[ville]/contact`) reste
déjà dans le cadre guide.

## Objectif

Afficher, **en contexte séjour**, des versions de ces pages **dans le cadre guide**
(430px, header PublicMenu + PublicBottomNav) au **look « favoris »** (grille bento,
cf. [GuideFavoritesPage](../../../src/features/guide-app/components/GuideFavoritesPage.tsx)),
**sans modifier** les pages publiques marketing `/logements` et `/blog`.

## Décisions actées

- **Portée** : versions séjour dédiées, dans le cadre guide. Le site marketing
  public reste inchangé.
- **Logements** : afficher **tous les logements, toutes villes** (liste publique globale).
- **Blog** : liste des articles publiés.
- **Contact** : déjà dans le cadre ; restyler au même esprit.

## À confirmer avant implémentation

1. **Référence visuelle exacte** : « look favoris » = la grille bento de
   `GuideFavoritesPage` (cartes image + overlay, comme les coups de cœur) ?
2. **Routage** : nouvelles routes séjour (ex. `/sejour/logements`, `/sejour/blog`)
   vers lesquelles pointe le burger, OU réécriture conditionnelle des pages
   existantes selon le contexte séjour ? (Impacte proxy.ts et le burger.)
3. **Contact façon favoris** : un formulaire ne se met pas en bento — préciser
   ce que « look favoris » veut dire pour le contact (cadre + cartes sombres,
   en-tête façon guide, mais formulaire conservé ?).

## Plan d'implémentation (page par page)

1. **Logements séjour** (référence) — page dans le cadre guide, grille bento des
   logements (adapter `GuideFavoriteBentoCard` ou créer une carte logement
   équivalente). Le burger pointe vers cette page. Validation utilisateur.
2. **Blog séjour** — même patron, cartes d'articles.
3. **Contact séjour** — restylage dans le cadre guide.

Chaque page : TDD (rendu des cartes + libellés), types verts, revue visuelle.
