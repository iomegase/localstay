# Audit du guide privé (`/sejour`) — 2026-10-04

Périmètre : routes `/sejour/*`, `features/guide-app`, `features/guide-pwa`, API
appelées par le guide, proxy, stockage navigateur et serveur. Méthode : lecture du
code, parcours Playwright des 8 pages du guide (local, mobile 390 px), tests de
la production (www.mystay.city), lint, typecheck, suite Jest complète.

Gravité : 🔴 critique · 🟠 importante · 🟡 mineure.

---

## 1. Sécurité

| # | Gravité | Problème | Où | Recommandation |
|---|---|---|---|---|
| S1 | 🔴 | **L'accès au guide n'expire jamais côté serveur.** L'identifiant du logement (UUID) est un jeton d'accès permanent : tout ancien voyageur qui a gardé le lien ou une photo du QR code peut rouvrir le guide indéfiniment (le cookie dure 7 jours, mais `?lodging=` le recrée à chaque fois). | `src/proxy.ts`, `lodging-cookie.ts` | Jeton par séjour (dates d'arrivée/départ, révocable), ou rotation du lien/QR entre deux séjours. |
| S2 | 🔴 | **Le code de la boîte à clés et le mot de passe Wi-Fi sont envoyés dans la page** (masqués visuellement seulement, présents dans le HTML/RSC). Combiné à S1, un ancien voyageur obtient le code actuel. | `private-guide-data.ts:214`, `GuideArrivalFlow.tsx:120` | Ne livrer le code que pendant le séjour (S1), ou le changer à chaque séjour. |
| S3 | 🟠 | **L'identifiant du logement reste dans l'URL** (`/sejour?lodging=…`) : il part dans l'historique, les captures partagées et **les outils d'analyse** (GA4 après consentement : `page_location` complet ; Vercel Analytics sans `beforeSend`). | proxy (redirige vers la même URL), `GoogleAnalyticsClient.tsx`, `(public)/layout.tsx` | Après pose du cookie, rediriger vers `/sejour` sans `lodging` (le comptage QR peut passer par un en-tête/cookie court). Filtrer `lodging` dans `beforeSend` / GA. |
| S4 | 🟠 | **Cache hors-ligne du service worker** : en navigation normale (pas seulement l'app installée), les pages du logement — dont Wi-Fi et code de boîte à clés — sont gardées dans le Cache Storage du navigateur, sans expiration. Sur un appareil partagé, elles restent lisibles. | `public/sw.js` (`handleGuideNavigation`) | Ne mettre en cache qu'en mode installé, et vider le cache à l'expiration / au changement de séjour (déjà fait en mode installé). |
| S5 | 🟠 | **Aucun en-tête de sécurité** : pas de Content-Security-Policy, pas de `X-Frame-Options` / `frame-ancestors` (le guide peut être affiché dans une iframe tierce : clickjacking), pas de `Permissions-Policy`. Seul HSTS est présent (Vercel). | `next.config.mjs` | Ajouter `frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy: geolocation=(self)`, puis une CSP. |
| S6 | 🟠 | **Formulaire de contact sans limite de débit** : seul un champ piège (honeypot). Un robot peut remplir la base et déclencher des e-mails (Resend) en boucle. | `api/public/contact-messages/route.ts` | Limite par IP (ex. Upstash / Vercel KV) + captcha léger. |
| S7 | 🟡 | Images de POI chargées **directement depuis les sites tiers** (lafermedecupelin.com, bistrotlulu.fr, …) : l'IP du voyageur leur est transmise ; un hôte pose un cookie Cloudflare `__cf_bm` ; une image en `http://` (petitsgourmands.fr) = contenu mixte. | photos POI | Rapatrier les images sur Supabase Storage (déjà utilisé) ou passer par `next/image` optimisé. |
| S8 | 🟡 | Liens `website` des POI et URL externes rendus tels quels (`href={poi.website}`) : un `javascript:` en base serait exécutable. Données saisies par l'admin/pipeline, risque faible. | `GuidePoiDetails.tsx:155`, `ActionButtons.tsx` | Valider `https?://` à l'écriture (Zod) et au rendu. |
| S9 | 🟡 | `JSON.stringify(schema)` injecté sans échappement de `</script>` (journal, hors guide privé). | `journal/[slug]/page.tsx:277` | Réutiliser `serializeJsonLd`. |

Points vérifiés **sans problème** : Markdown rendu avec `skipHtml` (pas de HTML brut) ; liens externes en `rel="noopener noreferrer"` ; API du guide (`stay-events`, `travel-times`, `internal/guide/blog`) qui prennent le logement **depuis le cookie**, jamais depuis la requête ; validation Zod ; cookie logement `httpOnly`, `secure` en production, `SameSite=Lax` ; `noindex, nofollow, noarchive` sur `/sejour` (vérifié en production) ; démo isolée du runtime PWA.

---

## 2. Données enregistrées

**Il n'est pas exact qu'aucune donnée ne soit enregistrée.** Inventaire complet :

### Côté serveur (base Supabase)

| Donnée | Table | Contenu | Personnelle ? |
|---|---|---|---|
| Scan QR | `Analytics` (`event_type = qr_scan`) | logement, ville, date | Non |
| Arrivée / départ | `LodgingStayEvent` + e-mail au propriétaire | logement, type, date | Non (mais révèle la présence dans le logement) |
| Message de contact | `ContactMessage` + e-mail | **nom, e-mail, téléphone, message** | **Oui** |
| Clics (après consentement) | `AnalyticsInteractionEvent` | page, logement, élément cliqué | Non |
| Journaux serveur | logs Vercel | erreurs (`console.error`) avec id de message | Non |

### Côté tiers

- **Vercel Web Analytics + Speed Insights** : chargés sur le guide **sans consentement** (pages vues, URL — cf. S3).
- **Google Analytics 4** : seulement après consentement, IP anonymisée, mais URL complète (S3).
- **YouTube** (sans cookie, `youtube-nocookie`) uniquement après clic sur la vidéo.
- **Sites des POI** : requêtes d'images, cookie `__cf_bm` (S7).
- **Mapbox** : tuiles de carte ; la position GPS du voyageur **n'est pas envoyée** (temps de trajet calculés depuis le logement).

### Côté appareil du voyageur

| Clé | Contenu | Durée |
|---|---|---|
| cookie `lodging_id` | id du logement | 7 jours |
| `mystay:user-location` | **position GPS précise** (après activation) | **illimitée** — à limiter (ex. 24 h) |
| `mystay:stay:<id>` | cases cochées, arrivé/parti | illimitée |
| `mystay.favorites` | favoris | illimitée |
| `mystay:pwa:<id>` | date d'installation | illimitée |
| consentement analytics | accepté/refusé | illimitée |
| Cache Storage `mystay-guide-v1` | pages du logement (Wi-Fi, code) | voir S4 |

**Décisions à prendre** pour viser « aucune donnée » : retirer Vercel Analytics/Speed Insights du guide privé (ou les soumettre au consentement), supprimer ou anonymiser `LodgingStayEvent`, durée de vie sur la position GPS, purge des messages de contact au-delà d'une durée définie (RGPD).

---

## 3. Erreurs et anomalies fonctionnelles

| # | Gravité | Problème |
|---|---|---|
| E1 | 🟠 | **Service worker en développement** : il servait d'anciens fichiers JS depuis son cache → composants obsolètes (cause du « la vidéo ne s'affiche plus »). Corrigé par l'autre session (`?development=1`, `mystay-static-v2`) — **non commité**. |
| E2 | 🟡 | `/sejour/logement/informations-pratiques` redirige vers `/consignes` : la page est inutile dans la liste hors-ligne du SW (jamais mise en cache). |
| E3 | 🟡 | 11 suites de tests rouges (16 tests), toutes liées à des libellés/écrans modifiés sans mise à jour des tests : `guide-tab-search.AC-01`, `le-logement.practical-blocks`, `private-guide-app.AC-03-04.demo-isolation`, `private-guide-stay.AC-01.stay-home`, `guide-app.practical-card-markdown`, `public-demo-private-reference.AC-02-02-03` (data, security), `public-discovery.AC-06` / `AC-01-05`, `seo.sitemap`, `poi-description-assistance.AC-05-07` (intermittent). |
| E4 | 🟡 | Champ `emergency_contacts` (personnalisation logement) saisi mais **jamais affiché** dans le guide. |
| E5 | 🟡 | Spec 027 (multilingue) `approved` mais non implémentée : tests de dérive associés. |
| E6 | 🟡 | Vue « Contact » du guide privé (`GuideContactView` + `ContactMessageForm`) **inaccessible** : plus aucun bouton n'y mène depuis le retrait du bloc « Écrire » de l'écran Réglages. Non traduite (spec 061). À supprimer ou à rebrancher. |

Typecheck : 0 erreur. Lint : 0 erreur (quelques avertissements `react-hooks`). Parcours Playwright des 8 pages : aucun message d'erreur console.

---

## 4. Code et routes non utilisés

### Composants / modules jamais importés

- `src/features/categories/components/PhotoCarousel.tsx`
- `src/features/city-guide/components/CategoryRowSkeleton.tsx`
- `src/features/guide-app/components/GuideFeaturedPoiCard.tsx`
- `src/features/guide-app/components/GuideLodgingGallery.tsx`
- `src/features/guide-demo/components/DemoGuideCard.tsx`
- `src/features/guide-demo/components/DemoMediaFrames.tsx`
- `src/features/lodging-showcase/components/LodgingBookingCta.tsx`
- `src/features/lodging-showcase/components/LodgingCard.tsx`
- `src/features/lodging-showcase/components/LodgingExcerpt.tsx`
- `src/features/public-menu/components/QrScannerButton.tsx`
- `src/shared/components/ui/separator.tsx`, `src/shared/components/ui/table.tsx` (shadcn, inoffensifs)

### Utilisés uniquement par des tests (morts en production)

- `src/features/blog/lib/public-visibility.ts`
- `src/features/categories/components/CategoryGrid.tsx`
- `src/features/categories/components/FullMap.tsx`
- `src/features/city-guide/components/CityCategoryExplorer.tsx`
- `src/features/events-acquisition/lib/commune.ts`
- `src/features/guide-app/components/PracticalMediaCard.tsx`
- `src/features/lodging-showcase/components/LodgingAmenitiesGrid.tsx`
- `src/features/lodging-showcase/components/LodgingFacts.tsx`
- `src/features/lodging-showcase/components/LodgingHeroGallery.tsx`
- `src/features/lodging-showcase/components/OwnerRecommendationsBlock.tsx`
- `src/features/public-menu/components/LeaveStayButton.tsx`
- `src/features/trails-acquisition/lib/geometry-inheritance.ts`

(Exclus car utilisés par `prisma/seed.ts` ou `scripts/` : `recommended-taxonomy.ts`, `seo-content-audit/lib/*`.)

### Routes sans aucun appelant dans le code

À confirmer avant suppression (un appel externe — webhook, cron Vercel configuré hors `vercel.json`, appel manuel — reste possible) :

- API admin analytics non appelées par l'interface (le tableau de bord lit les requêtes serveur directement) : `/api/admin/analytics/{cities,ga4-today,live,overview,pages,performance,queries,sources}`.
- `/api/admin/overview`, `/api/dashboard/overview`, `/api/merchant/onboarding/status`.
- `/api/internal/check-photo-liveness` (aucun cron dans `vercel.json`).
- `/api/internal/analytics/vercel-drain` : **à garder** si un Log Drain Vercel est configuré dans le tableau de bord.
- `/cities/[slug]/qr-code` (groupe `(admin)`) : aucun lien entrant.
- `/services-prives` : seulement dans le sitemap, aucun lien dans l'interface.
- `/login` : redirection volontaire vers `/auth/login` (anciens liens) — **à garder**.

Méthode : un fichier est « mort » si aucun fichier de `src/` ne l'importe (chemins `@/` et relatifs résolus, `jest.mock` et `import()` compris) ; une route est « sans appelant » si son chemin n'apparaît dans aucun fichier de `src/`, `vercel.json` ou `next.config.mjs`.
