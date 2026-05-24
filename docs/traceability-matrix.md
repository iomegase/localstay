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
| AC-01-03 | Nom ville + catégories disponibles affichés | `src/app/(public)/guide/[city-slug]/page.tsx`<br>`src/features/city-guide/components/CategoryRow.tsx` | `tests/integration/city-guide.AC-01-03.guide-page-renders-categories.test.tsx` | ✅ done |
| AC-02-01 | Saisie ville valide → redirection guide | `src/features/city-guide/components/CitySearchInput.tsx` | `tests/integration/city-guide.AC-02-01.city-search-redirect.test.tsx` | ✅ done |
| AC-02-02 | Saisie sans résultat → message clair | `src/features/city-guide/components/CitySearchInput.tsx` | `tests/unit/city-guide.AC-02-02.no-result-message.test.tsx` | ✅ done |
| AC-02-03 | Autocomplétion dès 3 chars, max 10, accent-insensitive | `src/app/api/cities/search/route.ts`<br>`src/features/city-guide/queries/cities.ts`<br>`src/features/city-guide/components/CitySearchInput.tsx` | `tests/unit/city-guide.AC-02-03.autocomplete-logic.test.ts`<br>`tests/unit/city-guide.AC-02-02.no-result-message.test.tsx` | ✅ done |
| AC-03-01 | Seules catégories avec POI actif visibles (absentes du DOM) | `src/features/city-guide/components/CategoryRow.tsx`<br>`src/features/city-guide/queries/cities.ts` | `tests/unit/city-guide.AC-03-01.categories-filter.test.tsx` | ✅ done |
| AC-03-02 | Icône (slug Lucide) + nom + poi_count par catégorie | `src/features/city-guide/components/CategoryRow.tsx` | `tests/unit/city-guide.AC-03-01.categories-filter.test.tsx`<br>`tests/e2e/city-guide.AC-03-03.mobile-375px.test.ts` | ✅ done |
| AC-03-03 | Rendu lisible sur 375px, pas de scroll horizontal, conforme mockup `001-city-guide/home.html` | `src/app/(public)/layout.tsx`<br>`src/app/(public)/guide/[city-slug]/page.tsx`<br>`src/features/city-guide/components/CategoryRow.tsx`<br>`src/features/city-guide/components/PublicMenu.tsx` | `tests/e2e/city-guide.AC-03-03.mobile-375px.test.ts`<br>`tests/integration/city-guide.AC-01-03.guide-page-renders-categories.test.tsx`<br>`tests/unit/public-layout.mockup-menu.test.tsx` | ✅ done |
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

> Spec `003-poi-list` approuvée le 2026-05-24. Décisions PO intégrées : distance affichée depuis GPS après opt-in avec fallback centre-ville ; pagination progressive via "Charger plus".

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Tri par distance par défaut | `src/features/categories/queries/poi-cards.ts`<br>`src/app/(public)/guide/[city-slug]/[category-slug]/page.tsx` | `tests/unit/categories.AC-01-01-02-01.poi-sorting.test.ts` | ✅ done |
| AC-01-02 | Card affiche tous les champs requis | `src/features/categories/components/PoiCard.tsx` | `tests/integration/categories.AC-01-02.poi-card-renders.test.tsx` | ✅ done |
| AC-01-03 | POI fermé visuellement différencié | `src/features/categories/components/PoiCard.tsx` | `tests/unit/categories.AC-01-03.poi-closed-badge.test.tsx` | ✅ done |
| AC-02-01 | Tri par note fonctionne | `src/features/categories/queries/poi-cards.ts`<br>`src/features/categories/components/SortControl.tsx` | `tests/unit/categories.AC-01-01-02-01.poi-sorting.test.ts` | ✅ done |
| AC-02-02 | Filtre sous-catégorie fonctionne | `src/features/categories/queries/poi-cards.ts`<br>`src/app/api/cities/[slug]/categories/[category-slug]/pois/route.ts` | `tests/contract/categories.AC-poi-list-api.test.ts`<br>`tests/e2e/categories.AC-03-01-03-02.subcategory-filter.test.ts` | ✅ done |
| AC-02-03 | Suppression filtre → reset liste | `src/features/categories/components/SubCategoryFilter.tsx` | `tests/e2e/categories.AC-03-01-03-02.subcategory-filter.test.ts` | ✅ done |
| AC-03-01 | Clic card → redirection fiche POI | `src/features/categories/components/PoiCard.tsx` | `tests/e2e/categories.AC-03-01.poi-navigation.test.ts` | ✅ done |
| BR-01a | Distance affichée depuis GPS après opt-in, fallback centre-ville | `src/features/categories/components/CategoryViewWrapper.tsx` | `tests/unit/categories.AC-nearby-section.test.tsx` | ✅ done |
| BR-05 | Pagination progressive "Charger plus", limit max 50 | `src/app/api/cities/[slug]/categories/[category-slug]/pois/route.ts`<br>`src/features/categories/queries/poi-cards.ts`<br>`src/features/categories/components/CategoryViewWrapper.tsx` | `tests/contract/categories.AC-poi-list-api.test.ts`<br>`tests/unit/categories.AC-01-01-02-01.poi-sorting.test.ts`<br>`tests/unit/categories.AC-nearby-section.test.tsx` | ✅ done |

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
| AC-01-01 | Overview affiche métriques correctes | `src/app/(dashboard)/dashboard/page.tsx`<br>`src/app/api/dashboard/overview/route.ts`<br>`src/features/dashboard-owner/queries/overview.ts` | `tests/contract/dashboard.AC-overview.test.ts` | ✅ done |
| AC-01-02 | Empty state si aucun logement | `src/app/(dashboard)/dashboard/page.tsx` | `tests/unit/dashboard.AC-01-02.empty-state.test.tsx` | ✅ done |
| AC-02-01 | Liste logements avec stats | `src/app/(dashboard)/dashboard/lodgings/page.tsx`<br>`src/app/api/dashboard/lodgings/route.ts`<br>`src/features/dashboard-owner/queries/lodgings.ts`<br>`src/features/dashboard-owner/components/LodgingsTable.tsx` | `tests/contract/dashboard.AC-lodgings.test.ts` | ✅ done |
| AC-02-02 | Création logement fonctionne | `src/app/api/dashboard/lodgings/route.ts` | `tests/contract/dashboard.AC-lodgings.test.ts` | ✅ done |
| AC-02-03 | Modification logement fonctionne | `src/app/api/dashboard/lodgings/[id]/route.ts`<br>`src/features/dashboard-owner/schemas.ts` | `tests/contract/dashboard.AC-lodgings.test.ts` | ✅ done |
| AC-03-01 | Stats 30 jours affichées | `src/app/api/dashboard/stats/route.ts`<br>`src/features/dashboard-owner/queries/stats.ts` | `tests/contract/dashboard.AC-stats.test.ts` | ✅ done |
| AC-03-02 | Graphiques Recharts via Shadcn | `src/features/dashboard-owner/components/OverviewChart.tsx`<br>`src/features/dashboard-owner/components/StatsCharts.tsx` | `tests/unit/dashboard.AC-01-02.empty-state.test.tsx` | ✅ done |
| BR-01 | Owner ne voit que ses propres données | `src/features/dashboard-owner/lib/get-session-owner.ts`<br>`src/features/dashboard-owner/lib/get-page-owner.ts` | `tests/contract/dashboard.AC-lodgings.test.ts`<br>`tests/unit/dashboard-owner.get-page-owner.test.ts` | ✅ done |
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

