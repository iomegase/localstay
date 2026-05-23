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
| AC-01-01 | Tous champs visibles si présents | `src/features/categories/components/PoiDetailBody.tsx` | `tests/integration/categories.AC-01-01.poi-detail-renders.test.tsx` | ✅ done |
| AC-01-02 | Bouton Appeler masqué si pas de tel | `src/features/categories/components/ActionButtons.tsx` | `tests/unit/categories.AC-01-02-03.action-buttons.test.tsx` | ✅ done |
| AC-01-03 | Bouton Site masqué si pas de site | `src/features/categories/components/ActionButtons.tsx` | `tests/unit/categories.AC-01-02-03.action-buttons.test.tsx` | ✅ done |
| AC-01-04 | Badge Ouvert avec heure fermeture | `src/features/categories/components/HoursBlock.tsx` | `tests/unit/categories.AC-01-04.hours-block.test.tsx` | ✅ done |
| AC-02-01 | Bouton Appeler → `tel:` link | `src/features/categories/components/ActionButtons.tsx` | `tests/e2e/categories.AC-02-01-04.poi-actions.test.ts` | ✅ done |
| AC-02-02 | Bouton Itinéraire → Google Maps | `src/features/categories/components/ActionButtons.tsx` | `tests/e2e/categories.AC-02-01-04.poi-actions.test.ts` | ✅ done |
| AC-02-03 | Bouton Site → nouvel onglet | `src/features/categories/components/ActionButtons.tsx` | `tests/e2e/categories.AC-02-01-04.poi-actions.test.ts` | ✅ done |
| AC-02-04 | Bouton Partager → Web Share API | `src/features/categories/components/ActionButtons.tsx` | `tests/e2e/categories.AC-02-01-04.poi-actions.test.ts` | ✅ done |
| AC-03-01 | Bloc randonnée si hiking_detail | `src/features/categories/components/HikingBlock.tsx` | `tests/unit/categories.AC-03-01.hiking-block.test.tsx`<br>`tests/integration/categories.AC-01-01.poi-detail-renders.test.tsx` | ✅ done |
| AC-03-02 | ~~Tracé Mapbox si gpx_url~~ | — | — | ⬜ → spec 005 |

---

## 005 — Map

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Carte avec markers au clic | `src/features/categories/components/FullMap.tsx`<br>`src/features/categories/components/CategoryViewWrapper.tsx` | `tests/e2e/categories.AC-map.test.ts` | ✅ done |
| AC-01-02 | Carte centrée sur City | `src/features/categories/lib/map-utils.ts` | `tests/unit/categories.map-utils.test.ts` | ✅ done |
| AC-01-03 | Clustering si markers proches | `src/features/categories/lib/map-utils.ts`<br>`src/features/categories/components/FullMap.tsx` | `tests/unit/categories.map-utils.test.ts` | ✅ done |
| AC-02-01 | Clic marker → popup | `src/features/categories/components/FullMap.tsx` | `tests/e2e/categories.AC-map.test.ts` | ✅ done |
| AC-02-02 | Clic "Voir la fiche" → fiche POI | `src/features/categories/components/FullMap.tsx` | `tests/e2e/categories.AC-map.test.ts` | ✅ done |
| AC-02-03 | Clic hors popup → fermeture | `src/features/categories/components/FullMap.tsx` | `tests/e2e/categories.AC-map.test.ts` | ✅ done |
| AC-03-01 | Mini-carte visible dans fiche | `src/features/categories/components/MiniMap.tsx`<br>`src/features/categories/components/PoiDetailBody.tsx` | `tests/integration/categories.AC-03-01.mini-map-in-detail.test.tsx` | ✅ done |
| AC-03-02 | Mini-carte non-interactive | `src/features/categories/components/MiniMap.tsx` | `tests/unit/categories.AC-03-02.mini-map.test.tsx` | ✅ done |

---

