# Traceability Matrix — StayLocal MVP 1

> Ce document fait le lien entre chaque critère d'acceptation (spec),
> le fichier source correspondant, et le fichier de test.
> Il doit être mis à jour après chaque implémentation.

---

## Légende

| Statut | Signification |
|---|---|
| ⬜ not started | Spec approuvée, code non démarré |
| 🔵 in progress | Code en cours |
| ✅ done | Code + tests livrés |
| ❌ blocked | Bloqué (open question non résolue) |

---

## 001 — City Guide

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Scan QR → LCP < 3s sur 4G (Lighthouse Mobile) | `src/app/(public)/guide/[city-slug]/page.tsx` | `tests/e2e/city-guide.AC-01-01.lcp-under-3s.test.ts` | ✅ done |
| AC-01-02 | Slug inexistant → 404 avec lien retour | `src/app/(public)/guide/[city-slug]/not-found.tsx`<br>`src/app/api/cities/[slug]/route.ts` | `tests/contract/city-guide.AC-01-02.slug-not-found-404.test.ts`<br>`tests/e2e/city-guide.AC-01-01.lcp-under-3s.test.ts` | ✅ done |
| AC-01-03 | Nom ville + catégories disponibles affichés | `src/app/(public)/guide/[city-slug]/page.tsx` | `tests/integration/city-guide.AC-01-03.guide-page-renders-categories.test.tsx` | ✅ done |
| AC-02-01 | Saisie ville valide → redirection guide | `src/features/city-guide/components/CitySearchInput.tsx` | `tests/integration/city-guide.AC-02-01.city-search-redirect.test.tsx` | ✅ done |
| AC-02-02 | Saisie sans résultat → message clair | `src/features/city-guide/components/CitySearchInput.tsx` | `tests/unit/city-guide.AC-02-02.no-result-message.test.tsx` | ✅ done |
| AC-02-03 | Autocomplétion dès 3 chars, max 10, accent-insensitive | `src/app/api/cities/search/route.ts`<br>`src/features/city-guide/queries/cities.ts`<br>`src/features/city-guide/components/CitySearchInput.tsx` | `tests/unit/city-guide.AC-02-03.autocomplete-logic.test.ts`<br>`tests/unit/city-guide.AC-02-02.no-result-message.test.tsx` | ✅ done |
| AC-03-01 | Seules catégories avec POI actif visibles (absentes du DOM) | `src/features/city-guide/components/CategoryRow.tsx`<br>`src/features/city-guide/queries/cities.ts` | `tests/unit/city-guide.AC-03-01.categories-filter.test.tsx` | ✅ done |
| AC-03-02 | Icône (slug Lucide) + nom + poi_count par catégorie | `src/features/city-guide/components/CategoryRow.tsx` | `tests/unit/city-guide.AC-03-01.categories-filter.test.tsx`<br>`tests/e2e/city-guide.AC-03-03.mobile-375px.test.ts` | ✅ done |
| AC-03-03 | Rendu lisible sur 375px, pas de scroll horizontal | `src/app/(public)/layout.tsx` | `tests/e2e/city-guide.AC-03-03.mobile-375px.test.ts` | ✅ done |
| AC-03-04 | City sans POI → HTTP 200 + empty state (pas de 404) | `src/app/(public)/guide/[city-slug]/page.tsx`<br>`src/app/api/cities/[slug]/route.ts` | `tests/contract/city-guide.AC-03-04.empty-city-200.test.ts`<br>`tests/integration/city-guide.AC-01-03.guide-page-renders-categories.test.tsx` | ✅ done |

---

## 002 — Categories

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Seules catégories avec POI affichées | `src/features/categories/components/CategoryGrid.tsx`<br>`src/features/categories/queries/categories.ts`<br>`src/app/api/cities/[slug]/categories/route.ts` | `tests/unit/categories.AC-01-01.category-grid.test.tsx`<br>`tests/contract/categories.AC-01-01.category-list-api.test.ts` | ✅ done |
| AC-01-02 | Catégorie vide absente du DOM | `src/features/categories/components/CategoryGrid.tsx` | `tests/unit/categories.AC-01-01.category-grid.test.tsx` | ✅ done |
| AC-01-03 | Icône + nom + count visibles | `src/features/categories/components/CategoryGrid.tsx` | `tests/integration/categories.AC-01-03.category-grid-renders.test.tsx` | ✅ done |
| AC-02-01 | Clic → redirection category page | `src/app/(public)/guide/[city-slug]/[category-slug]/page.tsx`<br>`src/app/api/cities/[slug]/categories/[category-slug]/route.ts` | `tests/e2e/categories.AC-02-01.category-redirect.test.ts`<br>`tests/contract/categories.AC-02-01.category-detail-api.test.ts` | ✅ done |
| AC-02-02 | Sous-catégories affichées comme filtres | `src/features/categories/components/SubCategoryFilter.tsx` | `tests/integration/categories.AC-02-02.subcategory-filters.test.tsx` | ✅ done |
| AC-03-01 | Filtre sous-catégorie fonctionne | `src/features/categories/queries/categories.ts`<br>`src/app/(public)/guide/[city-slug]/[category-slug]/page.tsx` | `tests/e2e/categories.AC-03-01-03-02.subcategory-filter.test.ts` | ✅ done |
| AC-03-02 | Désélection filtre → tous POI | `src/features/categories/components/SubCategoryFilter.tsx` | `tests/e2e/categories.AC-03-01-03-02.subcategory-filter.test.ts` | ✅ done |