## 012 — Guide Customization

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Message d'accueil sauvegardé | `src/app/api/dashboard/lodgings/[id]/customization/route.ts`<br>`src/features/guide-customization/queries/customization.ts`<br>`src/features/guide-customization/components/CustomizationForm.tsx` | `tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts` | ✅ done |
| AC-01-02 | Message affiché si lodging param présent | `src/app/(public)/guide/[city-slug]/page.tsx`<br>`src/app/api/cities/[slug]/route.ts`<br>`src/features/city-guide/queries/cities.ts` | `tests/contract/guide-customization.AC-01-02.public-routes.test.ts` | ✅ done |
| AC-02-01 | POI favoris affichés exclusivement dans le guide personnalisé | `src/features/categories/queries/poi-cards.ts` | `tests/unit/guide-customization.AC-02-01-02-03.poi-featured-order.test.ts` | ✅ done |
| AC-02-02 | Note personnelle affichée sur card | `src/features/categories/components/PoiCard.tsx`<br>`src/features/categories/types.ts` | `tests/integration/categories.AC-01-02.poi-card-renders.test.tsx` | ✅ done |
| AC-02-03 | Sans lodging param → guide standard | `src/features/categories/queries/poi-cards.ts`<br>`src/features/guide-customization/queries/customization.ts` | `tests/unit/guide-customization.AC-02-01-02-03.poi-featured-order.test.ts` | ✅ done |
| AC-03-01 | Ordre catégories sauvegardé et appliqué | `src/features/guide-customization/queries/customization.ts`<br>`src/features/city-guide/queries/cities.ts`<br>`src/features/categories/queries/categories.ts`<br>`src/features/guide-customization/components/CustomizationForm.tsx` | `tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts`<br>`tests/unit/guide-customization.AC-03-01.category-order.test.ts` | ✅ done |
| BR-07 | Owner isolation sur GET/PUT customization | `src/app/api/dashboard/lodgings/[id]/customization/route.ts`<br>`src/features/guide-customization/queries/customization.ts` | `tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts` | ✅ done |
| BR-08/09 | POI favori limité au périmètre du Guide | `src/features/guide-customization/lib/validation.ts`<br>`src/features/guide-customization/queries/customization.ts` | `tests/unit/guide-customization.BR-08-10.validation.test.ts` | ✅ done |
| BR-10 | Catégories invalides isolées et non sauvegardées | `src/features/guide-customization/lib/validation.ts`<br>`src/features/guide-customization/queries/customization.ts` | `tests/unit/guide-customization.BR-08-10.validation.test.ts` | ✅ done |
| BR-12 | Avec recommandations, catégories/POI publics filtrés sur la sélection Owner | `src/features/guide-customization/queries/customization.ts`<br>`src/features/city-guide/queries/cities.ts`<br>`src/features/categories/queries/categories.ts`<br>`src/features/categories/queries/poi-cards.ts` | `tests/unit/guide-customization.AC-02-01-02-03.poi-featured-order.test.ts`<br>`tests/unit/guide-customization.AC-03-01.category-order.test.ts` | ✅ done |

