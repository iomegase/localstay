# Public Marketing Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer la garde anonyme de la racine par le frontend éditorial
MyStay tout en préservant le guide privé, le QR, les données et l'auth.

**Architecture:** Le proxy expose une liste fermée de routes marketing. Le layout
public choisit entre le chrome privé existant et une surface marketing pleine
largeur. Les composants marketing utilisent Tailwind 3 et lisent les logements
et articles publiés via Prisma.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS
3, Prisma, Supabase Auth, Jest, Testing Library, Playwright.

---

### Task 1: Contrôle d'accès marketing

**Files:**
- Modify: `src/proxy.ts`
- Test: `tests/unit/public-marketing.AC-01-02.access-policy.test.ts`

- [ ] Écrire un test qui exige que `/`, `/concept`, `/seminaires`,
  `/confier-mon-logement`, `/connexion`, `/logements/*` et `/blog/*` soient
  anonymes, et que `/le-logement`, `/map` et `/nos-recommandations` restent
  privés.
- [ ] Exécuter le test et confirmer l'échec sur l'export manquant.
- [ ] Exporter `isAnonymousMarketingPath(pathname: string)` et l'utiliser après
  les branches `/guide`, dashboard et bypass, avant la garde cookie.
- [ ] Relancer le test et les tests QR/proxy existants.

### Task 2: Données logement globales

**Files:**
- Modify: `src/features/lodging-showcase/queries/public-lodgings.ts`
- Test: `tests/unit/public-marketing.AC-03-01.global-lodgings.test.ts`

- [ ] Écrire un test de query qui vérifie les filtres `published`, City active,
  Lodging actif et `deleted_at: null`, puis le mapping vers la fiche existante.
- [ ] Confirmer l'échec avant implémentation.
- [ ] Ajouter `listPublishedLodgings({ limit })` avec l'ordre featured/publié.
- [ ] Confirmer le passage du test.

### Task 3: Shell et composants marketing

**Files:**
- Create: `src/features/marketing/components/MarketingHeader.tsx`
- Create: `src/features/marketing/components/MarketingFooter.tsx`
- Create: `src/features/marketing/components/MarketingPropertyCard.tsx`
- Create: `src/features/marketing/components/MarketingShell.tsx`
- Test: `tests/integration/public-marketing.AC-04-01.navigation.test.tsx`

- [ ] Écrire le test du logo, des routes marketing et du lien `/auth/login`.
- [ ] Confirmer l'échec sur les composants absents.
- [ ] Implémenter les composants avec Tailwind, Lucide et `next/image`.
- [ ] Confirmer le passage du test et l'absence de `scale()`/`zoom`.

### Task 4: Home et pages éditoriales

**Files:**
- Modify: `src/app/(public)/layout.tsx`
- Modify: `src/app/(public)/page.tsx`
- Create: `src/app/(public)/concept/page.tsx`
- Create: `src/app/(public)/seminaires/page.tsx`
- Create: `src/app/(public)/confier-mon-logement/page.tsx`
- Create: `src/app/(public)/connexion/page.tsx`
- Create: `src/features/marketing/components/MarketingHome.tsx`
- Test: `tests/integration/public-marketing.AC-01-01.home.test.tsx`

- [ ] Écrire les assertions structurelles du hero, des services, des cartes et
  du CTA, ainsi que la redirection `/connexion`.
- [ ] Confirmer l'échec avant création.
- [ ] Implémenter les pages en Server Components, avec layout privé inchangé en
  présence d'un séjour.
- [ ] Relancer les tests ciblés.

### Task 5: Logements et blog dynamiques

**Files:**
- Create: `src/app/(public)/logements/page.tsx`
- Modify: `src/app/(public)/blog/page.tsx`
- Modify: `src/app/(public)/blog/[slug]/page.tsx`
- Modify: `src/app/sitemap.ts`
- Test: `tests/integration/public-marketing.AC-03-03.empty-states.test.tsx`

- [ ] Écrire les tests de cartes dynamiques, états vides et conservation des
  données blog.