---

## 003 — POI List

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Tri par distance par défaut | `src/features/categories/queries/poi-cards.ts`<br>`src/app/(public)/guide/[city-slug]/[category-slug]/page.tsx` | `tests/unit/categories.AC-01-01-02-01.poi-sorting.test.ts` | ✅ done |
| AC-01-02 | Card affiche tous les champs requis | `src/features/categories/components/PoiCard.tsx` | `tests/integration/categories.AC-01-02.poi-card-renders.test.tsx` | ✅ done |
| AC-01-03 | POI fermé visuellement différencié | `src/features/categories/components/PoiCard.tsx` | `tests/unit/categories.AC-01-03.poi-closed-badge.test.tsx` | ✅ done |
| AC-02-01 | Tri par note fonctionne | `src/features/categories/queries/poi-cards.ts`<br>`src/features/categories/components/SortControl.tsx` | `tests/unit/categories.AC-01-01-02-01.poi-sorting.test.ts` | ✅ done |
| AC-02-02 | Filtre sous-catégorie fonctionne | `src/features/categories/queries/poi-cards.ts`<br>`src/app/api/cities/[slug]/categories/[category-slug]/pois/route.ts` | `tests/contract/categories.AC-poi-list-api.test.ts`<br>`tests/e2e/categories.AC-03-01-03-02.subcategory-filter.test.ts` | ✅ done |
| AC-02-03 | Suppression filtre → reset liste | `src/features/categories/components/SubCategoryFilter.tsx` | `tests/e2e/categories.AC-03-01-03-02.subcategory-filter.test.ts` | ✅ done |
| AC-03-01 | Clic card → redirection fiche POI | `src/features/categories/components/PoiCard.tsx` | `tests/e2e/categories.AC-03-01.poi-navigation.test.ts` | ✅ done |

---

## 004 — POI Detail

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Tous champs visibles si présents | - | - | ⬜ |
| AC-01-02 | Bouton Appeler masqué si pas de tel | - | - | ⬜ |
| AC-01-03 | Bouton Site masqué si pas de site | - | - | ⬜ |
| AC-01-04 | Badge Ouvert avec heure fermeture | - | - | ⬜ |
| AC-02-01 | Bouton Appeler → `tel:` link | - | - | ⬜ |
| AC-02-02 | Bouton Itinéraire → Mapbox | - | - | ⬜ |
| AC-02-03 | Bouton Site → nouvel onglet | - | - | ⬜ |
| AC-02-04 | Bouton Partager → Web Share API | - | - | ⬜ |
| AC-03-01 | Bloc randonnée si hiking_detail | - | - | ⬜ |
| AC-03-02 | Tracé Mapbox si gpx_url | - | - | ⬜ |

---

## 005 — Map

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Carte avec markers au clic | - | - | ⬜ |
| AC-01-02 | Carte centrée sur City | - | - | ⬜ |
| AC-01-03 | Clustering si markers proches | - | - | ⬜ |
| AC-02-01 | Clic marker → popup | - | - | ⬜ |
| AC-02-02 | Clic "Voir la fiche" → fiche POI | - | - | ⬜ |
| AC-02-03 | Clic hors popup → fermeture | - | - | ⬜ |
| AC-03-01 | Mini-carte visible dans fiche | - | - | ⬜ |
| AC-03-02 | Mini-carte non-interactive | - | - | ⬜ |

---

## 006 — QR Code

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Scan → `/guide/[city-slug]` | - | - | ⬜ |
| AC-01-02 | Pas d'étape intermédiaire | - | - | ⬜ |
| AC-01-03 | Rendu iOS et Android correct | - | - | ⬜ |
| AC-02-01 | QR code PNG avec bonne URL | - | - | ⬜ |
| AC-02-02 | PNG 1000×1000px minimum | - | - | ⬜ |
| AC-02-03 | Lisible imprimé 10×10cm | - | - | ⬜ |

---

## 007 — Gemini Fetch

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Fetch si cache absent ou expiré | - | - | ⬜ |
| AC-01-02 | POI structurés et persistés | - | - | ⬜ |
| AC-01-03 | Cache valide → pas de fetch | - | - | ⬜ |
| AC-02-01 | Établissements fermés exclus | - | - | ⬜ |
| AC-02-02 | Doublons dédupliqués | - | - | ⬜ |
| AC-02-03 | POI sans nom/adresse exclus | - | - | ⬜ |
| AC-02-04 | POI hors périmètre exclus | - | - | ⬜ |
| AC-03-01 | Cache expiré → nouveau fetch | - | - | ⬜ |
| AC-03-02 | Pas de double fetch simultané | - | - | ⬜ |
| AC-03-03 | Fetch échoué → cache expiré servi | - | - | ⬜ |