## 013 — Subscription Owner

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Page/API abonnement affiche plan, statut, date et fonctionnalités | `src/app/(dashboard)/dashboard/subscription/page.tsx`<br>`src/app/api/dashboard/subscription/route.ts`<br>`src/features/subscription-owner/queries/subscription.ts` | `tests/contract/subscription-owner.AC-01-01.api.test.ts` | ✅ done |
| AC-01-02 | Message "Gratuit jusqu'au [date]" avec jours restants | `src/features/subscription-owner/subscription-detail.ts`<br>`src/app/(dashboard)/dashboard/subscription/page.tsx` | `tests/unit/subscription-owner.AC-01-02.trial-days.test.ts` | ✅ done |
| AC-02-01 | Grille tarifaire statique indicative affichée | `src/features/subscription-owner/plans.ts`<br>`src/features/subscription-owner/components/SubscriptionPlanGrid.tsx`<br>`src/app/api/dashboard/subscription/plans/route.ts` | `tests/unit/subscription-owner.AC-02-01.static-plans.test.ts`<br>`tests/contract/subscription-owner.AC-02-01.plans-api.test.ts` | ✅ done |
| AC-02-02 | Clic "Choisir ce plan" affiche un message informatif sans paiement | `src/features/subscription-owner/components/SubscriptionPlanGrid.tsx` | `tests/unit/subscription-owner.AC-02-02.plan-dialog.test.tsx` | ✅ done |
| BR-01/02/05 | Aucun paiement ni appel Stripe en MVP2 | `src/features/subscription-owner/components/SubscriptionPlanGrid.tsx`<br>`src/app/(dashboard)/dashboard/subscription/page.tsx` | `tests/unit/subscription-owner.AC-02-02.plan-dialog.test.tsx` | ✅ done |
| BR-04 | Trials expirés passés en `past_due` par cron internal | `src/app/api/internal/check-subscriptions/route.ts`<br>`src/features/subscription-owner/queries/subscription.ts`<br>`vercel.json` | `tests/contract/subscription-owner.BR-04.check-subscriptions-cron.test.ts` | ✅ done |
| BR-06/07 | Plans statiques typés, prix indicatifs non contractuels | `src/features/subscription-owner/plans.ts` | `tests/unit/subscription-owner.AC-02-01.static-plans.test.ts` | ✅ done |

## 014 — Auth Merchant

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Inscription merchant → rôle merchant + onboarding | `src/app/api/auth/register/route.ts`<br>`src/features/auth/schemas.ts`<br>`src/features/merchant/lib/redirect.ts` | `tests/contract/auth.AC-register.test.ts` | ✅ done |
| AC-01-02 | Subscription trial créée via logique 009 | `src/app/api/auth/register/route.ts`<br>`src/features/auth/lib/subscription.ts` | `tests/contract/auth.AC-register.test.ts` | ✅ done |
| AC-01-03 | Merchant sans profile redirigé onboarding | `src/app/(merchant)/merchant/dashboard/page.tsx`<br>`src/features/merchant/lib/get-page-merchant.ts` | `tests/contract/auth.AC-login-logout.test.ts` | ✅ done |
| AC-02-01 | Recherche POI par nom/adresse | `src/app/api/merchant/onboarding/search/route.ts`<br>`src/features/merchant/queries/onboarding.ts` | `tests/contract/auth-merchant.AC-02-03.onboarding-api.test.ts` | ✅ done |
| AC-02-02 | POI déjà rattaché non revendicable | `src/features/merchant/queries/onboarding.ts` | `tests/contract/auth-merchant.AC-02-03.onboarding-api.test.ts` | ✅ done |
| AC-02-03 | POI inactif/supprimé/rejeté exclu | `src/features/merchant/queries/onboarding.ts` | `tests/contract/auth-merchant.AC-02-03.onboarding-api.test.ts` | ✅ done |
| AC-02-04 | Résultat search affiche metadata POI | `src/features/merchant/components/MerchantOnboardingClient.tsx`<br>`src/features/merchant/queries/onboarding.ts` | `tests/contract/auth-merchant.AC-02-03.onboarding-api.test.ts` | ✅ done |
| AC-03-01 | Claim pending créée | `src/app/api/merchant/onboarding/claim/route.ts`<br>`src/features/merchant/queries/onboarding.ts` | `tests/contract/auth-merchant.AC-02-03.onboarding-api.test.ts` | ✅ done |
| AC-03-02 | Une seule claim pending par Merchant | `src/features/merchant/queries/onboarding.ts` | `tests/contract/auth-merchant.AC-02-03.onboarding-api.test.ts` | ✅ done |
| AC-03-03 | Merchant déjà lié ne peut pas claim | `src/features/merchant/queries/onboarding.ts` | `tests/contract/auth-merchant.AC-02-03.onboarding-api.test.ts` | ✅ done |
| AC-03-04 | POI déjà claim actif interdit | `src/features/merchant/queries/onboarding.ts` | `tests/contract/auth-merchant.AC-02-03.onboarding-api.test.ts` | ✅ done |
| AC-03-05 | Claim pending affichée en attente | `src/app/(merchant)/merchant/onboarding/page.tsx`<br>`src/features/merchant/queries/onboarding.ts` | `tests/contract/auth-merchant.AC-02-03.onboarding-api.test.ts` | ✅ done |
| AC-04-01 | Admin approve → MerchantProfile actif | `src/app/api/admin/merchant-claims/[id]/approve/route.ts`<br>`src/features/merchant/queries/admin-claims.ts` | `tests/contract/auth-merchant.AC-04.admin-claims-api.test.ts` | ✅ done |
| AC-04-02 | Admin reject → pas de MerchantProfile | `src/app/api/admin/merchant-claims/[id]/reject/route.ts`<br>`src/features/merchant/queries/admin-claims.ts` | `tests/contract/auth-merchant.AC-04.admin-claims-api.test.ts` | ✅ done |
| AC-04-03 | Claim reviewed non retraitable | `src/features/merchant/queries/admin-claims.ts` | `tests/contract/auth-merchant.AC-04.admin-claims-api.test.ts` | ✅ done |
| AC-04-04 | Routes admin interdites non-admin | `src/features/merchant/lib/session.ts`<br>`src/app/api/admin/merchant-claims/route.ts` | `tests/contract/auth-merchant.AC-04.admin-claims-api.test.ts` | ✅ done |
| AC-05-01 | Login Merchant sans claim/profile → onboarding | `src/app/api/auth/login/route.ts`<br>`src/features/merchant/lib/redirect.ts` | `tests/contract/auth.AC-login-logout.test.ts` | ✅ done |
| AC-05-02 | Login Merchant pending → onboarding pending | `src/app/api/auth/login/route.ts`<br>`src/features/merchant/lib/redirect.ts` | `tests/contract/auth.AC-login-logout.test.ts` | ✅ done |
| AC-05-03 | Login Merchant approved → dashboard | `src/app/api/auth/login/route.ts`<br>`src/features/merchant/lib/redirect.ts` | `tests/contract/auth.AC-login-logout.test.ts` | ✅ done |
| AC-05-04 | Owner interdit sur routes Merchant | `src/proxy.ts`<br>`src/features/merchant/lib/session.ts` | `tests/unit/auth.AC-middleware.test.ts` | ✅ done |