- [ ] Confirmer l'échec attendu.
- [ ] Brancher la liste globale et appliquer le shell marketing aux pages blog
  sans toucher aux règles de publication.
- [ ] Relancer les suites lodging et blog.

### Task 6: Ressources, traceabilité et responsive

**Files:**
- Create: `public/marketing/hero-chalet.png`
- Create: `public/marketing/guide-interior.png`
- Modify: `src/app/layout.tsx`
- Modify: `tailwind.config.ts`
- Modify: `docs/traceability-matrix.md`
- Test: `tests/e2e/public-marketing.AC-01-03.responsive.test.ts`

- [ ] Utiliser `next/font`, copier uniquement les deux ressources source et
  référencer chaque critère dans la matrice.
- [ ] Vérifier mobile 375, tablette 768 et desktop 1440 avec Playwright.
- [ ] Vérifier `document.documentElement.scrollWidth <= clientWidth`.
- [ ] Exécuter lint, TypeScript, Jest et build production.

### Task 7: SiteFrame arrondi et ombré

**Files:**
- Modify: `src/features/marketing/components/MarketingShell.tsx`
- Modify: `src/features/marketing/components/MarketingHeader.tsx`
- Create: `tests/integration/public-marketing.AC-01-04.surface-frame.test.tsx`
- Modify: `tests/e2e/public-marketing.AC-01-03.responsive.test.ts`
- Modify: `docs/traceability-matrix.md`

- [x] Écrire un test d'intégration qui exige une scène extérieure, une surface
  éditoriale commune et l'ordre `header > main > footer`.
- [x] Confirmer que ce test échoue avant la modification du shell.
- [x] Envelopper le shell dans une scène gris clair et une surface de 1380 px
  maximum, arrondie à 42 px et ombrée à partir de 768 px.
- [x] Rendre le header relatif à la surface, sans bordure ni effet flottant.
- [x] Étendre le test Playwright pour vérifier les styles calculés : aucun rayon
  ni ombre à 375 px, puis rayon de 42 px et ombre visible à 768 et 1440 px.
- [x] Relancer les tests ciblés, lint, TypeScript, build et Playwright.

### Task 8: Calibration dimensionnelle desktop 1184 px

**Files:**
- Modify: `src/features/marketing/components/MarketingShell.tsx`
- Modify: `src/features/marketing/components/marketing-styles.ts`
- Modify: `src/features/marketing/components/MarketingHeader.tsx`
- Modify: `src/features/marketing/components/MarketingHome.tsx`
- Modify: `tests/integration/public-marketing.AC-01-04.surface-frame.test.tsx`
- Modify: `tests/integration/public-marketing.AC-02-02.layout-mode.test.tsx`
- Modify: `tests/e2e/public-marketing.AC-01-03.responsive.test.ts`
- Modify: `docs/traceability-matrix.md`

- [x] Exiger par test la surface de 1184 px, le rayon desktop de 34 px et le
  conteneur éditorial de 944 px.
- [x] Exiger par test un hero de 560 px avec padding `60px 52px 43px` à partir
  de 1280 px.
- [x] Vérifier que les tests échouent avec l'ancien calibrage 1380 px.
- [x] Appliquer les dimensions exactes du bloc desktop de la maquette au shell,
  au header et à la home marketing.
- [x] Verrouiller par régression le shell privé du guide à 430 px.
- [x] Vérifier les styles calculés et l'absence de débordement à 375, 768 et
  1440 px, puis relancer lint, TypeScript, Jest et le build de production.

### Task 9: Fiche logement dans le SiteFrame marketing

**Files:**
- Modify: `src/proxy.ts`
- Modify: `src/app/(public)/guide/[city-slug]/logements/[lodging-slug]/page.tsx`
- Modify: `tests/unit/public-marketing.AC-01-02.access-policy.test.ts`
- Modify: `tests/integration/lodging-showcase.public-pages.test.tsx`
- Modify: `tests/e2e/public-marketing.AC-01-03.responsive.test.ts`
- Modify: `docs/traceability-matrix.md`