## 006 — QR Code

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Scan → `/guide/[city-slug]` | `src/app/(public)/guide/[city-slug]/page.tsx` | `tests/e2e/qr-code.AC-01-01-02.scan-redirect.test.ts` | ✅ done |
| AC-01-02 | Pas d'étape intermédiaire | `src/app/(public)/guide/[city-slug]/page.tsx` | `tests/e2e/qr-code.AC-01-01-02.scan-redirect.test.ts` | ✅ done |
| AC-01-03 | Rendu iOS et Android correct | — | — | ⬜ manual |
| AC-02-01 | QR code PNG avec bonne URL | `src/features/qr-code/services/generate-qr.ts`<br>`src/app/api/admin/cities/[slug]/qr-code/route.ts` | `tests/contract/qr-code.AC-02-01.api.test.ts` | ✅ done |
| AC-02-02 | PNG 1000×1000px minimum | `src/features/qr-code/services/generate-qr.ts` | `tests/unit/qr-code.AC-02-02.generate-qr.test.ts` | ✅ done |
| AC-02-03 | Lisible imprimé 10×10cm | — | — | ⬜ manual |

---

## 007 — Gemini Fetch

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Fetch déclenché si cache absent ou expiré | `src/app/(public)/guide/[city-slug]/[category-slug]/page.tsx`<br>`src/features/gemini-fetch/services/orchestrator.ts` | `tests/integration/gemini-fetch.AC-01-03.cache-flow.test.ts` | ✅ done |
| AC-01-02 | POI structurés et persistés en base | `src/features/gemini-fetch/services/poi-persister.ts`<br>`src/features/gemini-fetch/services/orchestrator.ts` | `tests/integration/gemini-fetch.AC-01-03.cache-flow.test.ts` | ✅ done |
| AC-01-03 | Cache valide → pas de fetch | `src/features/gemini-fetch/services/cache-manager.ts`<br>`src/features/gemini-fetch/services/orchestrator.ts` | `tests/integration/gemini-fetch.AC-01-03.cache-flow.test.ts` | ✅ done |
| AC-02-01 | Établissements fermés exclus | `src/features/gemini-fetch/services/poi-filter.ts` | `tests/unit/gemini-fetch.AC-02-01-04.poi-filter.test.ts` | ✅ done |
| AC-02-02 | Doublons dédupliqués | `src/features/gemini-fetch/services/poi-filter.ts` | `tests/unit/gemini-fetch.AC-02-01-04.poi-filter.test.ts` | ✅ done |
| AC-02-03 | POI sans nom ou adresse exclus | `src/features/gemini-fetch/services/poi-filter.ts` | `tests/unit/gemini-fetch.AC-02-01-04.poi-filter.test.ts` | ✅ done |
| AC-02-04 | POI hors périmètre exclus (via prompt radius) | `src/features/gemini-fetch/services/prompt-builder.ts` | `tests/unit/gemini-fetch.AC-02-01-04.poi-filter.test.ts` | ✅ done |
| AC-03-01 | Cache expiré → nouveau fetch déclenché | `src/features/gemini-fetch/services/orchestrator.ts` | `tests/integration/gemini-fetch.AC-01-03.cache-flow.test.ts` | ✅ done |
| AC-03-02 | Pas de double fetch simultané | `src/features/gemini-fetch/services/cache-manager.ts` | `tests/integration/gemini-fetch.AC-01-03.cache-flow.test.ts` | ✅ done |
| AC-03-03 | Fetch échoué → cache expiré servi | `src/features/gemini-fetch/services/orchestrator.ts` | `tests/integration/gemini-fetch.AC-01-03.cache-flow.test.ts` | ✅ done |

---

