# Public Discovery Index Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Créer la page publique `/decouvrir`, alimentée uniquement par les villes possédant des POI Discovery encore éligibles, afficher au maximum cinq POI par ville et ajouter le lien exact « Découvrir » au footer MyStay.

**Architecture:** Étendre le read model `public-discovery` avec une query Server Component dédiée qui effectue une seule lecture Prisma, réutilise la défense applicative BR-04/08/10, groupe par ville puis trie et limite les cartes. La page racine réutilise `MarketingShell`, `DiscoveryPoiCard`, les helpers SEO existants et ne lit aucun cookie ni contexte de séjour. Toute mutation susceptible d'ajouter, retirer ou déplacer un POI public invalide aussi `/decouvrir` après commit.

**Tech Stack:** Next.js 16 App Router, React Server Components, TypeScript strict, Prisma 5, Tailwind CSS, Jest/Testing Library, Playwright, JSON-LD schema.org.

---

## File map

- Modify: `specs/features/041-public-local-discovery/spec.md` — autoriser et contracter la route racine validée par le Product Owner.
- Modify: `src/features/public-discovery/types.ts` — DTO public minimal du hub.
- Modify: `src/features/public-discovery/queries/public-discovery.ts` — query unique, filtrage, groupement, tri et limite.
- Create: `src/features/public-discovery/components/DiscoveryIndexView.tsx` — présentation MyStay du hub et état vide.
- Create: `src/app/(public)/decouvrir/page.tsx` — Server Component, metadata et JSON-LD.
- Modify: `src/features/seo/lib/metadata.ts` — metadata statiques dédiées au hub.
- Modify: `src/features/marketing/components/MarketingFooter.tsx` — lien exact « Découvrir ».
- Modify: `src/app/sitemap.ts` — entrée canonique racine unique.
- Modify: `src/features/public-discovery/lib/revalidation.ts` — invalidation centrale du hub et du sitemap.
- Create: `tests/integration/public-discovery.AC-06.public-index-query.test.ts` — contrat du read model.
- Create: `tests/integration/public-discovery.AC-06.public-index-page.test.tsx` — rendu, état vide, SEO et isolation.
- Modify: `tests/integration/public-marketing.AC-04-01.navigation.test.tsx` — footer.
- Modify: `tests/unit/seo.sitemap.test.ts` — entrée unique et metadata sitemap.
- Create: `tests/contract/public-discovery.AC-06.sitemap-route.test.ts` — câblage réel de `/decouvrir` dans `app/sitemap.ts`.
- Modify: `tests/contract/public-discovery.AC-04.publication-api.test.ts` — invalidation du hub.
- Create: `tests/e2e/public-discovery.AC-06.responsive-index.test.ts` — responsive sans dépendre d'une fixture POI.
- Modify: `docs/traceability-matrix.md` — traçabilité AC-06.

### Task 1: Amend the approved specification

**Files:**
- Modify: `specs/features/041-public-local-discovery/spec.md`

- [ ] **Step 1: Add the root route to Context**

Ajouter `/decouvrir` avant les routes dynamiques :

```markdown
- `/decouvrir` comme hub des villes possédant du contenu public éligible ;
- `/decouvrir/[city-slug]` pour la destination locale ;
```

- [ ] **Step 2: Add US-06 and its acceptance criteria**

```markdown
### US-06 — Parcourir les villes publiées

**As a** visiteur anonyme
**I want to** voir les villes pour lesquelles MyStay possède une sélection publique
**So that** j'accède directement aux bonnes adresses locales

#### Acceptance Criteria

- **AC-06-01**: Given des POI `PUBLISHED` encore éligibles dans plusieurs City,
  When `/decouvrir` est ouverte, Then la page répond 200, classe les City par
  nom et n'affiche que les City possédant au moins un POI visible.
- **AC-06-02**: Given plus de cinq POI visibles pour une City, When le hub est
  rendu, Then seuls les cinq premiers selon le tri public zone, distance puis
  nom sont affichés et les liens City/POI utilisent leurs URL canoniques.
- **AC-06-03**: Given aucun POI public éligible, When `/decouvrir` est ouverte,
  Then la page répond 200 avec un état vide éditorial et sans ville inventée.
- **AC-06-04**: Given le hub public, When son HTML est inspecté, Then il utilise
  `MarketingShell`, possède un H1 unique, une canonical `/decouvrir`, des
  metadata Open Graph/Twitter et les JSON-LD `BreadcrumbList` et `ItemList`
  limités aux villes visibles.
- **AC-06-05**: Given le footer marketing et le sitemap, When ils sont rendus,
  Then un lien intitulé exactement « Découvrir » cible `/decouvrir` et cette
  URL canonique est présente une seule fois dans le sitemap.
- **AC-06-06**: Given une publication, un retrait, une dépublication automatique
  ou un déplacement d'un POI public, When la transaction est commitée, Then le
  cache de `/decouvrir` est invalidé avec les routes locales affectées.
```