## 015 — Dashboard Merchant

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Modification fiche sauvegardée et visible publiquement | `src/app/api/merchant/profile/route.ts`<br>`src/features/merchant/queries/dashboard.ts`<br>`src/app/(merchant)/merchant/profile/page.tsx`<br>`src/features/merchant/components/MerchantProfileForm.tsx` | `tests/contract/dashboard-merchant.AC-01-03.api.test.ts` | ✅ done |
| AC-01-02 | Upload photo visible dans carousel public | `src/app/api/merchant/photos/route.ts`<br>`src/features/merchant/queries/dashboard.ts`<br>`src/features/categories/queries/poi-detail.ts` | `tests/contract/dashboard-merchant.AC-01-03.api.test.ts` | ✅ done |
| AC-01-03 | Limite 5 photos appliquée | `src/app/api/merchant/photos/route.ts`<br>`src/features/merchant/queries/dashboard.ts` | `tests/contract/dashboard-merchant.AC-01-03.api.test.ts` | ✅ done |
| AC-01-04 | Isolation Merchant sur son POI | `src/features/merchant/lib/session.ts`<br>`src/features/merchant/queries/dashboard.ts` | `tests/contract/dashboard-merchant.AC-01-03.api.test.ts` | ✅ done |
| AC-02-01 | Stats 30 jours: vues, téléphone, itinéraire, site web | `src/app/api/merchant/stats/route.ts`<br>`src/features/merchant/queries/dashboard.ts`<br>`src/app/(merchant)/merchant/stats/page.tsx` | `tests/contract/dashboard-merchant.AC-02-03.stats-offers-api.test.ts` | ✅ done |
| AC-02-02 | Graphique Recharts avec 30 points | `src/features/merchant/components/MerchantStatsChart.tsx`<br>`src/app/(merchant)/merchant/stats/page.tsx` | `tests/contract/dashboard-merchant.AC-02-03.stats-offers-api.test.ts` | ✅ done |
| AC-02-03 | Stats isolées au POI du Merchant | `src/features/merchant/queries/dashboard.ts` | `tests/contract/dashboard-merchant.AC-02-03.stats-offers-api.test.ts` | ✅ done |
| AC-03-01 | Offre créée visible sur fiche publique | `src/app/api/merchant/offers/route.ts`<br>`src/features/merchant/queries/dashboard.ts`<br>`src/features/categories/components/MerchantOffersBlock.tsx`<br>`src/features/categories/queries/poi-detail.ts` | `tests/contract/dashboard-merchant.AC-02-03.stats-offers-api.test.ts`<br>`tests/integration/dashboard-merchant.AC-03-01-02.public-offers.test.tsx` | ✅ done |
| AC-03-02 | Offre expirée masquée publiquement | `src/features/categories/components/MerchantOffersBlock.tsx`<br>`src/features/categories/queries/poi-detail.ts` | `tests/integration/dashboard-merchant.AC-03-01-02.public-offers.test.tsx` | ✅ done |
| AC-03-03 | Limite 3 offres actives appliquée | `src/app/api/merchant/offers/route.ts`<br>`src/features/merchant/queries/dashboard.ts` | `tests/contract/dashboard-merchant.AC-02-03.stats-offers-api.test.ts` | ✅ done |
| AC-03-04 | Suppression offre en soft delete | `src/app/api/merchant/offers/[id]/route.ts`<br>`src/features/merchant/queries/dashboard.ts` | `tests/contract/dashboard-merchant.AC-02-03.stats-offers-api.test.ts` | ✅ done |