- [x] Ajouter un test qui classe seulement les fiches
  `/guide/{city}/logements/{slug}` comme surfaces marketing et conserve la
  liste `/guide/{city}/logements` dans le Guide.
- [x] Ajouter un test d'intégration exigeant `MarketingShell` et sa classe
  `md:max-w-[1184px]` autour de la fiche existante.
- [x] Confirmer l'échec des tests avec le shell actuel.
- [x] Marquer la fiche dans le proxy et composer la page avec
  `MarketingShell`, sans modifier ses données, metadata, JSON-LD ou CTA.
- [x] Vérifier à 375, 768 et 1440 px la largeur calculée et l'absence de
  débordement horizontal.
- [x] Mettre à jour la traceabilité, puis exécuter lint, TypeScript, Jest et le
  build de production.

### Task 10: Fiche logement éditoriale fidèle à la maquette

**Files:**
- Modify: `src/app/(public)/guide/[city-slug]/logements/[lodging-slug]/page.tsx`
- Create: `src/features/lodging-showcase/components/LodgingMarketingGallery.tsx`
- Create: `src/features/lodging-showcase/components/LodgingEssentials.tsx`
- Create: `src/features/lodging-showcase/components/LodgingFeatureSections.tsx`
- Modify: `tests/integration/lodging-showcase.public-pages.test.tsx`
- Create: `tests/unit/lodging-showcase.compact-essentials.test.tsx`
- Modify: `tests/e2e/public-marketing.AC-01-03.responsive.test.ts`
- Modify: `docs/traceability-matrix.md`

- [x] Exiger par test la hiérarchie de la fiche `[slug]` de la maquette et la
  conservation des CTA dynamiques.
- [x] Exiger par test un bloc « En détail » limité aux cinq faits réels, compact
  et sans horaires ou prix inventés.
- [x] Confirmer l'échec attendu avant création des composants.
- [x] Recomposer la fiche dynamique dans le `MarketingShell` existant.
- [x] Retirer les blocs de recommandations Owner de la fiche marketing sans
  supprimer leurs données ni leurs composants partagés.
- [x] Remplacer les icônes génériques des services connus par leurs
  pictogrammes Lucide sémantiques et verrouiller le mapping par test.
- [x] Vérifier la largeur, la compacité et l'absence de débordement à 375, 768
  et 1440 px.
- [x] Relancer les tests ciblés, lint, TypeScript, Jest et build.

### Task 11: Article de blog fidèle à la maquette

**Files:**
- Modify: `specs/features/031-public-marketing-site/spec.md`
- Modify: `src/app/(public)/blog/[slug]/page.tsx`
- Modify: `tests/integration/blog.AC-02-01.article-detail.test.tsx`
- Modify: `docs/traceability-matrix.md`

- [x] **Step 1: approuver le contrat dans la spec 031**

Ajouter `AC-03-10` et `BR-20` pour imposer la grille d'introduction
asymétrique, le sommaire, la colonne Markdown, le CTA et les articles associés,
sans modifier les règles de publication de la spec 029.

- [x] **Step 2: écrire le test en échec**

Ajouter au test d'article :

```tsx
expect(screen.getByTestId('blog-article-intro')).toHaveClass(
  'min-[701px]:grid-cols-[0.88fr_1.12fr]',
)
expect(screen.getByRole('navigation', { name: 'Sommaire de l’article' })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: /Envie d’un accueil plus simple/i })).toBeInTheDocument()
expect(screen.getByRole('heading', { name: /Continuer la lecture/i })).toBeInTheDocument()
```

Mocker `getPublishedBlogArticles` avec deux articles publiés, dont un distinct
de l'article courant.

- [x] **Step 3: vérifier RED**

Run:

```bash
npm test -- --runInBand tests/integration/blog.AC-02-01.article-detail.test.tsx
```

Expected: FAIL sur `blog-article-intro` et le sommaire absents.