- [ ] **Step 3: Add exact business and UI rules**

Ajouter les règles suivantes après BR-26 :

```markdown
- **BR-27**: Le hub `/decouvrir` dérive ses villes exclusivement de POI qui
  satisfont BR-04, BR-08 et BR-10 au moment de la lecture. Une ville vide est
  omise et aucun contenu `DRAFT` ne contribue au rendu ou au JSON-LD.
- **BR-28**: Le hub utilise une seule lecture Prisma. Les villes sont triées
  alphabétiquement en français ; dans chaque ville, les POI sont triés zone
  principale puis alentours, distance croissante, nom, puis limités à cinq.
- **BR-29**: `/decouvrir` reste public même sans contenu et rend alors un état
  vide éditorial HTTP 200. Il ne lit aucun cookie, Lodging, Owner ou séjour.
- **BR-30**: Le footer expose le libellé exact « Découvrir ». Le libellé
  « Découvrir nos destinations » n'est pas utilisé.
- **BR-31**: Toute mutation modifiant l'appartenance d'un POI au hub invalide
  `/decouvrir` après commit, en plus des routes locales et du sitemap.
```

Ajouter une section UI `### Page /decouvrir` avec : hero clair, H1 exact
`Découvrir les bonnes adresses locales.`, sections par ville, cinq cards au
maximum et état vide `De nouvelles adresses arrivent bientôt.`

- [ ] **Step 4: Extend the acceptance-criteria summary**

Ajouter les six lignes suivantes à `Acceptance Criteria Summary` :

```markdown
| AC-06-01 | Hub 200 avec uniquement les villes possédant des POI visibles | integration |
| AC-06-02 | Cinq POI maximum, tri public et liens canoniques | unit + integration |
| AC-06-03 | Hub vide → 200 et état éditorial | integration |
| AC-06-04 | MarketingShell, H1, metadata et JSON-LD du hub | integration + e2e |
| AC-06-05 | Footer exact et sitemap racine unique | unit + integration |
| AC-06-06 | Invalidation du hub après changement d'appartenance | contract + integration |
```

- [ ] **Step 5: Remove the contradictory out-of-scope item and record the decision**

Supprimer `Route racine /decouvrir sans ville.` de `Out of Scope`, puis ajouter
à `Open Questions` :

```markdown
- le hub racine `/decouvrir`, son lien footer et la limite de cinq POI par
  ville ont été validés par le Product Owner le 2026-08-24 ; le libellé
  « Découvrir nos destinations » est exclu.
```

- [ ] **Step 6: Verify the spec is internally complete**

Run:

```bash
rg -n "US-06|AC-06-0[1-6]|BR-(27|28|29|30|31)|Route racine `/decouvrir`" specs/features/041-public-local-discovery/spec.md
```

Expected: US/AC/BR présents et aucune ligne hors périmètre contradictoire.

- [ ] **Step 7: Commit the specification amendment**

```bash
git add specs/features/041-public-local-discovery/spec.md
git commit -m "docs(discovery): approve public discovery index"
```

### Task 2: Build the strict one-query hub read model with TDD

**Files:**
- Create: `tests/integration/public-discovery.AC-06.public-index-query.test.ts`
- Modify: `src/features/public-discovery/types.ts`
- Modify: `src/features/public-discovery/queries/public-discovery.ts`

- [ ] **Step 1: Write the failing query contract tests**

Le test doit mocker `prisma.pointOfInterest.findMany`, réutiliser une factory de
ligne publique et couvrir dans des cas séparés :

```ts
expect(mockPoiFindMany).toHaveBeenCalledTimes(1)
expect(mockPoiFindMany).toHaveBeenCalledWith({
  where: expect.objectContaining({
    discovery_status: 'PUBLISHED',
    discovery_published_at: { not: null },
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    city: { is_active: true, deleted_at: null },
    category: { is_active: true, deleted_at: null },
  }),
  select: expect.any(Object),
})
```

Puis vérifier le DTO exact et les comportements :

```ts
expect(result.map(city => city.slug)).toEqual([
  'les-contamines-montjoie',
  'saint-gervais-les-bains',
])
expect(result[1]?.pois).toHaveLength(5)
expect(result[1]?.pois.map(poi => poi.name)).toEqual([
  'Adresse proche A',
  'Adresse proche B',
  'Adresse proche C',
  'Adresse proche D',
  'Adresse proche E',
])
```

