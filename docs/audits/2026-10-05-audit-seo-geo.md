# Audit SEO technique, SEO local et GEO — MyStay

**Date :** 5 octobre 2026
**Périmètre :** dépôt `staylocal` (branche `main`, commit `b6b7accb`, identique à `origin/main`) et production `https://www.mystay.city`
**Mode :** lecture seule. Aucun code, aucune donnée, aucune configuration modifiés. Aucun formulaire soumis. Aucun contenu privé ouvert.

Chaque constat indique sa source :
- **[Dépôt]** : observé dans le code ;
- **[Prod]** : observé sur le site en ligne ;
- **[Hypothèse]** : déduction ou point qui nécessite des données supplémentaires.

---

## 1. Synthèse

### Principaux freins

1. **Le guide privé est ouvert à tout le monde depuis les fiches logement publiques (C-01, critique).** Chaque fiche `/logements/[slug]` contient un lien « Contacter » qui embarque l'UUID du logement (`?lodging=`). Ce lien pose un cookie invité valable 7 jours et redirige vers `/sejour`. Or cet UUID est précisément la clé d'accès au guide privé. Toute personne ou tout robot qui suit le lien obtient donc un accès « séjour ». Ce n'est pas un problème de référencement, mais c'est le défaut le plus grave de l'audit.
2. **Le serveur met environ 6,5 s à répondre sur toutes les pages publiques (C-02, critique).** C'est mesuré en production, en reproductible. La cause probable est identifiée dans le code : le layout marketing charge en séquence, à chaque requête, le détail complet de tous les logements et de tous les articles. Il le fait même pour les 404 et les redirections. S'y ajoute un écart de région : fonction Vercel à Stockholm (`arn1`), base de données en Irlande (`eu-west-1`).
3. **Toute URL inconnue renvoie un 200 au lieu d'un 404 (C-03, élevée).** C'est la page « Accès par lien », en `noindex`. Les liens cassés deviennent invisibles et des soft 404 apparaissent.
4. **Les pages légales n'existent pas (C-04, élevée).** Mentions légales, confidentialité et CGU sont liées depuis le footer de toutes les pages, mais elles renvoient la page « Accès par lien ». MyStay n'a aucune identité légale vérifiable en ligne, ce qui pèse sur la confiance, l'E-E-A-T et la conformité.
5. **Les pages locales sont trop minces (C-09, C-10, élevée).** Seules 2 communes sont publiées (Saint-Gervais-les-Bains, Saint-Nicolas-de-Véroce). Les pages Saint-Nicolas sont génériques : la page séminaire fait 369 mots, sans aucun fait vérifiable. La page conciergerie de Saint-Nicolas affiche 3 logements qui sont tous à Saint-Gervais.
6. **Les métadonnées et la structure ont des défauts systématiques (C-06 à C-08) :**
   - la marque est répétée (« — MyStay | MyStay ») sur 36 des 51 URL du sitemap ;
   - les titres des articles et des fiches logement sautent de H1 à H4 ;
   - les textes alternatifs des photos de logement sont des UUID.
7. **Le balisage `aggregateRating` des lieux recommandés reprend des notes Google (C-11, moyenne).** Ce n'est pas conforme aux règles Google sur les extraits d'avis.

### Points solides

- **Architecture public/privé bien pensée :** helper `privatePageMetadata`, `noindex` sur les espaces privés, redirections 308 de `/guide/*` vers `/decouvrir/*`, protection des dashboards par middleware.
- **Domaine canonique cohérent :** apex et `http` redirigent en 308 vers `https://www.mystay.city`.
- **Indexation propre :** chaque page publique pose son canonical, sans canonical global hérité. robots.txt et sitemap sont propres.
- **Sitemap dynamique et filtré :** il est construit depuis la base, filtre les URL privées et non canoniques (UUID, segments privés), et est revalidé à chaque publication.
- **Contenu dans le HTML initial :** les pages sont rendues côté serveur. Textes, FAQ et JSON-LD sont présents dans le HTML.
- **JSON-LD cohérent :** `@id` d'organisation stable, BreadcrumbList partout, BlogPosting, LodgingBusiness et VacationRental conditionnel, FAQ alignées sur le contenu visible.
- **Articles longs et sourcés :** 2 300 à 2 500 mots, avec des sources officielles citées (Atout France, Service Public, BOFiP). Ce sont de bons candidats à la citation par les moteurs IA.
- **Robots IA accueillis :** aucun blocage par user-agent (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, etc.), robots.txt permissif.
- **Mise en page stable :** CLS = 0 sur les 6 pages mesurées.

---

## 2. Notes

### Note SEO : 5,0 / 10

| Axe | Poids | Note | Justification |
|---|---|---|---|
| Exploration et indexation | 20 % | 6 | robots, sitemap et canonical bons, mais soft 404 global (C-03) et pages légales absentes (C-04) |
| Performance serveur et web vitals | 20 % | 3 | TTFB ≈ 6,5 s observé ; FCP observé > 6 s (C-02) |
| On-page (titles, Hn, alt) | 15 % | 6 | Titles pertinents, mais double marque, sauts H1→H4, alt UUID |
| Contenu et intentions | 20 % | 5 | Bons articles ; pages locales minces et génériques, 2 communes seulement |
| SEO local et confiance | 15 % | 4 | Aucune identité légale, pas d'adresse, pas de `sameAs`, communes ciblées limitées |
| Données structurées | 10 % | 6,5 | Base solide ; `aggregateRating` tiers, propriété `provider` invalide |