- [x] **Step 4: implémenter la composition dynamique**

Utiliser `getPublishedBlogArticles()` pour sélectionner au plus trois articles
distincts. Recomposer la page avec :

```tsx
<header data-testid="blog-article-intro"
  className="grid gap-9 pt-[52px] lg:grid-cols-[0.88fr_1.12fr] lg:gap-14">
  {/* retour, catégorie, titre, extrait, date, durée */}
  {/* couverture de 620 px, arrondie à 28 px */}
</header>
```

Puis rendre le sommaire latéral, `BlogMarkdown`, le CTA et les cartes liées.
Conserver `blogArticleMetadata`, `blogPostingSchema`, la sanitization Markdown
et `notFound()`.

- [x] **Step 5: vérifier GREEN et tracer**

Relancer le test ciblé, puis ajouter `AC-03-10` à
`docs/traceability-matrix.md`.

### Task 12: Page Séminaires fidèle à la maquette

**Files:**
- Modify: `specs/features/031-public-marketing-site/spec.md`
- Modify: `src/app/(public)/seminaires/page.tsx`
- Modify: `tests/integration/public-marketing.AC-01-02.editorial-pages.test.tsx`
- Modify: `tests/e2e/public-marketing.AC-01-03.responsive.test.ts`
- Modify: `docs/traceability-matrix.md`

- [x] **Step 1: compléter le contrat approuvé**

Ajouter `AC-01-06` et `BR-21` avec les dimensions de la référence : hero
`min-height: 590px`, padding desktop `58px 54px 42px`, rayon `30px`, quatre
services de `270px`, sections sombres, formats, processus et CTA.

- [x] **Step 2: écrire le test en échec**

Ajouter :

```tsx
expect(screen.getByTestId('seminar-hero')).toHaveClass(
  'min-[761px]:min-h-[590px]',
  'min-[761px]:px-[54px]',
  'min-[761px]:pb-[42px]',
  'min-[761px]:pt-[58px]',
)
expect(screen.getAllByTestId('seminar-service-card')).toHaveLength(4)
expect(screen.getByTestId('seminar-place')).toHaveTextContent('Le bon cadre')
expect(screen.getByTestId('seminar-process')).toHaveTextContent('Quatre étapes, aucun flou')
```

- [x] **Step 3: vérifier RED**

Run:

```bash
npm test -- --runInBand tests/integration/public-marketing.AC-01-02.editorial-pages.test.tsx
```

Expected: FAIL sur les `data-testid` et dimensions absentes.

- [x] **Step 4: recoposer la page avec Tailwind**

Reprendre les données `services`, `placePrinciples`, `formats` et `steps` de la
référence. Utiliser `public/marketing/hero-chalet.png` dans le hero avec les
deux gradients contractuels. Reproduire les grilles, rayons, hauteurs,
typographies serif, couleurs et breakpoints 1050/760 sans `zoom` ni `scale()`.
Conserver le `MarketingShell`, les metadata et le `mailto` MyStay.

- [x] **Step 5: vérifier GREEN et responsive**

Étendre Playwright pour ouvrir `/seminaires` à 375, 768 et 1440 px, vérifier
`scrollWidth <= clientWidth`, la hauteur du hero et la surface marketing.
Ajouter `AC-01-06` à la matrice.

### Task 13: Vérification finale

**Files:**
- Restore if generated: `tsconfig.tsbuildinfo`

- [x] Exécuter :

```bash
npm test -- --runInBand \
  tests/integration/blog.AC-02-01.article-detail.test.tsx \
  tests/integration/public-marketing.AC-01-02.editorial-pages.test.tsx
npm run lint
npx tsc --noEmit
npm run build
npx playwright test tests/e2e/public-marketing.AC-01-03.responsive.test.ts
```

- [x] Vérifier visuellement et par métriques 375, 768 et 1440 px.
- [x] Restaurer uniquement les artefacts générés non métier et dresser la liste
  précise des fichiers modifiés. Ne faire aucun push ni déploiement.