Inclure une ligne `PUBLISHED` invalide pour chacun des invariants déjà défendus
par `getDiscoveryPoiVisibility` (description, photo, adresse, contact,
coordonnées, rayon, relations, slug). Vérifier qu'une ville ne contenant que
ces lignes est absente. Vérifier qu'aucune clé privée (`id`, `owner_note`,
`lodging_id`, statuts, audit/source payload) n'est présente récursivement.

- [ ] **Step 2: Run the query tests to verify RED**

Run:

```bash
npm test -- --runInBand tests/integration/public-discovery.AC-06.public-index-query.test.ts
```

Expected: FAIL because `getDiscoveryIndex` and `DiscoveryIndexCity` do not exist.

- [ ] **Step 3: Add the minimal public DTO**

Dans `src/features/public-discovery/types.ts` :

```ts
export type DiscoveryIndexCity = DiscoveryCitySummary & {
  pois: DiscoveryPoiCard[]
}
```

- [ ] **Step 4: Generalize route-independent eligibility without weakening dynamic routes**

Dans `public-discovery.ts`, rendre la ville optionnelle seulement pour le hub :

```ts
type DiscoveryRoute = {
  citySlug?: string
  categorySlug?: string
  poiSlug?: string
}

function buildDiscoveryWhere(route: DiscoveryRoute): Prisma.PointOfInterestWhereInput {
  return {
    // contraintes existantes inchangées
    city: {
      ...(route.citySlug ? { slug: route.citySlug } : {}),
      is_active: true,
      deleted_at: null,
    },
    // category/OR/poi existants inchangés
  }
}

function matchesRoute(row: DiscoveryPoiRow, route: DiscoveryRoute): boolean {
  return (!route.citySlug || row.city.slug === route.citySlug)
    && (!route.categorySlug || row.category.slug === route.categorySlug)
    && (!route.poiSlug || row.slug === route.poiSlug)
}
```

Conserver la validation obligatoire des slugs pour les trois routes dynamiques.

- [ ] **Step 5: Implement one-query grouping, sorting and five-item limit**

Exporter et envelopper la query dans `cache` :

```ts
export const getDiscoveryIndex: () => Promise<DiscoveryIndexCity[]> = cache(
  async (): Promise<DiscoveryIndexCity[]> => {
    const mapped = sortedMappedPois(
      await findDiscoveryRows({}, { select: discoveryPoiListSelect }),
      {},
    )
    const groups = new Map<string, MappedPoi[]>()
    for (const poi of mapped) {
      const group = groups.get(poi.row.city.id) ?? []
      group.push(poi)
      groups.set(poi.row.city.id, group)
    }

    return [...groups.values()]
      .map(group => ({
        ...toCitySummary(group[0]!.row),
        pois: group.slice(0, 5).map(poi => poi.card),
      }))
      .sort(stableNameCompare)
  },
)
```

Le `slice(0, 5)` doit intervenir après le tri défensif et avant la construction
du DTO final ; ne jamais utiliser `take: 5` au niveau Prisma, car la limite est
par ville et les lignes invalides doivent d'abord être retirées.

- [ ] **Step 6: Run focused and existing query regressions**

Run:

```bash
npm test -- --runInBand \
  tests/integration/public-discovery.AC-06.public-index-query.test.ts \
  tests/integration/public-discovery.AC-01-03.public-queries.test.ts
```

Expected: 2 suites PASS; query hub appelée une fois, routes dynamiques inchangées.

- [ ] **Step 7: Commit the read model**

```bash
git add src/features/public-discovery/types.ts src/features/public-discovery/queries/public-discovery.ts tests/integration/public-discovery.AC-06.public-index-query.test.ts
git commit -m "feat(discovery): add public index read model"
```

### Task 3: Render the MyStay index page and SEO contract with TDD

**Files:**
- Create: `tests/integration/public-discovery.AC-06.public-index-page.test.tsx`
- Create: `src/features/public-discovery/components/DiscoveryIndexView.tsx`
- Create: `src/app/(public)/decouvrir/page.tsx`
- Modify: `src/features/seo/lib/metadata.ts`

- [ ] **Step 1: Write failing page, empty-state and SEO tests**

Mocker uniquement `getDiscoveryIndex`. Avec deux villes et cinq POI dans la
première (le cas de six lignes est couvert au niveau query), vérifier :

```ts
expect(mockedIndex).toHaveBeenCalledTimes(1)
expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
expect(screen.getByRole('heading', {
  level: 1,
  name: 'Découvrir les bonnes adresses locales.',
})).toBeInTheDocument()
expect(screen.getByTestId('marketing-stage')).toBeInTheDocument()
expect(screen.getByRole('link', { name: /Découvrir Saint-Gervais-les-Bains/i }))
  .toHaveAttribute('href', '/decouvrir/saint-gervais-les-bains')
expect(container.querySelectorAll('[data-discovery-city="saint-gervais-les-bains"] article'))
  .toHaveLength(5)
```