**Limites de la note :**
- elle mesure la qualité technique et éditoriale observable ;
- elle ne mesure ni positions, ni trafic, ni indexation réelle (pas d'accès à Search Console) ;
- l'autorité du domaine n'a pas été évaluée (pas d'outil de backlinks).

### Note de préparation GEO : 4,7 / 10

| Axe | Poids | Note | Justification |
|---|---|---|---|
| Accès des robots et contenu dans le HTML | 20 % | 6 | Rendu serveur et robots autorisés, mais 6,5 s de latence, risque de timeout chez certains robots [Hypothèse] |
| Clarté de l'entité MyStay | 20 % | 5 | Nom, services et zone cohérents ; pas de raison sociale, d'adresse, de `sameAs` ni de page « À propos » |
| Réponses factuelles et sourcées | 25 % | 5 | Articles sourcés ; pages locales sans faits chiffrés (tarifs, délais, capacités, distances) |
| Expertise locale originale | 20 % | 4 | Quelques détails réels (Fayet, Bettex, Chattrix) ; peu de contenu propre au terrain |
| Signaux de confiance | 15 % | 3 | Pas d'auteur nommé, pas de mentions légales, pas d'avis publiés |

**Limite :** cette note évalue la *préparation* du site. Elle ne mesure **pas** la visibilité réelle de MyStay dans les moteurs de réponse IA : aucun test n'a pu être réalisé dans ces moteurs depuis cet environnement (voir §9).

---

## 3. Couverture de l'audit et outils

| Élément | Couverture |
|---|---|
| Fichiers AGENTS.md | `AGENTS.md` racine lu. Les copies sous `.worktrees/` sont hors périmètre. |
| Routes du dépôt | 47 fichiers `page`/`layout` de `src/app/(public)`, `acces-reserve` et `(auth)`. `src/proxy.ts` lu en entier. |
| Module SEO | `src/features/seo/*`, `src/features/local-seo/*`, `src/features/blog/lib/metadata.ts`, `src/shared/components/JsonLd.tsx`, `MarkdownText.tsx` |
| Sitemap de production | **51/51 URL crawlées** (statut, en-têtes, title, description, canonical, robots, H1, JSON-LD, volume de mots) |
| URL hors sitemap | 40 URL testées : variantes de domaine, slash final, paramètres, 404 dynamiques, communes non publiées, routes privées, admin, pages légales, `llms.txt` |
| Maillage | Graphe de liens construit sur les 51 pages, footer inclus et exclu |
| Performance | Lighthouse 12.8.2 en local, mobile, throttling simulé, 6 URL, le 05/10/2026 vers 08:06–08:08 UTC. PageSpeed Insights indisponible (quota 429 de l'API publique). Pas de données terrain (CrUX ou Vercel Speed Insights non accessibles). |
| Robots | 10 user-agents testés (Googlebot, Bingbot, GPTBot, OAI-SearchBot, ChatGPT-User, ClaudeBot, Claude-SearchBot, PerplexityBot, Google-Extended, CCBot) |
| Outils | `curl`, scripts Python d'extraction (dossier de travail temporaire), Lighthouse CLI, lecture du code |
| Cadence | Une requête toutes les 0,5 à 0,6 s environ, soit moins de 150 requêtes sur la production au total |

**Écart dépôt/production :** le commit déployé n'est pas exposé publiquement. En revanche, tous les comportements observés en production correspondent au code de `main` : canonicals, sitemap, redirection de `/concept`, JSON-LD, titres. **Aucun écart n'a été détecté.** Cette conclusion reste non prouvée faute d'identifiant de build.

**Non vérifié (par choix ou faute d'accès) :**
- le contenu réel de `/sejour` via le lien public (C-01) : seule la redirection a été observée ;
- l'indexation réelle (Search Console) ;
- les données terrain des Core Web Vitals.

---

## 4. Inventaire des URL

### 4.1 Pages publiques destinées au référencement (51 URL dans le sitemap, toutes en 200)

| Modèle | Route (dépôt) | URL en prod | Canonical | Robots | JSON-LD | Intention |
|---|---|---|---|---|---|---|
| Accueil | `(public)/page.tsx` | `/` | ✔ | index | Organization, WebSite, FAQPage, Service | Marque + conciergerie Pays du Mont-Blanc |
| Conciergerie (hub) | `confier-mon-logement/page.tsx` | `/confier-mon-logement` | ✔ | index | Org, WebSite | Transactionnelle propriétaire (222 mots) |
| Conciergerie par commune | `conciergerie/[city-slug]` | `/conciergerie/saint-gervais-les-bains`, `/conciergerie/saint-nicolas-de-veroce` | ✔ | index,follow | Breadcrumb, Service, FAQPage | Transactionnelle locale |
| Séminaires (hub) | `seminaires/page.tsx` | `/seminaires` | ✔ | index | Org, WebSite | Commerciale B2B |
| Séminaire par commune | `seminaires/[city-slug]` | `/seminaires/saint-gervais-les-bains`, `/seminaires/saint-nicolas-de-veroce` | ✔ | index,follow | Breadcrumb, Service, FAQPage | Commerciale B2B locale |
| Logements (liste) | `logements/page.tsx` | `/logements` | ✔ | index | Org, WebSite | Commerciale voyageur |
| Locations par commune | `locations-vacances/[city-slug]` | 2 URL (Saint-Gervais, Saint-Nicolas) | ✔ | index,follow | Breadcrumb, ItemList, FAQPage | Commerciale locale |
| Fiche logement | `logements/[lodging-slug]` | 6 URL | ✔ | index | Breadcrumb, LodgingBusiness | Commerciale / navigationnelle |
| Découvrir (index) | `decouvrir/page.tsx` | `/decouvrir` | ✔ | index | Breadcrumb, ItemList | Informationnelle locale |
| Découvrir par commune | `decouvrir/[city-slug]` | 2 URL | ✔ | index | Breadcrumb, ItemList | Informationnelle locale |
| Catégorie | `decouvrir/[city]/[category]` | 6 URL (`diner`, `famille`, `shopping`, `culture`) | ✔ | index | Breadcrumb, ItemList | « restaurant à … » |
| Fiche POI | `decouvrir/[city]/[cat]/[poi]` | 21 URL | ✔ | index | Breadcrumb, LocalBusiness | Navigationnelle tierce |
| Journal (liste) | `journal/page.tsx` | `/journal` | ✔ (filtres ?city et ?category → canonical `/journal`) | index | Org, WebSite | Informationnelle |
| Article | `journal/[slug]` | 4 URL | ✔ | index,follow | BlogPosting | Informationnelle |

Toutes les URL du sitemap répondent en 200, sans redirection, avec un canonical identique à leur propre URL. **Aucune URL du sitemap ne redirige ni n'échoue.**

### 4.2 Redirections, routes privées et utilitaires (échantillon testé)

| URL | Statut observé (prod) | Commentaire |
|---|---|---|
| `http://mystay.city/` | 308 → `https://mystay.city/` → 308 → `https://www.mystay.city/` | **Chaîne de 2 sauts** (C-14) |
| `https://mystay.city/*` | 308 → `www` | OK |
| `/logements/` (slash final) | 308 → `/logements` | OK |
| `/concept` | 308 → `/`, mais après **6,6 s** | Redirection exécutée dans la page, après le layout lent (C-02) |
| `/blog/*` | 308 → `/journal/*` | OK (`next.config`) |
| `/guide/{ville}` et `/guide/{ville}/{cat}/{poi}` | 308 → `/decouvrir/...` | OK |
| `/guide/{ville}/agenda`, `/sejour`, `/le-logement`, `/map`, `/contact` | 200 « Accès par lien », noindex | Contrôle d'accès par cookie, réécriture vers la page de blocage |
| `/admin`, `/dashboard`, `/merchant` | 307 → `/auth/login` | OK |
| `/auth/login`, `/auth/register` | 200, noindex | OK |
| `/mentions-legales`, `/confidentialite`, `/cgu` | **200 « Accès par lien »**, noindex | **Routes inexistantes** (C-04) |
| `/page-inexistante-audit` | **200 « Accès par lien »**, noindex | **Soft 404** (C-03) |
| `/decouvrir/ville-inexistante`, `/logements/inexistant`, `/journal/inexistant`, `/conciergerie/megeve`, `/conciergerie/combloux`, `/locations-vacances/les-houches`, `/seminaires/megeve` | 404, noindex | Bon statut, mais 6,3 à 7,2 s (C-02) |
| `/journal?city=inconnue` | 404 | OK |
| `/llms.txt` | 404 | Voir §9 |

### 4.3 Pages absentes du sitemap ou du maillage

- **[Dépôt]** `/concept` existe mais redirige : c'est normal qu'elle soit absente du sitemap.
- **[Prod]** Aucune page publique indexable n'est orpheline. Profondeur de clic depuis l'accueil : 15 URL à 1 clic, 35 à 2 clics.
- **[Prod]** Les pages locales (conciergerie, séminaire, location par commune) ne reçoivent que **2 liens entrants hors footer**, tous depuis leurs pages sœurs. Leur maillage repose presque entièrement sur le footer (C-12).
- **[Prod]** Les fiches logement font des liens vers `/guide/{ville}/contact?lodging=<UUID>` : URL privées et paramétrées (C-01).
- **[Dépôt et Prod]** Les Contamines-Montjoie accueille un logement publié (`/logements/la-pieuca`) mais n'a aucune page `/decouvrir` ni aucune page locale.

**Communes réellement ciblées :**
- **[Prod]** Saint-Gervais-les-Bains et Saint-Nicolas-de-Véroce, avec des pages dédiées.
- **[Prod]** Les Contamines-Montjoie : un logement seulement.
- **[Dépôt et Prod]** Megève, Combloux et Les Houches n'ont **aucune page** et ne sont mentionnées dans aucun contenu visible. « Megève » n'apparaît que dans les scripts embarqués (payload de démonstration, voir C-02).

---

## 5. Constats détaillés

Format de chaque constat : gravité, périmètre, preuve, fichier, conséquence, correction, effort, confiance, validation.

### C-01 — Le lien « Contacter » des fiches logement publiques ouvre le guide privé — **Critique** (révisé : **Moyenne**)

> **Révision du 2026-10-05 après vérification en base :** l'identifiant publié est celui de la vitrine (`LodgingPublicProfile.id`), qui ne correspond à aucun `Lodging.id` (0 sur 6 profils publiés). Le guide privé cherche le logement par `Lodging.id` : il n'est donc **pas** exposé. Le défaut réel est un parcours de contact cassé pour les visiteurs (cookie de séjour inutile puis écran « Accès par lien »). Il reste une faiblesse : le proxy accepte n'importe quel UUID bien formé comme cookie de séjour. Corrigé par l'amendement 028 du 2026-10-05 (deux modales de contact).

- **Périmètre :** les 6 fiches `/logements/*`, ainsi que tout robot ou toute personne qui suit le lien.
- **Preuve [Dépôt] :** `src/app/(public)/logements/[lodging-slug]/page.tsx:98` construit `const contactHref = \`${contextualContactPath(citySlug)}?lodging=${detail.id}\``. `src/proxy.ts:107-128` : si la requête vers `/guide/*` porte un `?lodging=` qui est un UUID valide, le proxy pose le cookie `lodging_id` (7 jours) et redirige vers `/sejour?lodging=…`.
- **Preuve [Prod] :** `GET /guide/saint-gervais-les-bains/contact?lodging=e91aa06d-…` renvoie `307 location: /sejour?lodging=e91aa06d-…` avec `set-cookie: lodging_id=…; Max-Age=604800; HttpOnly`. La redirection n'a volontairement **pas** été suivie.
- **Conséquence :**
  - Le guide privé (instructions d'arrivée, Wi-Fi, consignes) devient accessible à quiconque lit le HTML public. Les robots découvrent aussi ces URL.
  - `noindex` et `robots.txt` ne protègent pas l'accès.
  - [Hypothèse] Selon le contenu des instructions d'arrivée (codes de boîte à clés, digicode), le risque touche la sécurité physique des logements.
- **Correction :**
  1. Pointer « Contacter » vers une route publique sans identifiant, par exemple `/confier-mon-logement` ou un formulaire de contact public avec un `slug` de logement non secret.
  2. À moyen terme, ne plus utiliser l'UUID de la base comme jeton d'accès : un jeton dédié, révocable et associé à un séjour.
- **Effort :** faible pour (1), élevé pour (2). **Confiance :** élevée.
- **Validation :**
  - `grep -r "?lodging=" src/app/(public)/logements` ne renvoie plus rien ;
  - le HTML de production des fiches ne contient plus d'UUID ;
  - test e2e : un visiteur anonyme qui clique sur « Contacter » ne reçoit pas de cookie `lodging_id`.

### C-02 — TTFB d'environ 6,5 s sur toutes les pages marketing — **Critique**

- **Périmètre :** les 51 URL du sitemap, les 404 dynamiques et `/concept`. Les routes non marketing (`/acces-reserve`, `/guide/*` en 308) répondent en 0,2 à 0,85 s.
- **Preuve [Prod] :**
  - curl donne un `time_starttransfer` de 5,9 à 7,4 s sur les 51 URL, stable sur des requêtes répétées : il ne s'agit pas d'un démarrage à froid.
  - En-têtes : `cache-control: private, no-cache, no-store`, `x-vercel-cache: MISS`, `x-vercel-id: fra1::arn1::…`.
  - Lighthouse (mobile, 05/10/2026) : document principal terminé à 5,97–6,91 s, **FCP observé de 6,07 à 7,06 s**. Les scores de performance simulés (66 à 90) et le TTFB annoncé à 50 ms sont **trompeurs**, car le modèle Lantern n'a pas intégré l'attente serveur (`responseHeadersEndTime` absent).
- **Preuve [Dépôt] :**
  - `src/app/(public)/layout.tsx:20-50` : `headers()` rend toutes les pages dynamiques. Pour chaque route marketing, il appelle `getGuideDemoPublishedContent()` et `getFooterLocalLandingLinks()`.
  - `src/features/marketing/queries/guide-demo-content.ts:23-35, 75-86, 108-115` : pour **chaque logement** puis **chaque article**, il appelle en séquence `getPublishedLodgingDetailBySlug` et `getPublishedBlogArticleBySlug` (« chargement séquentiel » assumé dans le commentaire). Soit environ 12 requêtes en série, multipliées par le nombre de sous-requêtes de chaque détail.
  - `vercel.json` : `"regions": ["arn1"]` (Stockholm). La base est en `eu-west-1` (Irlande, d'après l'hôte du pooler, sans exposer d'identifiant). Chaque aller-retour coûte donc environ 30 à 40 ms [Hypothèse : latence typique entre ces régions].
  - Le payload est ensuite sérialisé dans un Client Component (`DemoPublishedContentProvider`). Une page catégorie de 117 mots pèse **173 Ko de HTML** et embarque le markdown complet des 4 articles.
- **Conséquence :**
  - Expérience très dégradée : rien ne s'affiche pendant plus de 6 s sur mobile.
  - LCP terrain probablement « mauvais » [Hypothèse : pas de données CrUX].
  - Budget de crawl réduit et risque de timeout chez les robots IA qui récupèrent les pages à la demande [Hypothèse].
  - Chaque nouveau logement ou article allonge encore le délai, car la durée croît linéairement.
- **Correction :**
  1. Ne charger le contenu de démonstration **que** là où il est affiché (le téléphone de démo de l'accueil), en version allégée (cartes, sans le markdown complet), de façon paresseuse ou via un endpoint dédié.
  2. Retirer `headers()` du layout. Le choix de mise en page marketing ou privée peut passer par des route groups distincts. Rendre ensuite les pages marketing statiques ou ISR (`revalidate`). Les `revalidatePath` existent déjà pour la publication.
  3. Aligner la région de la fonction sur la base (`dub1`, Dublin) ou l'inverse.
  4. Mettre les requêtes restantes en `Promise.all` ou les mettre en cache (`unstable_cache` / `'use cache'` selon la configuration Next 16).
- **Effort :** moyen. **Confiance :** élevée sur la cause principale (le layout est le seul point commun des routes lentes) ; moyenne sur la part de la latence inter-régions.
- **Validation :**
  - `curl -w "%{time_starttransfer}"` sous 0,8 s sur les 51 URL ;
  - `x-vercel-cache: HIT` sur les pages ISR ;
  - HTML d'une page catégorie sous 60 Ko ;
  - Vercel Speed Insights : TTFB p75 et LCP p75 à suivre.

### C-03 — Soft 404 sur toutes les URL inconnues — **Élevée**

- **Périmètre :** toute URL hors des préfixes marketing, guide et auth (par exemple `/page-inexistante-audit`, `/mentions-legales`).
- **Preuve [Dépôt] :** `src/proxy.ts:212-219` : toute route non reconnue sans cookie de séjour est réécrite (`NextResponse.rewrite`) vers `/acces-reserve`, ce qui donne un **200**.
- **Preuve [Prod] :** `/page-inexistante-audit` renvoie 200 « Accès par lien | MyStay » avec `noindex, nofollow, noarchive`.
- **Conséquence :**
  - Les liens cassés, entrants comme internes, deviennent indétectables (Search Console les classera en « soft 404 » ou « exclue par noindex ») ;
  - le PageRank des backlinks mal formés est perdu ;
  - le diagnostic est faussé (C-04 en est un exemple).
  - Le `noindex` limite le risque d'indexation : la gravité n'est pas critique.
- **Correction :** limiter la réécriture vers la page de blocage aux seules routes privées connues (`/le-logement`, `/map`, `/mes-favoris`, `/nos-recommandations`, `/services-prives`, `/contact`, `/sejour/*`). Laisser les autres tomber sur le `not-found` de Next, qui renvoie un 404.
- **Effort :** faible. **Confiance :** élevée.
- **Validation :** `curl -o /dev/null -w "%{http_code}" https://www.mystay.city/xyz` doit renvoyer 404, et `/sejour` sans cookie doit toujours afficher la page de blocage.

### C-04 — Pages légales inexistantes, liées depuis toutes les pages — **Élevée**

- **Preuve [Dépôt] :** `src/features/marketing/components/MarketingFooter.tsx:53-55` fait des liens vers `/mentions-legales`, `/confidentialite` et `/cgu`. Aucune route correspondante dans `src/app`. Un cadrage existe : `docs/legal/2026-10-05-pages-legales-cadrage.md`, statut « préparation ».
- **Preuve [Prod] :** les 3 URL renvoient 200 « Accès par lien ».
- **Conséquence :**
  - Aucune identité légale visible (éditeur, raison sociale, SIRET, hébergeur) ;
  - signal de confiance faible pour Google (qualité, E-E-A-T) et pour les moteurs IA ;
  - [Hypothèse juridique, à confirmer] obligation LCEN pour les mentions légales et RGPD pour la politique de confidentialité, d'autant que le site charge Google Analytics après consentement ;
  - 51 liens internes mènent à un contenu inutile.
- **Correction :** publier les 3 pages (une fois les informations juridiques fournies). Les ajouter au `staticPaths` du sitemap (optionnel pour les CGU).
- **Effort :** faible côté technique ; dépend des informations juridiques. **Confiance :** élevée.
- **Validation :** 200 avec contenu réel et `index` ou `noindex` selon le choix fait ; liens du footer fonctionnels.

### C-05 — Chaîne de redirection http-apex — **Faible**

- **[Prod]** `http://mystay.city/` → `https://mystay.city/` → `https://www.mystay.city/` (2 sauts, 308).
- **Correction :** redirection directe de `http://mystay.city` vers `https://www.mystay.city` dans les réglages de domaine Vercel.
- **Effort :** faible. **Confiance :** élevée.
- **Validation :** `curl -I http://mystay.city/` renvoie un seul saut.

### C-06 — Marque répétée dans les titles — **Moyenne**

- **Périmètre :**
  - 21 fiches POI, 6 catégories, 2 pages `/decouvrir/[ville]`, 6 fiches logement, `/journal` ;
  - exemples : « Le Royal à Saint-Gervais-les-Bains — MyStay | MyStay », « Chalet Hygge — Séjour MyStay | MyStay », « Journal MyStay — Guides locaux et conseils de séjour | MyStay ».
- **Preuve [Dépôt] :**
  - `src/app/layout.tsx:48` définit `template: '%s | MyStay'` ;
  - `src/features/seo/lib/metadata.ts:323-324, 388-389, 438-439, 534-535` et `src/features/blog/lib/metadata.ts:27-29` intègrent déjà « MyStay » sans `title.absolute`.
- **Conséquence :** titles plus longs que nécessaire, troncature des noms longs (POI Fred Penz : 108 caractères), aspect peu soigné dans les SERP. Pas un facteur de classement direct.
- **Correction :** retirer « — MyStay » ou « Séjour MyStay » de ces fonctions et laisser le template ajouter la marque. Exemples au §8.
- **Effort :** faible. **Confiance :** élevée.
- **Validation :** aucun `<title>` ne contient deux fois « MyStay » (script de crawl du sitemap).

### C-07 — Hiérarchie des titres décalée dans le markdown — **Moyenne**

- **Preuve [Dépôt] :** `src/shared/components/MarkdownText.tsx:24-32` convertit le markdown `#` en `<h3>`, `##` en `<h4>` et `###` en `<h5>`.
- **Preuve [Prod] :**
  - articles : H1 puis directement 14 H4 (`/journal/comment-preparer-…`) ;
  - fiches logement : H2 puis H4 ;
  - Lighthouse signale `heading-order` sur ces deux modèles.
- **Conséquence :** la structure des sections est moins lisible pour les moteurs et les lecteurs d'écran. Elle facilite moins l'extraction de passages par les moteurs IA.
- **Correction :** pour les articles, faire correspondre `##` à `h2` et `###` à `h3` (composant dédié à `BlogMarkdown`). Pour les fiches logement, faire partir les sections markdown de `h3` sous le H2 de section.
- **Effort :** faible. **Confiance :** élevée.
- **Validation :** l'audit Lighthouse `heading-order` passe ; extraction H1→H2→H3 continue.

### C-08 — Textes alternatifs des images — **Moyenne**

- **[Prod]**
  - Photos de logement avec `alt="45bd1b02 d2a0 42f2 ad5b d93a2e753b9d"`, un nom de fichier UUID, y compris pour l'**élément LCP** de `/logements/les-hauts-de-saint-gervais`.
  - Images d'articles avec des alt de type mots-clés (« conciergerie my stay saint gervais les bains », « seminaire a saint gervais les bains »), sans accents et sans rapport avec l'image.
- **[Dépôt]** Le champ `alt` vient de la table des photos de logement (`public-lodgings.ts:83`). Aucun texte de repli descriptif n'est prévu (par exemple pièce + titre du logement).
- **Correction :**
  - texte de repli `${roomLabel} — ${title}` quand l'alt ressemble à un identifiant ;
  - alt descriptifs et naturels pour les images d'articles ;
  - contrôle dans l'admin (refus des alt de type UUID ou nom de fichier).
- **Effort :** faible. **Confiance :** élevée.
- **Validation :** aucune balise `alt` ne correspond à `/^[0-9a-f]{8} /`.

### C-09 — Pages locales Saint-Nicolas-de-Véroce minces et génériques — **Élevée**

- **[Prod]** Volumes de mots du HTML visible :

| Page | Saint-Gervais | Saint-Nicolas |
|---|---|---|
| `/seminaires/…` | 605 | 369 |
| `/conciergerie/…` | 735 | 699 |
| `/locations-vacances/…` | 701 | 467 |

  - `/seminaires/saint-nicolas-de-veroce` : aucun lieu, aucune capacité, aucune distance, aucun accès, aucune saison. Phrases du type « Le village convient aux formats qui privilégient la proximité… ».
  - `/conciergerie/saint-nicolas-de-veroce` : section « Des logements déjà confiés à MyStay » qui n'affiche que 3 logements de **Saint-Gervais**. Pourtant « La ferme des Places » est à Saint-Nicolas.
  - Similarité de texte (Jaccard sur des 5-grammes) : conciergerie SG/SN 0,17 et locations SG/SN 0,19, soit une duplication modérée. Séminaires SG/SN : 0,02. Le texte n'est pas dupliqué, mais il est générique.
- **[Dépôt]** `src/app/(public)/conciergerie/[city-slug]/page.tsx:51-54` appelle `listPublishedLodgings({ limit: 3 })` sans filtre de commune.
- **Conséquence :** risque d'être perçue comme une page satellite (*doorway*) au sens des règles anti-spam de Google, faible valeur pour la requête locale et contradiction visible.
- **Correction :**
  - filtrer les logements par commune, avec repli explicite (« À proximité : … ») ;
  - enrichir avec des faits vérifiables : temps d'accès (Le Fayet / gare SNCF, Genève), secteurs desservis, contraintes d'hiver, saisonnalité, lieux de séminaire réellement disponibles, capacité ;
  - si le contenu ne peut pas être différencié, ne pas publier la page séminaire de Saint-Nicolas (ou la mettre en `noindex`) plutôt que de la laisser mince.
- **Effort :** moyen (éditorial). **Confiance :** élevée sur le constat ; moyenne sur l'effet réel sur le classement.
- **Validation :** relecture éditoriale ; logements affichés tous dans la commune ou étiquetés « à proximité » ; suivi des impressions par page dans Search Console.

### C-10 — Couverture communale limitée et incohérente — **Moyenne**

- **[Prod]** Seules 2 communes ont des pages. Les Contamines-Montjoie accueille un logement publié (« La pieuca ») sans aucune page de commune. Megève, Combloux et Les Houches sont absentes.
- **[Dépôt]** Le schéma `Organization.areaServed` (`structured-data.ts:125-134`) ne liste que Saint-Gervais et Saint-Nicolas. C'est cohérent avec la réalité observée.
- **Recommandation :** n'ouvrir une commune **que** si l'activité y est réelle (logements gérés, interventions) et si un contenu propre peut être produit. Les Contamines-Montjoie est la candidate naturelle (un logement existe). Ne pas créer de pages pour Megève, Combloux ou Les Houches sans activité.
- **Effort :** moyen. **Confiance :** moyenne.
- **Validation :** chaque nouvelle page locale contient au moins un logement ou un cas réel dans la commune et des faits propres.

### C-11 — `aggregateRating` des POI issu de Google — **Moyenne**

- **[Dépôt]** `structured-data.ts:444-458` et `678-693` émettent `aggregateRating` à partir de `rating` et `rating_count`, alimentés par Google Places (`src/features/poi-acquisition/lib/google-places.ts`).
- **[Prod]** `/decouvrir/saint-gervais-les-bains/diner/le-royal` : « Note 4 / 5 · 659 avis » visible et balisé.
- **Conséquence :** les règles Google sur les extraits d'avis interdisent de baliser des notes agrégées depuis d'autres sites. Risque d'action manuelle sur les données structurées, en plus d'une absence d'attribution visible.
- **Correction :** retirer `aggregateRating` du JSON-LD des POI. Pour l'affichage visible, vérifier les conditions d'attribution de Google Places [Hypothèse : obligations de la licence Places API].
- **Effort :** faible. **Confiance :** élevée sur la règle Google.
- **Validation :** test des résultats enrichis : aucun `aggregateRating` sur `/decouvrir/*`.

### C-12 — Maillage des pages locales concentré dans le footer — **Moyenne**

- **[Prod]** Hors footer, chaque page locale reçoit seulement 2 liens, venus de ses pages sœurs.
  - L'accueil, `/confier-mon-logement`, `/seminaires` et `/logements` ne font aucun lien éditorial vers les pages communales.
  - Les articles ne font pas de lien vers les pages locales.
  - `/decouvrir/saint-gervais-les-bains` ne fait pas de lien vers `/locations-vacances/saint-gervais-les-bains`.
- **Correction :**
  - blocs contextuels « Par commune » sur `/confier-mon-logement` (vers conciergerie), `/seminaires` (vers séminaires) et `/logements` (vers locations) ;
  - liens éditoriaux depuis les articles (séminaire → `/seminaires/saint-gervais-les-bains`, classement des meublés → `/conciergerie/saint-gervais-les-bains`) ;
  - lien « Où dormir » depuis `/decouvrir/[ville]`.
- **Effort :** faible. **Confiance :** élevée.
- **Validation :** au moins 5 liens entrants hors footer par page locale (recrawl).

### C-13 — Images non optimisées et préchargements excessifs — **Moyenne**

- **[Dépôt]** `unoptimized` sur les galeries et cartes de logement : `LodgingMarketingGallery.tsx:51,66,79`, `CompactLodgingCard.tsx:20`, `LocalRentalCard.tsx:26`, `MarketingPropertyCard.tsx:38`, `journal/page.tsx:126`, `journal/[slug]/page.tsx:254`.
- **[Prod]**
  - Les photos servies sont les originaux Supabase (AVIF de 200 à 360 Ko, non redimensionnés pour mobile).
  - `/logements/les-hauts-de-saint-gervais` : **14 préchargements d'images**, poids total de 6 015 Ko, LCP simulé de 10,5 s.
  - Accueil : 3 508 Ko.
  - L'image LCP des POI est chargée en direct depuis un site tiers (`restaurant-leroyal.com`, format 500×500).
- **Correction :**
  - passer par l'optimiseur Next (le domaine est déjà autorisé dans `remotePatterns`) ou par la transformation d'images Supabase ;
  - `priority` et `fetchpriority="high"` sur la seule image principale ;
  - `loading="lazy"` sur le reste de la galerie ;
  - copier les images de POI dans le stockage MyStay plutôt que de les charger depuis le site tiers.
- **Effort :** faible à moyen. **Confiance :** élevée.
- **Validation :** Lighthouse « Properly size images », poids de la page logement sous 1,5 Mo, au plus 1 préchargement d'image.

### C-14 — Défauts éditoriaux et données incohérentes — **Faible à moyenne**

- **[Prod]**
  - `Envie de séjourner au La pieuca ?` et `au Les Hauts de Saint-Gervais` (`logements/[lodging-slug]/page.tsx:231`).
  - Libellé de zone « saint gervais les bains » en minuscules sans accents sur les cartes logement (champ `public_area_label`).
  - Description de commune « haute savoie, Auvergne Rhones Alpes » (données de la ville, `metadata.ts:326-339`).
  - La pieuca : « Surface 160 m² » dans les données structurées contre « 170 m² » répété dans le texte.
  - Le Royal : horaires balisés et affichés « 12:00–22:00 tous les jours » alors que la description dit « ouvert du mardi au dimanche midi ».
  - Titre du logement « Appartement  Vue  Mont Blanc  - 6 p » avec espaces doubles ; le slug `appart-luxe-…` diverge du titre.
  - Slug d'article `article-f7e6dcbc` (restaurants d'altitude de Saint-Nicolas) : slug non descriptif.
  - Fil d'Ariane des articles « Accueil / Guide / Saint-Gervais-les-Bains / Journal », alors que le JSON-LD de l'article n'a pas de BreadcrumbList.
  - `BlogPosting.alternativeHeadline` contient une suite de mots-clés (« classement touristique saint gervais les bains »).
- **Correction :**
  - formuler « Envie de séjourner à {title} ? » ou « dans ce logement » ;
  - normaliser les libellés en admin (validation : majuscules, accents) ;
  - mettre à jour les données ;
  - renommer le slug avec une redirection 308 (même mécanisme que dans `next.config`) ;
  - supprimer `alternativeHeadline` ou y mettre un vrai sous-titre.
- **Effort :** faible. **Confiance :** élevée.

### C-15 — Données structurées : compléments et corrections — **Faible**

- **[Dépôt]**
  - `LodgingBusiness.provider` (`structured-data.ts:794-796`) : `provider` n'est pas une propriété de `LodgingBusiness` (hérite d'`Organization` et de `Place`). Le validateur Schema.org le signalera.
  - `WebSite` n'a pas d'`@id` (`structured-data.ts:156-174`).
  - `organizationId()` est codé en dur sur `https://www.mystay.city` (`site.ts:32-34`), alors que les autres URL utilisent `NEXT_PUBLIC_BASE_URL`. C'est cohérent en production, mais divergent en préproduction.
  - `BlogPosting` sans `dateModified`, et `author` = Organization (aucune personne).
  - `/seminaires` et `/logements` : aucun JSON-LD propre, alors que `/seminaires` a une FAQ visible et que `/logements` est une liste.
  - Organization sans `sameAs` ni `address`.
- **[Règles Google]**
  - Les résultats enrichis FAQ sont réservés depuis 2023 aux sites gouvernementaux et de santé faisant autorité : le balisage `FAQPage` reste valide en Schema.org, mais **n'apporte pas de résultat enrichi** à MyStay.
  - `VacationRental` n'est exploité par Google que via son programme partenaires (flux de location de vacances) : balisage valide, éligibilité aux résultats enrichis non garantie.
- **Corrections :** voir les exemples au §8.
- **Effort :** faible. **Confiance :** élevée (validité) ; moyenne (bénéfice).
- **Validation :** validator.schema.org sans erreur ; test des résultats enrichis Google sur 1 URL par modèle.

### C-16 — Page `/confier-mon-logement` faible pour l'intention principale — **Moyenne**

- **[Prod]** 222 mots, H1 « Parlons de votre logement. », title « Confier mon logement | MyStay », description générique « Parlez-nous de votre logement en Haute-Savoie… ».
- **Conséquence :** la page cible la requête de marque plutôt que l'intention « confier son logement à une conciergerie ». Elle est le parent du fil d'Ariane des pages conciergerie, mais n'en est pas le hub.
- **Correction :** en faire le hub conciergerie avec :
  - services ;
  - modèle de rémunération ou fourchette, si MyStay accepte de l'afficher (décision business) ;
  - processus ;
  - zone ;
  - liens vers chaque `/conciergerie/{commune}` ;
  - title du type « Confier son logement à une conciergerie au Pays du Mont-Blanc ».
- **Effort :** moyen. **Confiance :** moyenne.

### C-17 — Fiches POI : contenu tiers et faible valeur ajoutée — **Moyenne**

- **[Prod]**
  - 21 fiches de 170 à 230 mots, avec une description unique, l'adresse, les horaires et la note.
  - Le CTA est orienté propriétaires (« Offrez ces recommandations à vos voyageurs »).
  - L'audit interne `docs/audits/seo-content-quality-2026-08-28.md` signalait déjà 7 fiches `EXTERNAL_SOURCE_REVIEW_REQUIRED`.
- **[Hypothèse]** Une partie des descriptions est reformulée depuis des sources tierces (Google Places, sites des établissements). Elles apportent peu d'information originale par rapport à Google Maps.
- **Correction :**
  - ajouter un avis ou un conseil MyStay réellement vécu (« pourquoi on le recommande », pour qui, quand) ;
  - ajouter un lien vers les autres adresses proches ;
  - n'indexer que les fiches enrichies (`noindex` temporaire pour les autres).
- **Effort :** moyen. **Confiance :** moyenne.

---

## 6. Tableau des corrections priorisées

| Prio | ID | Gravité | Correction | Effort | Confiance | Type |
|---|---|---|---|---|---|---|
| P0 | C-01 | Critique | Retirer `?lodging=<UUID>` du lien « Contacter » public | Faible | Élevée | Défaut avéré (sécurité) |
| P0 | C-02 | Critique | Sortir le chargement de démo du layout marketing, ISR, région | Moyen | Élevée | Défaut avéré |
| P1 | C-03 | Élevée | Vrais 404 pour les URL inconnues | Faible | Élevée | Défaut avéré |
| P1 | C-04 | Élevée | Publier mentions légales, confidentialité, CGU | Faible (tech.) | Élevée | Défaut avéré |
| P1 | C-09 | Élevée | Différencier ou dépublier les pages Saint-Nicolas minces ; filtrer les logements par commune | Moyen | Élevée | Défaut avéré + éditorial |
| P1 | C-11 | Moyenne | Retirer `aggregateRating` des POI | Faible | Élevée | Défaut avéré (conformité) |
| P2 | C-06 | Moyenne | Supprimer la double marque des titles | Faible | Élevée | Défaut avéré |
| P2 | C-07 | Moyenne | Corriger la hiérarchie Hn du markdown | Faible | Élevée | Défaut avéré |
| P2 | C-08 | Moyenne | Alt descriptifs (logements, articles) | Faible | Élevée | Défaut avéré |
| P2 | C-13 | Moyenne | Optimiser les images, réduire les préchargements | Faible-moyen | Élevée | Défaut avéré |
| P2 | C-12 | Moyenne | Maillage contextuel vers les pages locales | Faible | Élevée | Opportunité |
| P2 | C-16 | Moyenne | Renforcer `/confier-mon-logement` comme hub | Moyen | Moyenne | Opportunité |
| P3 | C-14 | Faible-moy. | Corrections éditoriales et données | Faible | Élevée | Défaut avéré |
| P3 | C-15 | Faible | Compléments JSON-LD | Faible | Élevée | Opportunité |
| P3 | C-17 | Moyenne | Enrichir les fiches POI (valeur MyStay) | Moyen | Moyenne | Opportunité |
| P3 | C-10 | Moyenne | Ouvrir Les Contamines-Montjoie si l'activité le justifie | Moyen | Moyenne | Opportunité |
| P3 | C-05 | Faible | Redirection apex en un seul saut | Faible | Élevée | Défaut avéré |

---

## 7. Cartographie des intentions et risques de cannibalisation

Requêtes données à titre d'exemples qualitatifs : **aucun volume ni aucune position n'est estimé**.

| Famille | URL cible | Intention | Exemples de requêtes |
|---|---|---|---|
| Conciergerie (générique) | `/` | Commerciale, marque | « conciergerie pays du mont-blanc », « mystay conciergerie » |
| Conciergerie (hub propriétaire) | `/confier-mon-logement` | Transactionnelle | « confier son chalet à une conciergerie », « conciergerie location saisonnière haute-savoie » |
| Conciergerie locale | `/conciergerie/{commune}` | Transactionnelle locale | « conciergerie saint-gervais-les-bains », « conciergerie airbnb saint-nicolas-de-véroce » |
| Location voyageur | `/logements`, `/locations-vacances/{commune}` | Commerciale | « location chalet saint-gervais », « appartement vue mont-blanc location » |
| Fiche logement | `/logements/{slug}` | Navigationnelle / transactionnelle | « chalet rémy saint-gervais », « chalet 26 personnes saint-gervais » |
| Séminaire | `/seminaires`, `/seminaires/{commune}` | Commerciale B2B | « séminaire mont-blanc », « chalet séminaire 20 personnes haute-savoie » |
| Article séminaire | `/journal/organiser-un-seminaire-…` | Informationnelle B2B | « programme séminaire 2 jours montagne » |
| Articles propriétaires | `/journal/classement-…`, `/journal/comment-preparer-…` | Informationnelle | « classement meublé de tourisme démarche », « préparer un airbnb haut de gamme » |
| Découvrir | `/decouvrir/{commune}/{catégorie}` | Informationnelle locale | « restaurant saint-nicolas-de-véroce », « que faire à saint-gervais en famille » |
| Article restaurants | `/journal/article-f7e6dcbc` | Informationnelle locale | « restaurant d'altitude saint-nicolas-de-véroce » |

**Risques de cannibalisation :**

1. **`/seminaires` et `/seminaires/saint-gervais-les-bains` : risque élevé.**
   - Titles quasi identiques (« Séminaire d'entreprise en Haute-Savoie, au pied du Mont-Blanc » / « Séminaire d'entreprise à Saint-Gervais-les-Bains, au pied du Mont-Blanc »).
   - Le même Chalet Rémy est mis en avant, avec 24 % de recouvrement de texte.
   - Comme toute l'offre réelle est à Saint-Gervais, les deux pages ciblent la même intention.
   - Piste : `/seminaires` porte l'offre (chalet, formats) et le territoire ; la page communale apporte le local (accès, activités, lieux) ou disparaît au profit du hub.
2. **`/logements` et `/locations-vacances/saint-gervais-les-bains` : risque moyen.** Le second liste 4 des 6 logements du premier. Il faut différencier par le contenu local et faire un lien de l'une vers l'autre.
3. **`/` et `/conciergerie/saint-gervais-les-bains` : risque faible.** La répartition voulue par la spec 042 est respectée : l'accueil cible « Pays du Mont-Blanc », la page locale cible « Saint-Gervais-les-Bains ». À surveiller dans Search Console (requêtes partagées).
4. **`/decouvrir/saint-nicolas-de-veroce/diner` et `/journal/article-f7e6dcbc` : risque moyen.** Les deux traitent des restaurants de Saint-Nicolas. Il faut un lien réciproque, et l'article doit garder un angle « pistes / altitude » distinct.

---

## 8. Exemples corrigés

### 8.1 Titles (C-06)

```ts
// src/features/seo/lib/metadata.ts — le template racine ajoute « | MyStay »
const title = `${poi.name} à ${poi.city.name}`                      // discoveryPoiMetadata
const title = `${category.name} à ${category.city.name}`            // discoveryCategoryMetadata
const title = `Que faire à ${city.name} : adresses locales`         // discoveryCityMetadata
const title = `${input.title} — location à ${cityName}`             // lodgingDetailMetadata
// src/features/blog/lib/metadata.ts
const title = input.city ? `Journal ${input.city.name}` : 'Journal — guides locaux et conseils de séjour'
```

Résultat : « Le Royal à Saint-Gervais-les-Bains | MyStay » ; « Chalet Hygge — location à Saint-Gervais-les-Bains | MyStay ».

### 8.2 Métadonnées de pages faibles

| Page | Title proposé | Description proposée |
|---|---|---|
| `/confier-mon-logement` | Confier son logement à une conciergerie au Pays du Mont-Blanc | Chalet ou appartement à Saint-Gervais-les-Bains ou Saint-Nicolas-de-Véroce : voyageurs, ménage, linge et suivi du logement. Premier échange et visite sans engagement. |
| `/seminaires/saint-nicolas-de-veroce` | À réécrire seulement si le contenu devient spécifique (lieu, capacité, accès) | — |

### 8.3 Maillage (C-12)

Sur `/confier-mon-logement`, sous le processus :

> **Nous intervenons à** [Saint-Gervais-les-Bains](/conciergerie/saint-gervais-les-bains) — centre, Le Fayet, Le Bettex — et à [Saint-Nicolas-de-Véroce](/conciergerie/saint-nicolas-de-veroce).

Dans l'article « Organiser un séminaire de deux jours en montagne » : lien contextuel vers `/seminaires/saint-gervais-les-bains` sur la mention du chalet.

### 8.4 JSON-LD (C-11, C-15)

```jsonc
// Organization — compléter seulement avec des données réelles et vérifiables
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://www.mystay.city/#organization",
  "name": "MyStay",
  "legalName": "<raison sociale réelle>",
  "url": "https://www.mystay.city",
  "logo": { "@type": "ImageObject", "url": "https://www.mystay.city/mystay-logo-approved/mystay-logo-approved@4x.png" },
  "email": "bonjour@mystay.city",
  "telephone": "+33607859058",
  "sameAs": ["<URL fiche Google Business Profile>", "<LinkedIn / Instagram s'ils existent>"],
  "areaServed": [{ "@type": "City", "name": "Saint-Gervais-les-Bains" }, { "@type": "City", "name": "Saint-Nicolas-de-Véroce" }]
}
// WebSite
{ "@type": "WebSite", "@id": "https://www.mystay.city/#website", "url": "https://www.mystay.city", "name": "MyStay", "inLanguage": "fr-FR", "publisher": { "@id": "https://www.mystay.city/#organization" } }
// LodgingBusiness / VacationRental : remplacer "provider" (invalide) par une relation valide, ou le retirer
// POI : supprimer "aggregateRating" ; ajouter "@id": "<url>#place"
// BlogPosting : ajouter "dateModified" (updated_at), un "author" Person si un auteur réel signe, supprimer "alternativeHeadline" mots-clés
```

N'utiliser `LocalBusiness` pour MyStay que si une adresse physique publique existe réellement. Sinon, garder `Organization` avec `areaServed`, ce qui est cohérent avec l'activité de prestataire mobile.

### 8.5 Soft 404 (C-03), principe

```ts
// src/proxy.ts — remplacer la réécriture générique par une liste fermée
const PRIVATE_GUEST_PATHS = ['/le-logement', '/map', '/mes-favoris', '/nos-recommandations', '/services-prives', '/contact']
if (!isGuideAppRoute && !PRIVATE_GUEST_PATHS.some(p => path === p || path.startsWith(`${p}/`))) {
  return response // laisse Next renvoyer son 404
}
```

---

## 9. Audit GEO (moteurs de réponse IA)

### 9.1 Accès des robots

**[Prod]** robots.txt : `Allow: /` pour tous. Aucun blocage par user-agent : tous les agents testés reçoivent le même HTML (200, environ 258 Ko). Le test ne détecte pas un éventuel filtrage par IP ou par vérification DNS inverse.

| Catégorie | Robots (politiques publiées) | Statut MyStay |
|---|---|---|
| Recherche classique | Googlebot, Bingbot | Autorisés |
| Recherche IA (index de réponse) | OAI-SearchBot (ChatGPT search), Claude-SearchBot, PerplexityBot | Autorisés |
| Accès à la demande d'un utilisateur | ChatGPT-User, Claude-User, Perplexity-User | Autorisés. Ces agents ne respectent pas toujours robots.txt, selon leurs éditeurs. |
| Entraînement | GPTBot, ClaudeBot, Google-Extended (jeton de contrôle, pas un robot), CCBot | Autorisés |

**Décision business :** autoriser ou non l'entraînement (GPTBot, ClaudeBot, Google-Extended, CCBot) n'a pas d'effet démontré sur la citation dans les réponses. Bloquer ces agents reste possible sans toucher aux agents de recherche.

**`llms.txt` :** absent (404). Il s'agit d'une proposition communautaire, non standardisée. Aucun grand moteur ne s'est engagé publiquement à l'utiliser pour le classement ou la citation. Priorité **très faible**, après tous les points ci-dessus.

### 9.2 Constats

- **Contenu dans le HTML [Prod] :** les textes, FAQ et données structurées sont dans le HTML initial. Les accordéons FAQ sont présents dans le DOM serveur. C'est un point fort.
- **Latence [Prod] :** 6,5 s avant le premier octet. [Hypothèse] Les robots qui récupèrent les pages à la demande appliquent des délais courts ; une page lente risque d'être ignorée au moment de composer une réponse.
- **Identité de MyStay :**
  - nom, services et zone sont cohérents entre title, contenu et JSON-LD ;
  - il manque l'entité légale (C-04), une page « À propos » (qui sont les personnes, depuis quand, où), les profils externes (`sameAs`) et des preuves (logements gérés, avis publiés).
- **Réponses concrètes :**
  - les FAQ locales répondent à de vraies questions (Airbnb, durée d'engagement, secteurs Fayet / Bettex, ski depuis Saint-Nicolas) ;
  - il manque les données que les moteurs IA reprennent volontiers : délais (« proposition sous 48 h » n'apparaît que sur `/seminaires`), capacités, distances, saisonnalité, ce qui est inclus ou non, tarification ou mode de rémunération (décision business).
- **Contenu original et sourcé :** les articles « classement des meublés » et « préparer un logement haut de gamme » sont les meilleurs actifs GEO : longs, structurés, sourcés. Ils sont pénalisés par l'absence de H2 (C-07), d'auteur nommé et de date de mise à jour.
- **Cohérence des entités :** Organization `@id` stable et réutilisé (Service, BlogPosting, LodgingBusiness). Les POI n'ont pas d'`@id`.

### 9.3 Protocole de test (non exécuté)

Aucun test n'a été lancé dans ChatGPT, Perplexity, Gemini, Copilot ou Google AI Overviews depuis cet environnement. **Aucune visibilité, mention ni citation n'est revendiquée ici.**

Protocole proposé :

1. **Moteurs :** ChatGPT (recherche activée), Perplexity, Google (AI Overviews / AI Mode si disponibles en France), Copilot. Session non connectée ou en navigation privée, localisation France.
2. **Fréquence :** mensuelle, 3 exécutions par requête (les réponses varient d'une exécution à l'autre).
3. **Relevés :** date, moteur, requête exacte, présence de MyStay (oui/non), URL citée, position dans la liste des sources, concurrents cités, exactitude des faits repris.
4. **Matrice de requêtes :**

| Famille | Requête |
|---|---|
| Conciergerie | Quelle conciergerie choisir à Saint-Gervais-les-Bains ? |
| Conciergerie | Conciergerie Airbnb à Saint-Nicolas-de-Véroce : qui contacter ? |
| Conciergerie | Combien coûte une conciergerie pour un chalet au Pays du Mont-Blanc ? |
| Propriétaire | Comment préparer un logement pour une location haut de gamme ? |
| Propriétaire | Comment faire classer son meublé de tourisme en Haute-Savoie ? |
| Séminaire | Où organiser un séminaire au pays du Mont-Blanc ? |
| Séminaire | Chalet pour séminaire de 20 personnes près de Saint-Gervais |
| Voyageur | Que faire en hiver sans skier autour de Saint-Gervais ? |
| Voyageur | Restaurants d'altitude à Saint-Nicolas-de-Véroce |
| Voyageur | Location de chalet avec vue Mont-Blanc à Saint-Gervais |

5. **Limites :** personnalisation des réponses, variabilité, absence d'API officielle de mesure, décalage entre la mise en ligne et la prise en compte.

---

## 10. Plan d'action

### Immédiat (cette semaine)

1. C-01 : retirer l'UUID du lien « Contacter » public. Vérifier ensuite que le guide privé n'expose rien de sensible à une personne qui disposerait d'un ancien lien.
2. C-02 : sortir `getGuideDemoPublishedContent` du layout (au minimum pour toutes les routes sauf l'accueil) ; paralléliser les requêtes.
3. C-03 : rendre les vrais 404.
4. C-11 : retirer `aggregateRating` des POI.
5. C-06 : corriger la double marque des titles.

### Sous 30 jours

6. C-04 : publier les pages légales.
7. C-02 (suite) : rendu ISR des pages marketing, alignement de région Vercel / Supabase, mesure Speed Insights.
8. C-07, C-08, C-13 : Hn du markdown, alt, optimisation des images.
9. C-09 : filtrer les logements par commune ; réécrire ou dépublier `/seminaires/saint-nicolas-de-veroce`.
10. C-12, C-16 : maillage contextuel et hub `/confier-mon-logement`.
11. Ouvrir Google Search Console (propriété de domaine) et Bing Webmaster Tools, puis soumettre le sitemap.

### Sous 90 jours

12. Page « À propos / équipe » avec auteurs réels ; `author` Person dans BlogPosting ; `dateModified`.
13. Contenus locaux à forte valeur : accès, saisons, secteurs, cas concrets de logements gérés, avec l'accord des propriétaires.
14. C-10 : page Les Contamines-Montjoie si l'activité est réelle.
15. C-17 : enrichir ou mettre en `noindex` les fiches POI sans valeur MyStay.
16. Google Business Profile : une seule fiche, conforme aux critères (prestataire à domicile, zone desservie, adresse masquée si aucun accueil du public). **Pas de fiche par ville.** Puis activer la synchronisation des avis (spec 062) une fois les variables configurées.
17. Premier cycle du protocole GEO (§9.3) et suivi mensuel.

---

## 11. Données manquantes

| Source | Ce qu'elle permettrait d'établir |
|---|---|
| Google Search Console | Indexation réelle (couverture, soft 404, exclusions), requêtes et positions, cannibalisation effective, CWV terrain, actions manuelles |
| Bing Webmaster Tools | Indexation Bing (utilisée aussi par Copilot et une partie des moteurs IA) |
| Vercel Speed Insights / CrUX | LCP, INP et CLS terrain (p75), à distinguer du laboratoire |
| Journaux Vercel (logs) | Fréquence de passage de Googlebot et des robots IA, erreurs 5xx, durée des fonctions (confirmer la cause du TTFB) |
| Google Analytics (GA4) | Trafic organique par page, conversions (contacts propriétaires, demandes séminaire) |
| Google Business Profile | Existence, catégorie, zone desservie, avis : cohérence NAP |
| Outil de backlinks (Ahrefs, Semrush) | Autorité, liens entrants, liens cassés entrants (aggravés par C-03) |
| Informations juridiques | Raison sociale, SIRET, statut au regard de la loi Hoguet si applicable, hébergeur |
| Contenu `/sejour` | Nature exacte des données exposées par C-01 (non consulté volontairement) |

---

## 12. Checklist de validation après correction

- [ ] `curl -sI https://www.mystay.city/xyz` renvoie **404**.
- [ ] `/sejour`, `/le-logement` et `/map` sans cookie affichent toujours la page de blocage en `noindex`.
- [ ] Aucune fiche `/logements/*` ne contient `lodging=` ni d'UUID dans son HTML.
- [ ] TTFB sous 0,8 s sur les 51 URL du sitemap (script curl) ; `x-vercel-cache: HIT` sur les pages ISR.
- [ ] HTML d'une page catégorie sous 60 Ko ; aucun `contentMarkdown` dans le payload.
- [ ] `/mentions-legales`, `/confidentialite` et `/cgu` renvoient 200 avec un contenu réel.
- [ ] Aucun `<title>` ne contient « MyStay » deux fois.
- [ ] Articles : H1 → H2 → H3 continus (Lighthouse `heading-order` OK).
- [ ] Aucun `alt` de type UUID ou nom de fichier.
- [ ] Aucun `aggregateRating` sur `/decouvrir/*` ; validator.schema.org sans erreur sur 1 URL par modèle.
- [ ] Pages locales : logements affichés de la commune (ou étiquetés « à proximité ») ; au moins 5 liens entrants hors footer.
- [ ] `http://mystay.city/` redirige en un seul saut.
- [ ] Sitemap : 200, URL toutes en 200, sans redirection ; soumis dans Search Console.
- [ ] Lighthouse mobile : vérifier les métriques **observées** (FCP et LCP observés), pas seulement le score simulé.

---

## 13. Les dix actions les plus utiles

1. **Supprimer l'UUID du lien « Contacter » des fiches logement publiques** → C-01.
2. **Retirer le chargement séquentiel du contenu de démo du layout marketing** → C-02.
3. **Rendre les pages marketing statiques ou ISR et aligner la région Vercel sur Supabase** → C-02.
4. **Renvoyer de vrais 404 pour les URL inconnues** → C-03.
5. **Publier mentions légales, confidentialité et CGU avec l'identité légale de MyStay** → C-04.
6. **Filtrer les logements par commune et différencier ou dépublier les pages Saint-Nicolas minces** → C-09.
7. **Retirer `aggregateRating` (notes Google) du JSON-LD des POI** → C-11.
8. **Corriger la double marque des titles et la hiérarchie Hn des articles** → C-06, C-07.
9. **Créer un maillage contextuel vers les pages communales et faire de `/confier-mon-logement` le hub conciergerie** → C-12, C-16.
10. **Optimiser les images des logements (redimensionnement, une seule priorité LCP, alt descriptifs)** → C-13, C-08.