## 016 — Dashboard Super-Admin

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Admin authentifié accède à `/admin` | `src/app/admin/page.tsx`<br>`src/features/merchant/lib/get-page-admin.ts` | `tests/integration/dashboard-superadmin.AC-01-03-02-03.pages.test.tsx` | ✅ done |
| AC-01-02 | Non-admin refusé sur `/admin/*` et `/api/admin/*` | `src/proxy.ts`<br>`src/features/merchant/lib/session.ts`<br>`src/features/merchant/lib/get-page-admin.ts` | `tests/unit/auth.AC-middleware.test.ts`<br>`tests/contract/dashboard-superadmin.AC-02-04-05.api.test.ts` | ✅ done |
| AC-01-03 | Layout admin contient navigation MVP | `src/app/admin/layout.tsx` | `tests/integration/dashboard-superadmin.AC-01-03-02-03.pages.test.tsx` | ✅ done |
| AC-02-01 | Overview affiche 6 KPI globaux | `src/app/admin/page.tsx`<br>`src/app/api/admin/overview/route.ts`<br>`src/features/admin/queries/dashboard.ts` | `tests/contract/dashboard-superadmin.AC-02-04-05.api.test.ts`<br>`tests/integration/dashboard-superadmin.AC-01-03-02-03.pages.test.tsx` | ✅ done |
| AC-02-02 | Graphique scans QR 30 jours | `src/features/admin/components/AdminQrScansChart.tsx`<br>`src/features/admin/queries/dashboard.ts` | `tests/unit/dashboard-superadmin.AC-02-02.chart.test.tsx` | ✅ done |
| AC-02-03 | Facturation affichée comme non activée MVP2 | `src/app/admin/page.tsx`<br>`src/features/admin/queries/dashboard.ts` | `tests/integration/dashboard-superadmin.AC-01-03-02-03.pages.test.tsx` | ✅ done |
| AC-03-01 | Claims pending visibles sur `/admin/merchant-claims` | `src/app/admin/merchant-claims/page.tsx`<br>`src/features/merchant/queries/admin-claims.ts`<br>`src/features/merchant/components/AdminMerchantClaimsClient.tsx` | `tests/contract/auth-merchant.AC-04.admin-claims-api.test.ts` | ✅ done |
| AC-03-02 | Approve claim réutilise `014` | `src/app/api/admin/merchant-claims/[id]/approve/route.ts`<br>`src/features/merchant/queries/admin-claims.ts` | `tests/contract/auth-merchant.AC-04.admin-claims-api.test.ts` | ✅ done |
| AC-03-03 | Reject claim réutilise `014` | `src/app/api/admin/merchant-claims/[id]/reject/route.ts`<br>`src/features/merchant/queries/admin-claims.ts` | `tests/contract/auth-merchant.AC-04.admin-claims-api.test.ts` | ✅ done |
| AC-03-04 | Overview affiche 5 dernières claims pending | `src/app/admin/page.tsx`<br>`src/features/admin/queries/dashboard.ts` | `tests/contract/dashboard-superadmin.AC-02-04-05.api.test.ts`<br>`tests/integration/dashboard-superadmin.AC-01-03-02-03.pages.test.tsx` | ✅ done |
| AC-04-01 | Liste villes consultative avec compteurs | `src/app/admin/cities/page.tsx`<br>`src/app/api/admin/cities/route.ts`<br>`src/features/admin/queries/dashboard.ts` | `tests/contract/dashboard-superadmin.AC-02-04-05.api.test.ts`<br>`tests/integration/dashboard-superadmin.AC-01-03-02-03.pages.test.tsx` | ✅ done |
| AC-04-02 | Ville sans POI actif signalée à enrichir | `src/features/admin/queries/dashboard.ts`<br>`src/app/admin/cities/page.tsx` | `tests/unit/dashboard-superadmin.AC-04-02.city-status.test.ts` | ✅ done |
| AC-04-03 | Lien vers guide public ville | `src/app/admin/cities/page.tsx` | `tests/integration/dashboard-superadmin.AC-01-03-02-03.pages.test.tsx` | ✅ done |
| AC-05-01 | Liste utilisateurs consultative | `src/app/admin/users/page.tsx`<br>`src/app/api/admin/users/route.ts`<br>`src/features/admin/queries/dashboard.ts` | `tests/contract/dashboard-superadmin.AC-02-04-05.api.test.ts`<br>`tests/integration/dashboard-superadmin.AC-01-03-02-03.pages.test.tsx` | ✅ done |
| AC-05-02 | Filtre utilisateurs par rôle | `src/app/admin/users/page.tsx`<br>`src/app/api/admin/users/route.ts`<br>`src/features/admin/queries/dashboard.ts` | `tests/contract/dashboard-superadmin.AC-02-04-05.api.test.ts` | ✅ done |
| AC-05-03 | Users soft-deleted exclus par défaut | `src/features/admin/queries/dashboard.ts` | `tests/integration/dashboard-superadmin.AC-01-03-02-03.pages.test.tsx` | ✅ done |
| BR-03/08/09 | Cockpit consultatif sans mutation sensible | `src/app/admin/cities/page.tsx`<br>`src/app/admin/users/page.tsx`<br>`src/app/api/admin/cities/route.ts`<br>`src/app/api/admin/users/route.ts` | `tests/integration/dashboard-superadmin.AC-01-03-02-03.pages.test.tsx` | ✅ done |