Vérifier aussi les liens POI canoniques, l'absence de `/guide/`, de
`bottom-navigation`, de texte Owner/Lodging, puis les deux schémas :

```ts
expect(jsonLd(container).map(item => item['@type'])).toEqual([
  'BreadcrumbList',
  'ItemList',
])
```

Dans un test séparé, `mockedIndex.mockResolvedValue([])` doit conserver HTTP/rendu
normal, un H1 unique et afficher `De nouvelles adresses arrivent bientôt.` sans
section de ville.

Tester enfin :

```ts
expect(metadata.alternates?.canonical).toBe('/decouvrir')
expect(metadata.openGraph?.url).toBe('/decouvrir')
expect(metadata.twitter).toEqual(expect.objectContaining({ card: 'summary_large_image' }))
```

- [ ] **Step 2: Run page tests to verify RED**

Run:

```bash
npm test -- --runInBand tests/integration/public-discovery.AC-06.public-index-page.test.tsx
```

Expected: FAIL because the route and view do not exist.

- [ ] **Step 3: Add static hub metadata**

Dans `metadata.ts` :

```ts
export function discoveryIndexMetadata(): Metadata {
  const title = 'Découvrir les bonnes adresses locales — MyStay'
  const description = truncate(
    'Explorez les adresses locales sélectionnées par MyStay dans les villes de Haute-Savoie.',
  )
  const path = '/decouvrir'
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: openGraph({ title, description, path }),
    twitter: { card: 'summary_large_image', title, description },
  }
}
```

- [ ] **Step 4: Create the Server Component route**

Dans `src/app/(public)/decouvrir/page.tsx` :

```tsx
import type { Metadata } from 'next'
import { DiscoveryIndexView } from '@/features/public-discovery/components/DiscoveryIndexView'
import { getDiscoveryIndex } from '@/features/public-discovery/queries/public-discovery'
import { discoveryIndexMetadata } from '@/features/seo/lib/metadata'
import { breadcrumbSchema, discoveryItemListSchema } from '@/features/seo/lib/structured-data'
import { JsonLd } from '@/shared/components/JsonLd'

export const metadata: Metadata = discoveryIndexMetadata()

export default async function DiscoveryIndexPage() {
  const cities = await getDiscoveryIndex()
  return (
    <>
      <JsonLd data={[
        breadcrumbSchema([
          { name: 'Accueil', path: '/' },
          { name: 'Découvrir', path: '/decouvrir' },
        ]),
        discoveryItemListSchema({
          name: 'Villes et bonnes adresses MyStay',
          items: cities.map(city => ({
            name: city.name,
            path: `/decouvrir/${city.slug}`,
          })),
        }),
      ]} />
      <DiscoveryIndexView cities={cities} />
    </>
  )
}
```

- [ ] **Step 5: Create the focused presentation component**

Le composant doit utiliser `MarketingShell`, `MarketingEyebrow`,
`marketingContainerClass`, `DiscoveryPoiCard` et rester un Server Component.
Structure requise :

```tsx
<MarketingShell>
  <div className="overflow-hidden text-slate-800">
    <header className={`${marketingContainerClass} pb-14 pt-12 sm:pb-16 sm:pt-16 lg:pb-20`}>
      <MarketingEyebrow>Le guide local MyStay</MarketingEyebrow>
      <h1>Découvrir les bonnes adresses locales.</h1>
      <p>Des lieux sélectionnés par MyStay pour préparer votre séjour et profiter de chaque ville.</p>
    </header>
    {cities.length === 0 ? (
      <section aria-labelledby="discovery-empty-title">
        <h2 id="discovery-empty-title">De nouvelles adresses arrivent bientôt.</h2>
      </section>
    ) : cities.map((city, index) => (
      <section key={city.slug} data-discovery-city={city.slug}>
        <h2>{city.name}</h2>
        <Link href={`/decouvrir/${city.slug}`} aria-label={`Découvrir ${city.name}`}>
          Voir toutes les adresses <ArrowRight aria-hidden="true" />
        </Link>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {city.pois.map(poi => (
            <DiscoveryPoiCard key={`${poi.category.slug}-${poi.slug}`} citySlug={city.slug} poi={poi} />
          ))}
        </div>
      </section>
    ))}
  </div>
</MarketingShell>
```

Appliquer les classes visuelles déjà présentes dans `DiscoveryCityView` : hero
clair, alternance blanche/`#f7f6f4`, rayons 24 px, ombres légères, espacements
mobile-first et largeur du `MarketingShell`. Utiliser `index % 2` uniquement
pour l'alternance visuelle, jamais comme logique métier.

