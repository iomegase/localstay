# Demo Public Catalogs Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Limiter le menu plein écran de la démo à trois entrées et alimenter ses vues Logements et Blog avec les contenus publics réellement publiés.

**Architecture:** Un loader serveur réutilise les queries publiques Blog et Logements, retire les UUID et transforme les résultats en DTO sérialisables. Les lectures détaillées sont séquentielles pour respecter les pools Prisma limités des environnements serverless. Les Server Components marketing transmettent ces DTO aux déclencheurs client existants jusqu'à `DemoGuideApp`; le modal n'effectue aucun appel réseau.

**Tech Stack:** Next.js 16 App Router, React Server Components, TypeScript strict, Prisma via queries publiques existantes, Vitest, Testing Library.

---

### Task 1: Verrouiller le menu et le contrat DTO

**Files:**
- Modify: `tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx`
- Modify: `src/features/guide-demo/components/DemoGuideChrome.tsx`
- Modify: `src/features/guide-demo/types.ts`

- [x] **Step 1: Write the failing menu test**

Ajouter un test qui ouvre le menu et attend exactement `Nos logements`, `Blog` et `Nous contacter`, sans `Accueil`, `Guide du logement`, `Coups de cœur` ni `Carte`.

- [x] **Step 2: Run test to verify it fails**

Run: `npm test -- tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx`

Expected: FAIL car les quatre anciennes entrées sont encore présentes.

- [x] **Step 3: Implement the minimal menu change**

Réduire `menuNavigation` aux trois vues éditoriales et définir un contrat `DemoPublishedContent` contenant `lodgingCards` et `blogPosts`.

- [x] **Step 4: Run test to verify it passes**

Run: `npm test -- tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx`

Expected: PASS.

### Task 2: Adapter les queries publiques en données de démo

**Files:**
- Create: `src/features/marketing/queries/guide-demo-content.ts`
- Create: `tests/integration/public-demo-private-reference.AC-05-01-05.public-content.test.ts`

- [x] **Step 1: Write failing adapter tests**

Tester que le loader réutilise `listPublishedLodgings`, `getPublishedLodgingDetailBySlug`, `getPublishedBlogArticles` et `getPublishedBlogArticleBySlug`, conserve l'ordre public, produit des identifiants `demo-*`, restitue le contenu détaillé et retourne deux listes vides lorsqu'une query échoue.

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/integration/public-demo-private-reference.AC-05-01-05.public-content.test.ts`

Expected: FAIL car le loader n'existe pas.

- [x] **Step 3: Implement the server-only adapter**

Créer un loader dédupliqué avec `cache()`, charger séquentiellement les détails publics, isoler les erreurs de chaque catalogue, exclure les résultats devenus indisponibles et convertir chaque élément vers les types de démo sans UUID.

- [x] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/integration/public-demo-private-reference.AC-05-01-05.public-content.test.ts`

Expected: PASS.

### Task 3: Transmettre les catalogues au modal

**Files:**
- Modify: `src/features/guide-demo/components/GuideDemoLauncher.tsx`
- Modify: `src/features/guide-demo/components/GuideDemoPhoneButton.tsx`
- Modify: `src/features/guide-demo/components/GuideDemoModal.tsx`
- Modify: `src/features/guide-demo/components/DemoGuideApp.tsx`
- Modify: `src/features/marketing/components/MarketingHeader.tsx`
- Modify: `src/features/marketing/components/MarketingShell.tsx`
- Modify: `src/features/marketing/components/MarketingHome.tsx`
- Modify: `src/app/(public)/page.tsx`
- Modify: `src/app/(public)/concept/page.tsx`

- [x] **Step 1: Write failing rendering tests**

Faire rendre `DemoGuideApp` avec des DTO publics injectés et vérifier que les cartes et détails utilisent ces valeurs plutôt que les fixtures historiques.

- [x] **Step 2: Run tests to verify they fail**

Run: `npm test -- tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx`

Expected: FAIL car `DemoGuideApp` n'accepte pas encore les catalogues.

- [x] **Step 3: Implement serializable prop forwarding**

Ajouter `publishedContent` aux composants du modal. Charger le contenu dans les Server Components marketing avec le loader dédupliqué et le transmettre sans modifier la navigation privée.

- [x] **Step 4: Run tests to verify they pass**

Run: `npm test -- tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx tests/integration/public-demo-private-reference.AC-05-01-05.public-content.test.ts`

Expected: PASS.

### Task 4: Traçabilité et vérification

**Files:**
- Modify: `docs/traceability-matrix.md`

- [x] **Step 1: Add AC-01-06, AC-02-06 and AC-05 traceability rows**

Relier la spec 045 au loader, aux composants du modal et aux deux suites de tests.

- [x] **Step 2: Run focused and regression tests**

Run: `npm test -- tests/integration/public-demo-private-reference.AC-01-01.navigation.test.tsx tests/integration/public-demo-private-reference.AC-01-03.content-views.test.tsx tests/integration/public-demo-private-reference.AC-02-01-05.modal-isolation.test.tsx tests/integration/public-demo-private-reference.AC-05-01-05.public-content.test.ts tests/unit/public-demo-private-reference.AC-02-02-03.security.test.ts`

Expected: PASS.

- [x] **Step 3: Run static verification**

Run: `npm run lint`

Expected: exit 0.

Run: `npm run build`

Expected: exit 0.

- [x] **Step 4: Inspect the final diff**

Vérifier que les fichiers du guide privé sont inchangés et que les modifications locales préexistantes de `DemoLodgingGuideView.tsx` et `MarketingHome.tsx` ne sont ni écrasées ni incluses par erreur dans un commit.