## 017 — Admin Taxonomy

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Liste catégories actives/inactives triées | `src/app/admin/taxonomy/page.tsx`<br>`src/features/admin-taxonomy/components/AdminTaxonomyClient.tsx`<br>`src/app/api/admin/taxonomy/route.ts`<br>`src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/integration/admin-taxonomy.AC-01.page.test.tsx`<br>`tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts` | ✅ done |
| AC-01-02 | Metadata catégorie visible en admin | `src/features/admin-taxonomy/components/AdminTaxonomyClient.tsx`<br>`src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/integration/admin-taxonomy.AC-01.page.test.tsx` | ✅ done |
| AC-01-03 | Sous-catégories triées affichées | `src/features/admin-taxonomy/components/AdminTaxonomyClient.tsx`<br>`src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/integration/admin-taxonomy.AC-01.page.test.tsx` | ✅ done |
| AC-02-01 | Création Category valide | `src/app/api/admin/taxonomy/categories/route.ts`<br>`src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts` | ✅ done |
| AC-02-02 | Slug Category unique, même soft-deleted | `src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts` | ✅ done |
| AC-02-03 | Icon slug Lucide validé | `src/features/admin-taxonomy/lib/icons.ts`<br>`src/features/admin-taxonomy/lib/api.ts` | `tests/unit/admin-taxonomy.AC-02-03-BR-12.icon-validation.test.ts`<br>`tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts` | ✅ done |
| AC-03-01 | Modification name/icon/order/status | `src/app/api/admin/taxonomy/categories/[id]/route.ts`<br>`src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts` | ✅ done |
| AC-03-02 | Slug Category verrouillé si dépendance active | `src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/unit/admin-taxonomy.AC-03-02-03-04-03.slug-locking.test.ts`<br>`tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts` | ✅ done |
| AC-03-03 | Slug Category modifiable si aucune dépendance | `src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/unit/admin-taxonomy.AC-03-02-03-04-03.slug-locking.test.ts` | ✅ done |
| AC-03-04 | Category inactive exclue du public | `src/features/categories/queries/categories.ts` | `tests/contract/categories.AC-01-01.category-list-api.test.ts`<br>`tests/contract/categories.AC-02-01.category-detail-api.test.ts` | ✅ done |
| AC-04-01 | Création SubCategory valide | `src/app/api/admin/taxonomy/categories/[id]/subcategories/route.ts`<br>`src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts` | ✅ done |
| AC-04-02 | Slug SubCategory unique, même soft-deleted | `src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts` | ✅ done |
| AC-04-03 | Slug SubCategory verrouillé si POI actif | `src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/unit/admin-taxonomy.AC-03-02-03-04-03.slug-locking.test.ts` | ✅ done |
| AC-04-04 | SubCategory inactive exclue des filtres publics | `src/features/categories/queries/categories.ts` | `tests/contract/categories.AC-02-01.category-detail-api.test.ts` | ✅ done |
| AC-05-01 | Désactivation Category sans suppression physique | `src/app/api/admin/taxonomy/categories/[id]/route.ts`<br>`src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts` | ✅ done |
| AC-05-02 | Désactivation SubCategory sans suppression physique | `src/app/api/admin/taxonomy/subcategories/[id]/route.ts`<br>`src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts` | ✅ done |
| AC-05-03 | Category inactive exclue Gemini Fetch | `src/features/admin-taxonomy/lib/gemini-taxonomy.ts`<br>`src/features/gemini-fetch/services/orchestrator.ts` | `tests/unit/admin-taxonomy.AC-05-03-06.seed-and-gemini.test.ts`<br>`tests/integration/gemini-fetch.AC-01-03.cache-flow.test.ts` | ✅ done |
| AC-05-04 | POI historique conserve SubCategory inactive | `src/features/admin-taxonomy/queries/taxonomy.ts`<br>`src/features/categories/queries/categories.ts` | `tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts`<br>`tests/contract/categories.AC-02-01.category-detail-api.test.ts` | ✅ done |
| AC-06-01 | Seed initial crée taxonomie recommandée | `src/features/admin-taxonomy/lib/recommended-taxonomy.ts`<br>`prisma/seed.ts` | `tests/unit/admin-taxonomy.AC-05-03-06.seed-and-gemini.test.ts` | ✅ done |
| AC-06-02 | Seed idempotent non destructif | `src/features/admin-taxonomy/lib/recommended-taxonomy.ts`<br>`prisma/seed.ts` | `tests/unit/admin-taxonomy.AC-05-03-06.seed-and-gemini.test.ts` | ✅ done |
| AC-06-03 | Catégories seedées sans POI restent masquées publiquement | `src/features/categories/queries/categories.ts`<br>`src/features/admin-taxonomy/lib/recommended-taxonomy.ts` | `tests/contract/categories.AC-01-01.category-list-api.test.ts` | ✅ done |
| BR-01/02 | Routes taxonomie réservées admin | `src/app/admin/layout.tsx`<br>`src/app/admin/taxonomy/page.tsx`<br>`src/app/api/admin/taxonomy/route.ts`<br>`src/features/merchant/lib/session.ts` | `tests/integration/admin-taxonomy.AC-01.page.test.tsx`<br>`tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts` | ✅ done |
| BR-03 | `Tous` non seedé en base | `src/features/admin-taxonomy/lib/recommended-taxonomy.ts` | `tests/unit/admin-taxonomy.AC-05-03-06.seed-and-gemini.test.ts` | ✅ done |
| BR-14 | Changements taxonomie audités | `prisma/schema.prisma`<br>`src/features/admin-taxonomy/queries/taxonomy.ts` | `tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts` | ✅ done |