- [ ] **Step 6: Run page and existing page regressions**

Run:

```bash
npm test -- --runInBand \
  tests/integration/public-discovery.AC-06.public-index-page.test.tsx \
  tests/integration/public-discovery.AC-01-03.pages.test.tsx \
  tests/unit/public-marketing.AC-01-02.access-policy.test.ts
```

Set dummy Supabase public values for the proxy-only suite if the worktree has no env:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key \
npm test -- --runInBand tests/unit/public-marketing.AC-01-02.access-policy.test.ts
```

Expected: all selected suites PASS and `/decouvrir` is classified public.

- [ ] **Step 7: Commit the page**

```bash
git add src/app/'(public)'/decouvrir/page.tsx src/features/public-discovery/components/DiscoveryIndexView.tsx src/features/seo/lib/metadata.ts tests/integration/public-discovery.AC-06.public-index-page.test.tsx
git commit -m "feat(discovery): render public discovery index"
```

### Task 4: Add the exact footer link and sitemap entry

**Files:**
- Modify: `tests/integration/public-marketing.AC-04-01.navigation.test.tsx`
- Modify: `src/features/marketing/components/MarketingFooter.tsx`
- Modify: `tests/unit/seo.sitemap.test.ts`
- Create: `tests/contract/public-discovery.AC-06.sitemap-route.test.ts`
- Modify: `src/app/sitemap.ts`

- [ ] **Step 1: Write failing footer and sitemap assertions**

Ajouter :

```ts
expect(screen.getByRole('link', { name: 'Découvrir', exact: true }))
  .toHaveAttribute('href', '/decouvrir')
expect(screen.queryByRole('link', { name: 'Découvrir nos destinations' }))
  .not.toBeInTheDocument()
```

Dans le test sitemap, inclure `'/decouvrir'` dans `staticPaths`, puis vérifier :

```ts
const indexUrl = `${base}/decouvrir`
expect(urls.filter(url => url === indexUrl)).toHaveLength(1)
expect(result.find(entry => entry.url === indexUrl)).toEqual({
  url: indexUrl,
  changeFrequency: 'monthly',
  priority: 0.5,
})
```

Créer aussi un test contractuel qui mocke `getSitemapData`, importe le default
export de `src/app/sitemap.ts`, l'appelle et vérifie le câblage réel :

```ts
jest.mock('@/features/seo/queries/sitemap-data', () => ({
  getSitemapData: jest.fn().mockResolvedValue({
    cities: [], pois: [], lodgings: [], blogArticles: [],
  }),
}))

it('wires the canonical discovery index into the application sitemap once', async () => {
  const { default: sitemap } = await import('@/app/sitemap')
  const entries = await sitemap()
  const urls = entries.map(entry => new URL(entry.url).pathname)
  expect(urls.filter(path => path === '/decouvrir')).toHaveLength(1)
})
```

- [ ] **Step 2: Run tests to verify RED**

Run:

```bash
npm test -- --runInBand \
  tests/integration/public-marketing.AC-04-01.navigation.test.tsx \
  tests/unit/seo.sitemap.test.ts \
  tests/contract/public-discovery.AC-06.sitemap-route.test.ts
```

Expected: FAIL because the footer and application sitemap omit `/decouvrir`.

- [ ] **Step 3: Add the exact footer link**

Dans la colonne existante `Découvrir`, ajouter une seule ligne :

```tsx
<Link href="/decouvrir">Découvrir</Link>
```

- [ ] **Step 4: Add the canonical static sitemap path**

Dans `src/app/sitemap.ts`, ajouter une seule fois :

```ts
staticPaths: [
  '/concept',
  '/decouvrir',
  '/seminaires',
  // chemins existants inchangés
]
```

- [ ] **Step 5: Run focused tests**

Run:

```bash
npm test -- --runInBand \
  tests/integration/public-marketing.AC-04-01.navigation.test.tsx \
  tests/unit/seo.sitemap.test.ts \
  tests/contract/public-discovery.AC-06.sitemap-route.test.ts
