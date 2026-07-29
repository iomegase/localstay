# Confiner la navigation du guest en séjour + supprimer la météo

**Date :** 2026-07-03
**Statut :** Design validé — prêt pour implémentation
**Portée :** Expérience invité (mode séjour) + suppression de la feature météo

## Contexte & objectif

Aujourd'hui, un guest en séjour (cookie `lodging_id` valide) peut, via le menu burger ou le fil
d'ariane de la vitrine, atteindre la **page ville publique** `/guide/{ville}` qui ouvre l'intégralité
du site public (catégories, POI, autres villes…). L'owner veut **confiner le guest** à une surface
définie et **empêcher tout retour vers la page publique de la ville**.

Second objectif, indépendant mais groupé : **supprimer complètement la météo** du site.

Investigation préalable (systematic-debugging) : ce n'était **pas** une perte de session — le cookie
persiste. Le problème est que les surfaces de navigation exposent des liens `/guide/*` publics et que
le proxy laisse `/guide/*` toujours ouvert.

## Décisions de cadrage (brainstorming)

| Question | Décision |
|---|---|
| Vitrine accessible au guest | Oui — **liste de tous les logements**, **toutes villes** (pas que la sienne) |
| Barre du bas séjour | **Inchangée** (Home = page du QR, Logement, Vos favoris, Carte) |
| Blog | Va dans le **menu burger** |
| Agenda | **Conservé** |
| Météo | **Supprimée** de tout le site |
| Verrouillage | **Proxy** (robuste, niveau URL) |
| Nombre de specs | **Une seule** (Parties A + B) |

## PARTIE A — Confiner le guest en séjour

### A1. Verrouillage proxy — `src/proxy.ts`

Dans la branche `/guide/*`, la gestion du `?lodging=` (entrée QR : dépôt/rafraîchissement du cookie,
redirection city-landing vers `/`) reste **inchangée**.

Ajout : si un **cookie séjour valide est présent ET qu'il n'y a pas de `?lodging=`** dans l'URL, on
applique une **whitelist** sur le 2ᵉ segment après la ville (`/guide/{ville}/{segment}/…`) :

- Segments **autorisés** (pour n'importe quelle ville) : `logements`, `agenda`, `mes-favoris`,
  `contact`.
- **Bloqué** → `NextResponse.redirect` vers `/` (accueil séjour) :
  - la **page ville** `/guide/{ville}` (aucun 2ᵉ segment),
  - tout autre 2ᵉ segment (= slug de catégorie, `meteo`, etc.).

Les visiteurs **sans cookie** (anonymes / SEO) ne sont pas confinés : `/guide/*` reste entièrement
public pour eux (comportement actuel préservé).

Constante partagée : `GUEST_ALLOWED_GUIDE_SEGMENTS = ['logements', 'agenda', 'mes-favoris', 'contact']`.

### A2. Menu burger — `PublicMenu.tsx` (`lodgingItems`)

Items séjour = **Logements** (`/guide/{ville}/logements`), **Agenda** (`/guide/{ville}/agenda`),
**Blog** (`/blog`), **Nous Contacter** (`/guide/{ville}/contact`). Retrait de **Météo**.
Le lien « Séjour en cours : {logement} » pointe vers **`/`** (accueil séjour) au lieu de
`/guide/{ville}`.

La barre du bas (`PublicBottomNav`) reste inchangée.

### A3. Fil d'ariane vitrine / fiche logement

Sur `/guide/{ville}/logements` et `/guide/{ville}/logements/{slug}`, en **mode séjour**, neutraliser
le lien du fil d'ariane vers `/guide/{ville}` (page ville) — le rendre non cliquable ou le pointer
vers `/` — pour éviter une redirection proxy déroutante. Détection du mode via
`getActiveLodgingContext()` (déjà utilisé dans le layout).

## PARTIE B — Supprimer la météo

- Supprimer la feature `src/features/weather/` (types, queries `open-meteo`/`weather-city`,
  composants `WeatherWidget`/`WeatherScreen`/`GuideWeatherBadge`/`WeatherGlyph`, lib `weather-clock`
  /`weather-code`).
- Supprimer le route group `src/app/(weather)/` (layout + page `/guide/{ville}/meteo`).
- Retirer toutes les références :
  - `PublicMenu.tsx` — item « Météo ».
  - `src/app/(public)/guide/[city-slug]/page.tsx` — badge/section météo.
  - `src/features/trail-navigation/components/TrailPoiDetailBody.tsx` et `TrailNavigationMap.tsx` —
    bouts météo, sans casser la navigation de sentiers.
  - `src/features/categories/components/TrailCardDetails.tsx` — météo.
- Supprimer les suites de tests météo : `tests/unit/weather.public-menu.test.tsx`,
  `tests/unit/weather.open-meteo.test.ts`, `tests/integration/weather.page.test.tsx`,
  `weather.route.test.tsx`, `weather.widget.test.tsx`. Ajuster les intégrations qui référencent la
  météo (`city-guide.AC-01-03…`, `lodging-showcase.public-pages…`) si nécessaire.

## Découpage en unités

| Unité | Responsabilité | Dépend de |
|---|---|---|
| Proxy confinement | Restreindre `/guide/{ville}/*` pour le guest | cookie séjour |
| `lodgingItems` (burger) | Liste des liens séjour | — |
| Fil d'ariane vitrine/fiche | Ne pas exposer la page ville en séjour | `getActiveLodgingContext` |
| Suppression météo | Retrait feature + routes + refs + tests | — |

## Tests (TDD)

- **Proxy** (nouvelle suite unité sur `proxy()`), guest avec cookie valide, sans `?lodging=` :
  - `/guide/{ville}` → redirige vers `/`
  - `/guide/{ville}/{categorie}` → redirige vers `/`
  - `/guide/{ville}/logements`, `/guide/{autre-ville}/logements`, `/guide/{ville}/logements/{slug}`,
    `/guide/{ville}/agenda`, `/guide/{ville}/mes-favoris`, `/guide/{ville}/contact` → passent
  - `/guide/{ville}?lodging={uuid}` (entrée QR) → cookie + redirection vers
    `/nos-recommandations` ; `/` reste réservé au site éditorial public
  - visiteur **sans cookie** sur `/guide/{ville}` → non bloqué (rendu public)
- **Menu** : items séjour = Logements/Agenda/Blog/Contact, sans Météo ; lien nom → `/`.
- **Météo** : après suppression, `tsc`/build sans imports orphelins ; suites météo retirées.

## Contraintes & risques

- Ne pas casser l'**entrée QR** (`/guide/{ville}?lodging=…`) : la règle de confinement ne s'applique
  qu'en **absence** de `?lodging=`.
- Le test proxy existant [tests/unit/auth.AC-middleware.test.ts](tests/unit/auth.AC-middleware.test.ts)
  (déjà rouge — drift) devra être vérifié/mis à jour.
- La suppression météo touche `trail-navigation` : retirer les usages sans casser la carte/sentiers.

## Hors scope

- Refonte de la barre du bas (inchangée).
- Création d'un nouveau contenu Blog (on réutilise `/blog` existant).
- Neutralisation des liens au-delà du fil d'ariane vitrine (le proxy couvre le reste).
- Confinement des visiteurs anonymes (intentionnellement non confinés).