## 008 — Mapbox Geocoding

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | POI ≤ 15 km → zone primary | `src/features/categories/queries/poi-cards.ts` | `tests/unit/categories.AC-01-01-02-01.poi-sorting.test.ts` | ✅ done |
| AC-01-02 | POI 15–30 km → zone nearby | `src/features/categories/queries/poi-cards.ts` | `tests/unit/categories.AC-01-01-02-01.poi-sorting.test.ts` | ✅ done |
| AC-01-03 | POI > 30 km → rejeté, non affiché | `src/features/geocoding/services/geo-validator.ts` | `tests/unit/geocoding.AC-geo-validator.test.ts` | ✅ done |
| AC-nearby | Section "Aux alentours" visible si nearby.length > 0 | `src/features/categories/components/CategoryViewWrapper.tsx` | `tests/unit/categories.AC-nearby-section.test.tsx` | ✅ done |
| BR-01 | Geocodage via Mapbox (jamais Gemini) | `src/features/geocoding/services/geocode-runner.ts` | `tests/unit/geocoding.AC-geo-validator.test.ts` | ✅ done |
| BR-02 | Batch max 10 POI par appel | `src/features/geocoding/services/geocode-runner.ts` | `tests/unit/geocoding.AC-geo-validator.test.ts` | ✅ done |
| BR-03 | Fire-and-forget après Gemini Fetch | `src/app/api/internal/gemini-fetch/route.ts` | `tests/contract/geocoding.AC-api.test.ts` | ✅ done |
| BR-04 | Endpoint POST /api/internal/geocode-pois | `src/app/api/internal/geocode-pois/route.ts` | `tests/contract/geocoding.AC-api.test.ts` | ✅ done |

---

## 009 — Auth Owner

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Inscription valide → compte + rôle + redirection | `src/app/api/auth/register/route.ts`<br>`src/features/auth/schemas.ts` | `tests/contract/auth.AC-register.test.ts` | ✅ done |
| AC-01-02 | Email déjà utilisé → 409, pas de doublon | `src/app/api/auth/register/route.ts` | `tests/contract/auth.AC-register.test.ts` | ✅ done |
| AC-01-03 | Inscription → Subscription trial créée | `src/app/api/auth/register/route.ts`<br>`src/features/auth/lib/subscription.ts` | `tests/contract/auth.AC-register.test.ts` | ✅ done |
| AC-01-04 | Inscription → email de bienvenue Resend | `src/app/api/auth/register/route.ts`<br>`src/shared/lib/resend.ts` | `tests/contract/auth.AC-register.test.ts` | ✅ done |
| AC-02-01 | Connexion valide → redirection selon rôle | `src/app/api/auth/login/route.ts` | `tests/contract/auth.AC-login-logout.test.ts` | ✅ done |
| AC-02-02 | Identifiants incorrects → message générique | `src/app/api/auth/login/route.ts` | `tests/contract/auth.AC-login-logout.test.ts` | ✅ done |
| AC-02-03 | Accès dashboard sans auth → `/auth/login` | `src/proxy.ts` | `tests/unit/auth.AC-middleware.test.ts` | ✅ done |
| AC-03-01 | Déconnexion → session invalidée | `src/app/api/auth/logout/route.ts` | `tests/contract/auth.AC-login-logout.test.ts` | ✅ done |
| AC-03-02 | Session expirée → redirect `/auth/login` | `src/proxy.ts` | `tests/unit/auth.AC-middleware.test.ts` | ✅ done |
| AC-04-01 | Forgot password → même réponse 200 | `src/app/api/auth/forgot-password/route.ts` | `tests/contract/auth.AC-password.test.ts` | ✅ done |
| AC-04-02 | Reset password → mdp mis à jour + redirect login | `src/app/api/auth/reset-password/route.ts` | `tests/contract/auth.AC-password.test.ts` | ✅ done |
| BR-01 | Middleware protège `/dashboard/*`, `/merchant/*`, `/admin/*` | `src/proxy.ts` | `tests/unit/auth.AC-middleware.test.ts` | ✅ done |
| BR-02 | Rôle stocké dans `user_metadata` Supabase | `src/app/api/auth/register/route.ts` | `tests/contract/auth.AC-register.test.ts` | ✅ done |
| BR-03 | Redirection post-login selon rôle | `src/app/api/auth/login/route.ts`<br>`src/shared/types/roles.ts` | `tests/contract/auth.AC-login-logout.test.ts` | ✅ done |
| BR-04 | Cross-role access → redirect vers dashboard propre | `src/proxy.ts` | `tests/unit/auth.AC-middleware.test.ts` | ✅ done |
| BR-05 | Mot de passe minimum 8 caractères (Zod) | `src/features/auth/schemas.ts` | `tests/contract/auth.AC-register.test.ts`<br>`tests/contract/auth.AC-login-logout.test.ts` | ✅ done |
| BR-06 | Subscription trial 12 mois à l'inscription | `src/features/auth/lib/subscription.ts` | `tests/contract/auth.AC-register.test.ts` | ✅ done |