```

Expected: 3 suites PASS; libellé exact et URL sitemap unique.

- [ ] **Step 6: Commit navigation and sitemap**

```bash
git add src/features/marketing/components/MarketingFooter.tsx src/app/sitemap.ts tests/integration/public-marketing.AC-04-01.navigation.test.tsx tests/unit/seo.sitemap.test.ts tests/contract/public-discovery.AC-06.sitemap-route.test.ts
git commit -m "feat(discovery): link public index from marketing"
```

### Task 5: Revalidate the hub after every public membership change

**Files:**
- Modify: `src/features/public-discovery/lib/revalidation.ts`
- Modify: `tests/contract/public-discovery.AC-04.publication-api.test.ts`
- Modify: `tests/contract/admin-pois.AC-01-04.api.test.ts`

- [ ] **Step 1: Strengthen failing revalidation tests**

Pour publication, retrait, édition, désactivation, archivage et restauration,
ajouter l'assertion centrale :

```ts
expect(mockRevalidatePath).toHaveBeenCalledWith('/decouvrir', 'page')
expect(mockRevalidatePath).toHaveBeenCalledWith('/sitemap.xml')
```

Conserver les assertions des chemins ville/catégorie/POI existants et vérifier
que les chemins fournis en double ne produisent qu'un appel chacun.

- [ ] **Step 2: Run revalidation tests to verify RED**

Run:

```bash
npm test -- --runInBand \
  tests/contract/public-discovery.AC-04.publication-api.test.ts \
  tests/contract/admin-pois.AC-01-04.api.test.ts
```

Expected: FAIL because `/decouvrir` is not revalidated.

- [ ] **Step 3: Centralize hub invalidation**

Modifier uniquement le helper post-commit partagé :

```ts
export function safelyRevalidateDiscoveryPaths(paths: string[]): void {
  if (paths.length === 0) return

  for (const path of [...new Set(['/decouvrir', ...paths])]) {
    safelyRevalidatePath(path, 'page')
  }
  safelyRevalidatePath('/sitemap.xml')
}
```

Ne pas ajouter `/decouvrir` aux DTO de mutation ni aux snapshots d'audit : le
helper représente une dépendance de cache globale, pas une URL propre au POI.
Conserver la règle actuelle : aucune invalidation si aucune appartenance
Discovery n'a changé (`paths.length === 0`).

- [ ] **Step 4: Run all mutation/revalidation regressions**

Run:

```bash
npm test -- --runInBand \
  tests/contract/public-discovery.AC-04.publication-api.test.ts \
  tests/contract/admin-pois.AC-01-04.api.test.ts \
  tests/integration/public-discovery.AC-04.publication-query.test.ts \
  tests/integration/public-discovery.AC-04.taxonomy-unpublication.test.ts
```

Expected: all suites PASS, with local paths, hub and sitemap invalidated after commit.

- [ ] **Step 5: Commit cache invalidation**

```bash
git add src/features/public-discovery/lib/revalidation.ts tests/contract/public-discovery.AC-04.publication-api.test.ts tests/contract/admin-pois.AC-01-04.api.test.ts
git commit -m "fix(discovery): revalidate public index membership"
```

### Task 6: Add responsive browser coverage

**Files:**
- Create: `tests/e2e/public-discovery.AC-06.responsive-index.test.ts`

- [ ] **Step 1: Write an environment-independent responsive test**

```ts
import { expect, test } from '@playwright/test'