## 018 — POI Acquisition Pipeline

| Spec ID | Acceptance Criterion | Source File | Test File | Statut |
|---|---|---|---|---|
| AC-01-01 | Run acquisition créé par Admin | `src/app/admin/poi-acquisition/page.tsx`<br>`src/features/poi-acquisition/components/AdminAcquisitionLauncher.tsx`<br>`src/app/api/admin/poi-acquisition/runs/route.ts`<br>`src/features/poi-acquisition/queries/runs.ts`<br>`prisma/schema.prisma` | `tests/contract/poi-acquisition.admin-runs-api.test.ts` | ✅ done |
| AC-01-02 | Candidats Gemini créés avec `source = gemini` | `src/features/poi-acquisition/queries/runs.ts`<br>`src/features/gemini-fetch/services/prompt-builder.ts`<br>`src/features/gemini-fetch/services/gemini-client.ts` | `tests/contract/poi-acquisition.admin-runs-api.test.ts` | ✅ done |
| AC-01-03 | Matching Google Places alimente `google_place_id` | `src/features/poi-acquisition/lib/google-places.ts`<br>`src/features/poi-acquisition/queries/runs.ts` | `tests/unit/poi-acquisition.AC-05.google-policy.test.ts` | ✅ done |
| AC-01-04 | Géocodage Mapbox candidat | `src/features/poi-acquisition/lib/geocode.ts`<br>`src/features/poi-acquisition/queries/runs.ts` | `tests/contract/poi-acquisition.admin-runs-api.test.ts` | ✅ done |
| AC-01-05 | Ambigus/doublons restent en review | `src/features/poi-acquisition/lib/duplicate-detection.ts`<br>`src/features/poi-acquisition/queries/runs.ts` | `tests/unit/poi-acquisition.BR-09.duplicate-detection.test.ts` | ✅ done |
| AC-02-01 | UI admin liste candidats et statuts | `src/app/admin/poi-acquisition/page.tsx`<br>`src/app/admin/poi-acquisition/runs/[id]/page.tsx`<br>`src/features/poi-acquisition/queries/runs.ts` | `tests/integration/poi-acquisition.admin-pages.test.tsx` | ✅ done |
| AC-02-02 | Publication candidat crée POI actif | `src/app/api/admin/poi-acquisition/candidates/[id]/publish/route.ts`<br>`src/features/poi-acquisition/queries/review.ts` | `tests/contract/poi-acquisition.review-actions-api.test.ts` | ✅ done |
| AC-02-03 | Fusion candidat sans nouveau POI | `src/app/api/admin/poi-acquisition/candidates/[id]/merge/route.ts`<br>`src/features/poi-acquisition/queries/review.ts` | `tests/contract/poi-acquisition.review-actions-api.test.ts` | ✅ done |
| AC-02-04 | Rejet candidat sans POI public | `src/app/api/admin/poi-acquisition/candidates/[id]/reject/route.ts`<br>`src/features/poi-acquisition/queries/review.ts` | `tests/contract/poi-acquisition.review-actions-api.test.ts` | ✅ done |
| AC-02-05 | Audit validation admin | `src/features/poi-acquisition/queries/review.ts`<br>`prisma/schema.prisma` | `tests/contract/poi-acquisition.review-actions-api.test.ts` | ✅ done |
| AC-03-01 | Bouton POI manquant onboarding | `src/features/merchant/components/MerchantOnboardingClient.tsx` | `tests/unit/merchant-onboarding.AC-03-01.missing-poi-ui.test.tsx` | ✅ done |
| AC-03-02 | MissingPoiRequest créé | `src/app/api/merchant/onboarding/missing-poi/route.ts`<br>`src/features/poi-acquisition/queries/missing-poi.ts` | `tests/contract/poi-acquisition.missing-poi-api.test.ts` | ✅ done |
| AC-03-03 | Matching Google demande manquante | `src/features/poi-acquisition/lib/google-places.ts`<br>`src/features/poi-acquisition/queries/missing-poi.ts` | `tests/contract/poi-acquisition.missing-poi-api.test.ts` | ✅ done |
| AC-03-04 | Géocodage Mapbox demande manquante | `src/features/poi-acquisition/lib/geocode.ts`<br>`src/features/poi-acquisition/queries/missing-poi.ts` | `tests/contract/poi-acquisition.missing-poi-api.test.ts` | ✅ done |
| AC-03-05 | POI créé puis revendicable via flux Merchant existant | `src/features/poi-acquisition/queries/manual-poi.ts`<br>`src/features/merchant/queries/onboarding.ts`<br>`src/app/api/merchant/onboarding/claim/route.ts` | `tests/contract/poi-acquisition.manual-poi-api.test.ts`<br>`tests/contract/auth-merchant.AC-02-03.onboarding-api.test.ts` | ✅ done |
| AC-04-01 | Formulaire admin POI validé Zod | `src/app/admin/pois/new/page.tsx`<br>`src/app/api/admin/pois/route.ts`<br>`src/features/poi-acquisition/lib/api.ts` | `tests/integration/poi-acquisition.admin-pages.test.tsx`<br>`tests/contract/poi-acquisition.manual-poi-api.test.ts` | ✅ done |
| AC-04-02 | Création admin appelle Mapbox | `src/features/poi-acquisition/lib/geocode.ts`<br>`src/features/poi-acquisition/queries/manual-poi.ts` | `tests/contract/poi-acquisition.manual-poi-api.test.ts` | ✅ done |
| AC-04-03 | POI créé si géocodage fiable | `src/features/poi-acquisition/queries/manual-poi.ts` | `tests/contract/poi-acquisition.manual-poi-api.test.ts` | ✅ done |
| AC-04-04 | Géocodage ambigu bloqué ou pending_review confirmé | `src/features/poi-acquisition/queries/manual-poi.ts`<br>`src/features/poi-acquisition/lib/api.ts` | `tests/contract/poi-acquisition.manual-poi-api.test.ts` | ✅ done |
| AC-04-05 | Doublons probables exigent confirmation | `src/features/poi-acquisition/lib/duplicate-detection.ts`<br>`src/features/poi-acquisition/queries/manual-poi.ts` | `tests/unit/poi-acquisition.BR-09.duplicate-detection.test.ts`<br>`tests/contract/poi-acquisition.manual-poi-api.test.ts` | ✅ done |
| AC-04-06 | POI manuel revendicable par Merchant | `src/features/poi-acquisition/queries/manual-poi.ts`<br>`src/features/merchant/queries/onboarding.ts` | `tests/contract/poi-acquisition.manual-poi-api.test.ts`<br>`tests/contract/auth-merchant.AC-02-03.onboarding-api.test.ts` | ✅ done |
| AC-05-01 | Seul `google_place_id` stocké durablement | `src/features/poi-acquisition/lib/google-policy.ts`<br>`src/features/poi-acquisition/lib/google-places.ts` | `tests/unit/poi-acquisition.AC-05.google-policy.test.ts` | ✅ done |
| AC-05-02 | Payload Google temporaire expire | `src/app/api/internal/cleanup-google-review-payloads/route.ts`<br>`src/features/poi-acquisition/lib/google-policy.ts`<br>`vercel.json` | `tests/unit/poi-acquisition.AC-05.google-policy.test.ts` | ✅ done |
| AC-05-03 | Attribution Google en UI admin | `src/app/admin/poi-acquisition/runs/[id]/page.tsx` | `tests/integration/poi-acquisition.admin-pages.test.tsx` | ✅ done |
| AC-05-04 | Public affiche données StayLocal validées | `src/features/poi-acquisition/queries/review.ts`<br>`src/features/categories/queries/poi-detail.ts` | `tests/unit/poi-acquisition.AC-05.google-policy.test.ts` | ✅ done |
| BR-01/02/03 | Gemini limité, Mapbox source GPS | `src/features/poi-acquisition/queries/runs.ts`<br>`src/features/poi-acquisition/lib/geocode.ts` | `tests/contract/poi-acquisition.admin-runs-api.test.ts` | ✅ done |
| BR-04/05/06 | Google limité au matching et payload temporaire | `src/features/poi-acquisition/lib/google-policy.ts`<br>`src/features/poi-acquisition/lib/google-places.ts`<br>`src/app/api/internal/cleanup-google-review-payloads/route.ts` | `tests/unit/poi-acquisition.AC-05.google-policy.test.ts` | ✅ done |
| BR-07/08/09/10 | Publication sécurisée, taxonomie active, doublons confirmés | `src/features/poi-acquisition/lib/duplicate-detection.ts`<br>`src/features/poi-acquisition/queries/review.ts`<br>`src/features/poi-acquisition/queries/manual-poi.ts` | `tests/unit/poi-acquisition.BR-09.duplicate-detection.test.ts`<br>`tests/contract/poi-acquisition.review-actions-api.test.ts` | ✅ done |
| BR-11/12/13/14/15 | Merchant ne crée pas public, admin-only, audit, soft delete, routes internes protégées | `src/app/api/merchant/onboarding/missing-poi/route.ts`<br>`src/app/api/admin/pois/route.ts`<br>`src/features/poi-acquisition/queries/review.ts`<br>`src/app/api/internal/cleanup-google-review-payloads/route.ts` | `tests/contract/poi-acquisition.missing-poi-api.test.ts`<br>`tests/contract/poi-acquisition.manual-poi-api.test.ts`<br>`tests/contract/poi-acquisition.review-actions-api.test.ts` | ✅ done |
