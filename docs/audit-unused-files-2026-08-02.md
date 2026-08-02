# Audit — Fichiers non utilisés (application)

**Date :** 2026-08-02
**Périmètre :** code applicatif uniquement (`src/`). `node_modules/` et tout ce qui est listé dans `.gitignore` sont exclus.
**Méthode :** analyse statique avec `knip@5` (plugin Next.js App Router, gère les imports dynamiques `next/dynamic`), puis vérification manuelle de chaque résultat par `git grep` des imports réels (app + tests).

---

## Résumé

13 fichiers `.tsx` de l'application ne sont **importés nulle part par le code applicatif**.

| Catégorie | Nb |
|---|---|
| Code mort net (0 référence) | 10 |
| Code mort applicatif, référencé seulement par un `jest.mock` obsolète | 2 |
| Désactivé volontairement (commenté, à réactiver) | 1 |
| **Total** | **13** |

Aucun fichier de route (`page.tsx` / `layout.tsx` / `route.ts`) n'est concerné. Aucun import dynamique (`next/dynamic`) ne pointe vers ces fichiers.

---

## 1. Code mort net — aucune référence (10)

Ces fichiers ne sont importés ni par l'app ni par les tests. Suppression sans impact.

| Fichier | Lignes | Dernier commit |
|---|---|---|
| [PhotoCarousel.tsx](../src/features/categories/components/PhotoCarousel.tsx) | 33 | 2026-07-05 |
| [CategoryRowSkeleton.tsx](../src/features/city-guide/components/CategoryRowSkeleton.tsx) | 12 | 2026-05-21 |
| [GuideFeaturedPoiCard.tsx](../src/features/guide-app/components/GuideFeaturedPoiCard.tsx) | 48 | 2026-07-29 |
| [GuideLodgingGallery.tsx](../src/features/guide-app/components/GuideLodgingGallery.tsx) | 67 | 2026-07-29 |
| [LodgingBookingCta.tsx](../src/features/lodging-showcase/components/LodgingBookingCta.tsx) | 54 | 2026-07-05 |
| [LodgingExcerpt.tsx](../src/features/lodging-showcase/components/LodgingExcerpt.tsx) | 8 | 2026-07-05 |
| [QrScannerButton.tsx](../src/features/public-menu/components/QrScannerButton.tsx) | 129 | 2026-06-08 |
| [ui/badge.tsx](../src/shared/components/ui/badge.tsx) | 36 | 2026-05-23 |
| [ui/separator.tsx](../src/shared/components/ui/separator.tsx) | 31 | 2026-05-23 |
| [ui/table.tsx](../src/shared/components/ui/table.tsx) | 120 | 2026-05-23 |

**Notes :**
- `badge.tsx`, `separator.tsx`, `table.tsx` sont des primitives **shadcn/ui**. Si vous conservez shadcn comme bibliothèque de composants, elles peuvent être gardées volontairement. À noter : `separator.tsx` est le seul consommateur de la dépendance `@radix-ui/react-separator` → sa suppression rendrait ce paquet inutile.
- `QrScannerButton.tsx` (129 lignes) dépend de `jsqr` ; s'il est supprimé, vérifier si `jsqr` sert encore ailleurs.

## 2. Code mort applicatif — seul un `jest.mock` obsolète le référence (2)

Le composant testé n'importe plus ces fichiers ; seul un `jest.mock(...)` orphelin dans un test les nomme. À supprimer avec le mock associé.

| Fichier | Lignes | Mock orphelin |
|---|---|---|
| [FullMap.tsx](../src/features/categories/components/FullMap.tsx) | 157 | `tests/unit/categories.AC-nearby-section.test.tsx:11` (le SUT `CategoryViewWrapper` n'importe pas `FullMap`) |
| [LeaveStayButton.tsx](../src/features/public-menu/components/LeaveStayButton.tsx) | 50 | `tests/integration/contact-messages.contextual-public-page.test.tsx:50` |

## 3. Désactivé volontairement — à réactiver (1)

Ne pas supprimer sans décision produit : marqué explicitement « à réactiver ».

| Fichier | Lignes | Contexte |
|---|---|---|
| [GuideSearchInput.tsx](../src/features/city-guide/components/GuideSearchInput.tsx) | 130 | Import + usage commentés dans `src/app/(public)/guide/[city-slug]/page.tsx:9,81-85` — commentaire : « réactiver lors de l'optimisation de la recherche ». Dépend de `jsqr` également. |

---

## Hors périmètre (non « application »)

`knip` a aussi signalé des fichiers hors `src/` que vous avez demandé d'ignorer, listés ici pour information seulement (non inclus dans l'audit applicatif) : `references/mystay-maquette/**` (maquette de référence complète), `docs/**` (mockups/guides), et plusieurs `scripts/*.ts` (scripts one-shot exécutés manuellement, ex. `reset-user-password.ts`, `create-dev-users.ts` — normaux à conserver).

---

## Reproduire l'audit

```bash
npx --yes knip@5 --include files --no-progress
```