test.describe('041 public discovery index responsiveness', () => {
  for (const viewport of [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 1000 },
  ] as const) {
    test(`/decouvrir uses the marketing surface without overflow on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      const response = await page.goto('/decouvrir')
      expect(response?.status()).toBe(200)
      await expect(page.getByTestId('marketing-stage')).toBeVisible()
      await expect(page.getByTestId('marketing-surface')).toBeVisible()
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(page.getByTestId('bottom-navigation')).toHaveCount(0)

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }))
      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
    })
  }
})
```

Ce fichier ne doit avoir ni `test.skip`, ni variable de slug : le hub répond 200
même lorsque la query retourne une liste vide.

- [ ] **Step 2: Run Playwright against the configured local app**

Run:

```bash
set -a
source ../../.env
source ../../.env.local
set +a
npx playwright test tests/e2e/public-discovery.AC-06.responsive-index.test.ts --project='Mobile Chrome'
```

Expected: 3 tests PASS. Si l'environnement ne peut pas démarrer le webServer ou
ne possède pas la migration 041, conserver l'échec exact comme limitation et
ne jamais transformer ce fichier en suite ignorée. Ces fichiers fournissent la
configuration runtime seulement ; ne jamais afficher leurs valeurs.

- [ ] **Step 3: Commit E2E coverage**

```bash
git add tests/e2e/public-discovery.AC-06.responsive-index.test.ts
git commit -m "test(discovery): cover public index responsiveness"
```

### Task 7: Update traceability and run final gates

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Add one traceability row per AC-06 criterion**

Utiliser ce format, avec les chemins réels créés par les tâches précédentes :

```markdown
| 041 | Public discovery index | US-06 | AC-06-01 | `src/features/public-discovery/queries/public-discovery.ts`, `src/app/(public)/decouvrir/page.tsx` | `tests/integration/public-discovery.AC-06.public-index-query.test.ts`, `tests/integration/public-discovery.AC-06.public-index-page.test.tsx`, `tests/e2e/public-discovery.AC-06.responsive-index.test.ts` | ✅ done |
| 041 | Public discovery index | US-06 | AC-06-02 | `src/features/public-discovery/queries/public-discovery.ts`, `src/features/public-discovery/components/DiscoveryIndexView.tsx` | `tests/integration/public-discovery.AC-06.public-index-query.test.ts`, `tests/integration/public-discovery.AC-06.public-index-page.test.tsx` | ✅ done |
| 041 | Public discovery index | US-06 | AC-06-03 | `src/features/public-discovery/components/DiscoveryIndexView.tsx` | `tests/integration/public-discovery.AC-06.public-index-page.test.tsx`, `tests/e2e/public-discovery.AC-06.responsive-index.test.ts` | ✅ done |
| 041 | Public discovery index SEO | US-06 | AC-06-04 | `src/app/(public)/decouvrir/page.tsx`, `src/features/seo/lib/metadata.ts` | `tests/integration/public-discovery.AC-06.public-index-page.test.tsx`, `tests/e2e/public-discovery.AC-06.responsive-index.test.ts` | ✅ done only if Playwright passes; otherwise 🔵 in progress |
| 041 | Public discovery navigation | US-06 | AC-06-05 | `src/features/marketing/components/MarketingFooter.tsx`, `src/app/sitemap.ts` | `tests/integration/public-marketing.AC-04-01.navigation.test.tsx`, `tests/unit/seo.sitemap.test.ts`, `tests/contract/public-discovery.AC-06.sitemap-route.test.ts` | ✅ done |
| 041 | Public discovery cache | US-06 | AC-06-06 | `src/features/public-discovery/lib/revalidation.ts`, `src/app/api/admin/pois/[id]/discovery-publication/route.ts`, `src/features/public-discovery/queries/admin-publication.ts`, `src/app/api/admin/pois/[id]/route.ts`, `src/app/api/admin/pois/[id]/disable/route.ts`, `src/app/api/admin/pois/[id]/delete/route.ts`, `src/app/api/admin/pois/[id]/restore/route.ts`, `src/features/admin-pois/queries/admin-pois.ts`, `src/features/public-discovery/queries/mutation-reconciliation.ts`, `src/features/public-discovery/queries/dependency-unpublication.ts`, `src/features/admin-taxonomy/queries/taxonomy.ts`, `src/app/api/admin/taxonomy/categories/[id]/route.ts`, `src/app/api/admin/taxonomy/subcategories/[id]/route.ts`, `src/features/merchant/queries/dashboard.ts`, `src/features/poi-photos/services/heal-poi-photos.ts`, `src/features/gemini-fetch/services/poi-persister.ts`, `src/features/geocoding/services/geocode-runner.ts` | `tests/unit/public-discovery.AC-06-06.revalidation.test.ts`, `tests/contract/public-discovery.AC-04.publication-api.test.ts`, `tests/contract/admin-pois.AC-01-04.api.test.ts`, `tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts`, `tests/integration/public-discovery.AC-04.publication-query.test.ts`, `tests/integration/public-discovery.AC-04.taxonomy-unpublication.test.ts`, `tests/integration/public-discovery.AC-04.merchant-unpublication.test.ts`, `tests/integration/public-discovery.AC-04.postgres-atomicity.test.ts`, `tests/unit/poi-photos.heal.test.ts`, `tests/unit/public-discovery.AC-04.gemini-unpublication.test.ts`, `tests/unit/public-discovery.AC-04.geocode-unpublication.test.ts` | ✅ done |
```

- [ ] **Step 2: Run focused Jest gates**

Run:

```bash
npm test -- --runInBand \
  tests/integration/public-discovery.AC-06.public-index-query.test.ts \
  tests/integration/public-discovery.AC-06.public-index-page.test.tsx \
  tests/integration/public-discovery.AC-01-03.public-queries.test.ts \
  tests/integration/public-discovery.AC-01-03.pages.test.tsx \
  tests/integration/public-marketing.AC-04-01.navigation.test.tsx \
  tests/unit/seo.sitemap.test.ts \
  tests/contract/public-discovery.AC-06.sitemap-route.test.ts \
  tests/unit/public-discovery.AC-06-06.revalidation.test.ts \
  tests/contract/public-discovery.AC-04.publication-api.test.ts \
  tests/contract/admin-pois.AC-01-04.api.test.ts \
  tests/contract/admin-taxonomy.AC-01-02-03-04-05.api.test.ts \
  tests/integration/public-discovery.AC-04.publication-query.test.ts \
  tests/integration/public-discovery.AC-04.taxonomy-unpublication.test.ts \
  tests/integration/public-discovery.AC-04.postgres-atomicity.test.ts \
  tests/integration/public-discovery.AC-04.merchant-unpublication.test.ts
```

Expected: sans `TEST_DATABASE_URL`, 14 suites passent et la suite PostgreSQL
atomicity est intentionnellement ignorée ; avec une DB isolée, les 15 suites
passent.

- [ ] **Step 3: Run typecheck and focused lint**

Run:

```bash
npx tsc --noEmit
npx eslint \
  src/app/'(public)'/decouvrir/page.tsx \
  src/features/public-discovery/components/DiscoveryIndexView.tsx \
  src/features/public-discovery/queries/public-discovery.ts \
  src/features/public-discovery/types.ts \
  src/features/public-discovery/lib/revalidation.ts \
  src/features/marketing/components/MarketingFooter.tsx \
  src/features/seo/lib/metadata.ts \
  src/app/sitemap.ts \
  tests/integration/public-discovery.AC-06.public-index-query.test.ts \
  tests/integration/public-discovery.AC-06.public-index-page.test.tsx
git diff --check
```

Expected: exit 0 for all commands.

- [ ] **Step 4: Run the repository regression suite with explicit environment**

Le défaut sûr ne source jamais les fichiers d'environnement principaux et ne
doit donc jamais utiliser leur `DATABASE_URL` pour Jest :

```bash
env \
  NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
  NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key \
  SUPABASE_SERVICE_ROLE_KEY=test-service-key \
  DATABASE_URL=postgresql://test:test@127.0.0.1:5432/test \
  GOOGLE_PLACES_API_KEY=test-key \
  NEXT_PUBLIC_BASE_URL=http://localhost:3000 \
  npm test -- --runInBand \
  --testPathIgnorePatterns='tests/integration/gemini-fetch.AC-01-03.cache-flow.test.ts'
```

Cette exclusion est volontairement limitée à
`tests/integration/gemini-fetch.AC-01-03.cache-flow.test.ts`, la seule suite
connue comme mutante sur DB live. Ne jamais conclure qu'un `DATABASE_URL`
générique est isolé. La suite complète n'est autorisée que si
`TEST_DATABASE_URL` est explicitement défini pour une base jetable isolée :

```bash
if [ -n "${TEST_DATABASE_URL:-}" ]; then
  env \
    NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=test-anon-key \
    SUPABASE_SERVICE_ROLE_KEY=test-service-key \
    DATABASE_URL="$TEST_DATABASE_URL" \
    GOOGLE_PLACES_API_KEY=test-key \
    NEXT_PUBLIC_BASE_URL=http://localhost:3000 \
    npm test -- --runInBand
else
  echo "Full live-DB suite skipped: TEST_DATABASE_URL is not configured."
fi
```

Le build est un contrôle séparé en lecture seule de la configuration principale
(pas de migration, seed ni test mutant) :

```bash
set -a
source ../../.env
source ../../.env.local
set +a
npm run build
```

Puis exécuter `npm run lint`. Attendu : Jest, lint et build sans erreur.

#### Execution record — 2026-08-24

- Gate Jest sûre : 409 suites passées, 1 ignorée ; 1 728 tests passés, 1 en
  attente. La cache-flow live-mutante a été délibérément exclue car
  `TEST_DATABASE_URL` était absent.
- `npx tsc --noEmit` est passé ; `npm run lint` a produit 0 erreur et 254
  warnings existants ; le build de production a passé avec les env principaux
  en lecture seule.
- Playwright `Mobile Chrome` a passé 3/3 scénarios sans skip.

- [ ] **Step 5: Review the final diff against the approved spec**

Run:

```bash
git status --short
git diff --stat edb3f89..HEAD
git diff --check edb3f89..HEAD
rg -n "TO.DO|TB.D|Découvrir nos destinations|/guide/" \
  src/app/'(public)'/decouvrir \
  src/features/public-discovery/components/DiscoveryIndexView.tsx \
  tests/integration/public-discovery.AC-06.public-index-page.test.tsx
```

Expected: aucun placeholder, aucun libellé rejeté, aucun lien privé `/guide/`.

- [ ] **Step 6: Commit traceability**

```bash
git add docs/traceability-matrix.md
git commit -m "docs(discovery): trace public discovery index"
```

- [ ] **Step 7: Request an independent code review before integration**

Use `superpowers:requesting-code-review` and require review of strict public
eligibility, one-query behavior, cache invalidation, privacy, metadata/JSON-LD,
responsive behavior and exact footer copy. Resolve every Critical/Important
finding with RED→GREEN tests before proposing merge/push.