## 010 — Dashboard Owner

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Overview affiche métriques correctes | `src/app/api/dashboard/overview/route.ts`<br>`src/features/dashboard-owner/queries/overview.ts` | `tests/contract/dashboard.AC-overview.test.ts` | ✅ done |
| AC-01-02 | Empty state si aucun logement | `src/app/(dashboard)/dashboard/page.tsx` | `tests/unit/dashboard.AC-01-02.empty-state.test.tsx` | ✅ done |
| AC-02-01 | Liste logements avec stats | `src/app/api/dashboard/lodgings/route.ts` | `tests/contract/dashboard.AC-lodgings.test.ts` | ✅ done |
| AC-02-02 | Création logement fonctionne | `src/app/api/dashboard/lodgings/route.ts` | `tests/contract/dashboard.AC-lodgings.test.ts` | ✅ done |
| AC-02-03 | Modification logement fonctionne | `src/app/api/dashboard/lodgings/[id]/route.ts` | `tests/contract/dashboard.AC-lodgings.test.ts` | ✅ done |
| AC-03-01 | Stats 30 jours affichées | `src/app/api/dashboard/stats/route.ts`<br>`src/features/dashboard-owner/queries/stats.ts` | `tests/contract/dashboard.AC-stats.test.ts` | ✅ done |
| AC-03-02 | Graphiques Recharts via Shadcn | `src/features/dashboard-owner/components/OverviewChart.tsx`<br>`src/features/dashboard-owner/components/StatsCharts.tsx` | `tests/unit/dashboard.AC-01-02.empty-state.test.tsx` | ✅ done |
| BR-01 | Owner ne voit que ses propres données | `src/features/dashboard-owner/lib/get-session-owner.ts` | `tests/contract/dashboard.AC-lodgings.test.ts` | ✅ done |
| BR-04 | Interface utilise Shadcn/ui | `src/shared/components/ui/` | — | ✅ done |

## 011 — QR Code Owner

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | QR code généré avec URL correcte | `src/app/api/dashboard/lodgings/[id]/qr-code/route.ts` | `tests/contract/dashboard.AC-qr-code.test.ts` | ✅ done |
| AC-01-02 | Téléchargement PNG 1000×1000px | `src/features/qr-code/services/generate-qr.ts` | `tests/unit/qr-code.AC-02-02.generate-qr.test.ts` | ✅ done |
| AC-01-03 | Régénération archive l'ancien (deleted_at + is_active=false) | `src/features/dashboard-owner/queries/qr-code.ts` | `tests/contract/dashboard.AC-qr-code.test.ts` | ✅ done |
| AC-02-01 | qr_scan enregistré dans Analytics via page guide | `src/features/analytics/lib/record-qr-scan.ts` | `tests/contract/guide.AC-02-01.analytics-scan.test.ts` | ✅ done |
| BR-01 | 1 QR actif max par logement | `src/features/dashboard-owner/queries/qr-code.ts` | `tests/contract/dashboard.AC-qr-code.test.ts` | ✅ done |
| BR-05 | Owner ne génère que ses propres QR codes | `src/app/api/dashboard/lodgings/[id]/qr-code/route.ts` | `tests/contract/dashboard.AC-qr-code.test.ts` | ✅ done |
