# Public Guide Demo Parity Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enrichir la démo publique MyStay avec le parcours et les quatre vues du vrai guide logement, en conservant le `GuideApp` partagé et uniquement des données et médias non sensibles.

**Architecture:** `GuideDemoModal` continue de monter le même `GuideApp` que le guide privé. L'implémentation complète uniquement la fixture `demoLodging`, ajoute une liste fermée de médias publics approuvés et renforce les tests de navigation, de confidentialité et de rendu ; aucun composant privé n'est dupliqué et aucune donnée serveur n'est chargée.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS, Testing Library/Jest, Playwright.

---

## File map

- Modify: `specs/features/031-public-marketing-site/spec.md` — ajoute le contrat validé de parité du sommaire et la politique de médias non sensibles.
- Create: `src/features/guide-demo/demo-media-policy.ts` — liste fermée des médias logement autorisés dans la démo publique.
- Modify: `src/features/guide-demo/demo-guide-data.ts` — fixture fictive `Le 305`, quatre rubriques alimentées et aucun secret réel.
- Modify: `tests/unit/public-guide-demo.AC-05-06.data.test.ts` — confidentialité de la fixture, exhaustivité et médias allowlistés.
- Modify: `tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx` — parcours Accueil → Guide → quatre vues.
- Modify: `tests/integration/public-guide-demo.AC-05-10.visual-polish.test.tsx` — identité `Bienvenue au 305` et sommaire MyStay.
- Modify: `tests/e2e/public-guide-demo.AC-05-01-09.test.ts` — parcours navigateur responsive du modal, sans assertions obsolètes sur l'ancienne home.
- Modify: `docs/traceability-matrix.md` — relie AC-05-15/BR-37 au code et aux tests.

No changes are planned for `GuideApp`, `GuideHome`, `GuideLodgingViews`, `GuideLodgingTabs`, `DepartureChecklist` or the private adapters: those shared components already implement the approved visual contract.

### Task 1: Amend the approved marketing specification

**Files:**
- Modify: `specs/features/031-public-marketing-site/spec.md:170-245`
- Modify: `specs/features/031-public-marketing-site/spec.md:320-375`
- Modify: `specs/features/031-public-marketing-site/spec.md:470-485`

- [ ] **Step 1: Add the acceptance criterion after AC-05-14**

```markdown
- **AC-05-15**: Given le guide de démonstration, When il s'ouvre puis que le
  visiteur active « Découvrir le livret d'accueil », Then l'accueil affiche
  « Bienvenue au 305 » et le sommaire affiche les horaires 16:00 / 10:00 ainsi
  que les quatre entrées `Accéder au logement`, `Informations pratiques`,
  `Équipements` et `Préparer le départ`. Given l'ouverture de chaque entrée,
  Then elle rend la vue MyStay partagée correspondante avec des données
  fictives et sans navigation vers une route privée.
```

- [ ] **Step 2: Add the media and confidentiality business rule after BR-34**

```markdown
- **BR-37**: La démo logement utilise uniquement des textes fictifs et une
  liste fermée d'assets locaux vérifiés comme non sensibles. Elle exclut toute
  photo de serrure, digicode, boîte à clés, clé identifiable, accès garage,
  entrée privée, plaque, adresse, document, code, mot de passe ou numéro privé
  provenant d'un séjour réel. Le nom de présentation est `Le 305`, l'adresse
  est un libellé de démonstration non navigable et les coordonnées restent le
  point générique du centre-ville défini par BR-24.
```

- [ ] **Step 3: Complete the acceptance-test matrix**

Add the missing existing criteria and the new criterion before `BR-35`:

```markdown
| AC-05-11 | integration + e2e |
| AC-05-12 | integration |
| AC-05-13 | integration + unit |
| AC-05-14 | integration + unit |
| AC-05-15 | unit + integration + e2e |
| BR-37 | unit + security regression |
```

- [ ] **Step 4: Verify the spec remains approved and has no open question**

Run:

```bash
rg -n "status: approved|AC-05-15|BR-37|OQ-00" specs/features/031-public-marketing-site/spec.md
```

Expected: one approved status, the new acceptance criterion and rule, and `OQ-00` resolved.

- [ ] **Step 5: Commit the specification amendment**

```bash
git add specs/features/031-public-marketing-site/spec.md
git commit -m "docs: approve public guide demo parity"
```

### Task 2: Lock down safe demo media and fictitious lodging data

**Files:**
- Create: `src/features/guide-demo/demo-media-policy.ts`
- Modify: `src/features/guide-demo/demo-guide-data.ts`
- Modify: `tests/unit/public-guide-demo.AC-05-06.data.test.ts`

- [ ] **Step 1: Write the failing fixture and privacy tests**

Extend `tests/unit/public-guide-demo.AC-05-06.data.test.ts` with these imports and cases:

```ts
import {
  APPROVED_DEMO_LODGING_MEDIA,
  isApprovedDemoLodgingMedia,
} from '@/features/guide-demo/demo-media-policy'

it('presents Le 305 with the complete fictitious lodging guide data', () => {
  expect(demoLodging).toMatchObject({
    id: 'demo-le-305',
    name: 'Le 305',
    city: 'Saint-Gervais-les-Bains',
    addressLabel: 'Résidence de démonstration, 74170 Saint-Gervais-les-Bains',
    checkIn: '16:00',
    checkOut: '10:00',
    wifiName: 'MyStay-Demo',
    wifiPassword: 'Demo-Uniquement',
  })
  expect(demoLodging.arrivalInstructions).toHaveLength(3)
  expect(demoLodging.practicalCards).toHaveLength(3)
  expect(demoLodging.houseRules.length).toBeGreaterThanOrEqual(3)
  expect(demoLodging.departureInstructions).toHaveLength(9)
})

it('contains no real access secret or private lodging location', () => {
  const serialized = JSON.stringify(demoLodging)

  expect(serialized).not.toMatch(
    /300 route du Mont-Blanc|1789|Bienvenue2026|Refuge-Mont-Blanc/i,
  )
  expect(serialized).not.toMatch(
    /bo[iî]te (?:à|a) cl[ée]s|digicode|code d['’]acc[eè]s|garage/i,
  )
  expect(serialized).not.toMatch(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
  )
})

it('uses only the closed allowlist of reviewed non-sensitive lodging media', () => {
  const media = [
    demoLodging.coverImage,
    ...demoLodging.gallery,
    ...demoLodging.arrivalInstructions.flatMap(item => [
      ...(item.videoUrl ? [item.videoUrl] : []),
      ...item.photos,
    ]),
    ...demoLodging.practicalCards.flatMap(item => [
      ...(item.photoUrl ? [item.photoUrl] : []),
      ...(item.videoUrl ? [item.videoUrl] : []),
    ]),
  ]

  expect(APPROVED_DEMO_LODGING_MEDIA).toHaveLength(4)
  expect(media.every(isApprovedDemoLodgingMedia)).toBe(true)
})
```

- [ ] **Step 2: Run the unit test to verify RED**

Run:

```bash
npm test -- tests/unit/public-guide-demo.AC-05-06.data.test.ts --runInBand
```

Expected: FAIL because `demo-media-policy.ts` does not exist and the current fixture still contains `Le Refuge du Mont-Blanc`, a precise-looking address and code `1789`.

- [ ] **Step 3: Create the closed media allowlist**

Create `src/features/guide-demo/demo-media-policy.ts`:

```ts
export const APPROVED_DEMO_LODGING_MEDIA = [
  '/marketing/guide-interior.png',
  '/marketing/demo-lodging-1.webp',
  '/marketing/demo-lodging-2.webp',
  '/marketing/demo-lodging-3.webp',
] as const

const approvedDemoLodgingMedia = new Set<string>(
  APPROVED_DEMO_LODGING_MEDIA,
)

export function isApprovedDemoLodgingMedia(value: string): boolean {
  return approvedDemoLodgingMedia.has(value)
}
```

- [ ] **Step 4: Replace `demoLodging` with the complete safe fixture**

Keep the existing imports for `GuideLodging`, `FIXED_DEPARTURE_INSTRUCTIONS` and `FIXED_HOUSE_RULES`, add:

```ts
import { APPROVED_DEMO_LODGING_MEDIA } from './demo-media-policy'
```

Then replace the object values in `src/features/guide-demo/demo-guide-data.ts` with:

```ts
export const demoLodging: GuideLodging = {
  id: 'demo-le-305',
  name: 'Le 305',
  city: 'Saint-Gervais-les-Bains',
  tagline: 'Un appartement fictif pour découvrir l’expérience MyStay.',
  coverImage: APPROVED_DEMO_LODGING_MEDIA[0],
  gallery: [...APPROVED_DEMO_LODGING_MEDIA],
  latitude: 45.8921,
  longitude: 6.7085,
  addressLabel: 'Résidence de démonstration, 74170 Saint-Gervais-les-Bains',
  checkIn: '16:00',
  checkOut: '10:00',
  wifiName: 'MyStay-Demo',
  wifiPassword: 'Demo-Uniquement',
  arrivalInstructions: [
    {
      title: 'Préparer votre arrivée',
      text: 'L’arrivée est possible à partir de 16 h. Les informations affichées dans cette démonstration sont fictives.',
      videoUrl: null,
      photos: [],
    },
    {
      title: 'Rejoindre la résidence',
      text: 'Suivez l’itinéraire transmis avec votre réservation. Aucun emplacement privé n’est publié dans cette démo.',
      videoUrl: null,
      photos: [],
    },
    {
      title: 'Entrer dans le logement',
      text: 'Dans un séjour réel, les instructions personnelles apparaissent ici de manière sécurisée.',
      videoUrl: null,
      photos: [],
    },
  ],
  departureInstructions: [...FIXED_DEPARTURE_INSTRUCTIONS],
  houseRules: [...FIXED_HOUSE_RULES],
  practicalCards: [
    {
      id: 'demo-television',
      title: 'Télévision',
      description: 'Le logement de démonstration dispose d’une Smart TV pour vos applications de streaming.',
      icon: 'tv',
    },
    {
      id: 'demo-heating',
      title: 'Chauffage',
      description: 'Le thermostat de démonstration se règle depuis la pièce principale.',
      icon: 'thermometer',
    },
    {
      id: 'demo-kitchen',
      title: 'Cuisine équipée',
      description: 'Plaques, four et lave-vaisselle sont présentés à titre d’exemple.',
      icon: 'cooking-pot',
    },
  ],
  usefulNumbers: [
    { label: 'Office de tourisme', number: '04 50 47 76 08' },
  ],
  trashBins: [{ type: 'jaune' }, { type: 'verte' }, { type: 'bordeaux' }],
  trashLocation: null,
}
```

Do not add the screenshots or their access media to `public/`. Do not reuse the existing parking video because its review status is not part of the closed allowlist.

- [ ] **Step 5: Run the fixture tests to verify GREEN**

Run:

```bash
npm test -- tests/unit/public-guide-demo.AC-05-06.data.test.ts tests/unit/guide-app.fixed-lodging-content.test.ts --runInBand
```

Expected: both suites PASS; the departure fixture still contains the nine shared instructions.

- [ ] **Step 6: Commit the safe fixture**

```bash
git add src/features/guide-demo/demo-media-policy.ts src/features/guide-demo/demo-guide-data.ts tests/unit/public-guide-demo.AC-05-06.data.test.ts
git commit -m "feat(guide): enrich safe public demo data"
```

### Task 3: Prove the shared MyStay guide journey

**Files:**
- Modify: `tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`
- Modify: `tests/integration/public-guide-demo.AC-05-10.visual-polish.test.tsx`

- [ ] **Step 1: Replace stale fixture labels and add the four-view journey test**

In the existing navigation suite, change the welcome assertion to:

```ts
expect(
  screen.getByRole('heading', { name: /bienvenue au 305/i }),
).toBeInTheDocument()
```

Replace the old `Refuge-Mont-Blanc` assertion with `MyStay-Demo`, then add:

```ts
it('opens the four shared lodging sections from the MyStay guide summary', () => {
  const views = [
    {
      button: /accéder au logement/i,
      heading: 'Bienvenue',
      visibleText: 'Résidence de démonstration',
    },
    {
      button: /informations pratiques/i,
      heading: 'Informations pratiques',
      visibleText: 'MyStay-Demo',
    },
    {
      button: /^équipements/i,
      heading: 'Les Équipements',
      visibleText: 'Télévision',
    },
    {
      button: /préparer le départ/i,
      heading: 'Checklist du départ',
      visibleText: '0 / 9',
    },
  ] as const

  for (const view of views) {
    const rendered = render(
      <GuideApp mode="demo" lodging={demoLodging} pois={demoPois} />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Guide logement' }))
    expect(screen.getByRole('button', { name: /accéder au logement/i }))
      .toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: view.button }))
    expect(screen.getByRole('heading', { name: view.heading }))
      .toBeInTheDocument()
    expect(screen.getByText(view.visibleText, { exact: false }))
      .toBeInTheDocument()

    rendered.unmount()
  }
})
```

- [ ] **Step 2: Update the visual-polish home contract**

In `tests/integration/public-guide-demo.AC-05-10.visual-polish.test.tsx`, assert the new identity and the guide summary:

```ts
expect(
  screen.getByRole('heading', { name: /bienvenue au 305/i }),
).toBeInTheDocument()

fireEvent.click(screen.getByRole('button', { name: /découvrir le livret/i }))

expect(screen.getByRole('button', { name: 'Arrivée 16:00' }))
  .toBeInTheDocument()
expect(screen.getByRole('button', { name: 'Départ 10:00' }))
  .toBeInTheDocument()
expect(screen.getByRole('button', { name: /accéder au logement/i }))
  .toBeInTheDocument()
expect(screen.getByRole('button', { name: /informations pratiques/i }))
  .toBeInTheDocument()
expect(screen.getByRole('button', { name: /équipements.*3 équipements/i }))
  .toBeInTheDocument()
expect(screen.getByRole('button', { name: /préparer le départ/i }))
  .toBeInTheDocument()
```

Add `fireEvent` to the Testing Library import.

- [ ] **Step 3: Run the shared navigation regression gate**

Run:

```bash
npm test -- tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx tests/integration/public-guide-demo.AC-05-10.visual-polish.test.tsx tests/integration/private-guide-app.AC-01-03.navigation.test.tsx tests/integration/private-guide-arrival.AC-01-01-04.page.test.tsx tests/integration/private-guide-practical-info.AC-01-01-04.page.test.tsx tests/integration/private-guide-departure.AC-01-02-03.checklist.test.tsx --runInBand
```

Expected: all six suites PASS. The private route-aware behavior remains unchanged because only the demo fixture and tests changed.

- [ ] **Step 4: Commit the integration coverage**

```bash
git add tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx tests/integration/public-guide-demo.AC-05-10.visual-polish.test.tsx
git commit -m "test(guide): cover public demo lodging journey"
```

### Task 4: Replace the obsolete browser journey with the approved demo flow

**Files:**
- Modify: `tests/e2e/public-guide-demo.AC-05-01-09.test.ts`

- [ ] **Step 1: Remove assertions for the former featured carousel on the demo home**

Delete the block that queries `guide-featured-carousel`, the three featured cards and their horizontal scroll. The current approved home is the simple `Bienvenue au 305` screen shown by the Product Owner, so that carousel no longer belongs to this E2E flow.

- [ ] **Step 2: Add browser assertions for the approved home and guide summary**

After asserting the modal metrics, add:

```ts
await expect(
  dialog.getByRole('heading', { name: /bienvenue au 305/i }),
).toBeVisible()

await dialog.getByRole('button', { name: /découvrir le livret/i }).click()

await expect(dialog.getByRole('button', { name: 'Arrivée 16:00' }))
  .toBeVisible()
await expect(dialog.getByRole('button', { name: 'Départ 10:00' }))
  .toBeVisible()
await expect(dialog.getByRole('button', { name: /accéder au logement/i }))
  .toBeVisible()
await expect(dialog.getByRole('button', { name: /informations pratiques/i }))
  .toBeVisible()
await expect(dialog.getByRole('button', { name: /équipements.*3 équipements/i }))
  .toBeVisible()
await expect(dialog.getByRole('button', { name: /préparer le départ/i }))
  .toBeVisible()
```

Keep the existing dialog geometry, URL stability, `Escape`, focus restoration and horizontal-overflow assertions.

- [ ] **Step 3: Exercise one internal view without leaving the modal**

Add before pressing `Escape`:

```ts
await dialog.getByRole('button', { name: /informations pratiques/i }).click()
await expect(
  dialog.getByRole('heading', { name: 'Informations pratiques' }),
).toBeVisible()
await expect(dialog.getByText('MyStay-Demo')).toBeVisible()
await expect(page).toHaveURL(initialUrl)
```

- [ ] **Step 4: Run Playwright at the configured device size**

Run:

```bash
npx playwright test tests/e2e/public-guide-demo.AC-05-01-09.test.ts --project="Mobile Chrome"
```

Expected: PASS. If port 3000 is occupied by an unrelated server, stop that process or set `PLAYWRIGHT_BASE_URL` to the correct local build before rerunning; do not weaken or skip the assertions.

- [ ] **Step 5: Commit the browser journey**

```bash
git add tests/e2e/public-guide-demo.AC-05-01-09.test.ts
git commit -m "test(guide): verify demo parity in browser"
```

### Task 5: Traceability and final verification

**Files:**
- Modify: `docs/traceability-matrix.md:591-600`

- [ ] **Step 1: Add the new traceability row**

Add after the AC-05-14 row:

```markdown
| AC-05-15/BR-24/BR-37 | La démo ouvre `Bienvenue au 305`, puis le sommaire partagé Accès, Informations pratiques, Équipements et Départ avec une fixture entièrement fictive et uniquement quatre médias logement locaux explicitement allowlistés comme non sensibles | `src/features/guide-demo/demo-guide-data.ts`<br>`src/features/guide-demo/demo-media-policy.ts`<br>`src/features/guide-app/components/GuideApp.tsx`<br>`src/features/guide-app/components/GuideHome.tsx`<br>`src/features/guide-app/components/GuideLodgingViews.tsx` | `tests/unit/public-guide-demo.AC-05-06.data.test.ts`<br>`tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`<br>`tests/integration/public-guide-demo.AC-05-10.visual-polish.test.tsx`<br>`tests/e2e/public-guide-demo.AC-05-01-09.test.ts` | ✅ done |
```

- [ ] **Step 2: Run the complete focused Jest gate**

Run:

```bash
npm test -- tests/unit/public-guide-demo.AC-05-06.data.test.ts tests/unit/guide-app.fixed-lodging-content.test.ts tests/unit/guide-app.equipment-labels.test.tsx tests/unit/guide-app.lodging-tabs.test.tsx tests/integration/public-guide-demo.AC-05-01-03.modal.test.tsx tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx tests/integration/public-guide-demo.AC-05-10.visual-polish.test.tsx tests/integration/private-guide-app.AC-01-03.navigation.test.tsx tests/integration/private-guide-arrival.AC-01-01-04.page.test.tsx tests/integration/private-guide-practical-info.AC-01-01-04.page.test.tsx tests/integration/private-guide-departure.AC-01-02-03.checklist.test.tsx --runInBand
```

Expected: all suites PASS with zero failed tests.

- [ ] **Step 3: Run type checking and scoped lint**

Run:

```bash
npx tsc --noEmit
npx eslint src/features/guide-demo/demo-media-policy.ts src/features/guide-demo/demo-guide-data.ts tests/unit/public-guide-demo.AC-05-06.data.test.ts tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx tests/integration/public-guide-demo.AC-05-10.visual-polish.test.tsx tests/e2e/public-guide-demo.AC-05-01-09.test.ts
git diff --check
```

Expected: all commands exit 0 with no new warning in the changed files and no whitespace error.

- [ ] **Step 4: Run the full safe Jest regression suite**

The repository contains a live-mutating Gemini cache-flow integration suite. Do not run it unless an isolated disposable `TEST_DATABASE_URL` is configured. Run the safe full gate:

```bash
npm test -- --runInBand --testPathIgnorePatterns=tests/integration/gemini-fetch.AC-01-03.cache-flow.test.ts
```

Expected: all selected suites PASS. Record the single explicitly excluded live-database suite in the final handoff.

- [ ] **Step 5: Run the production build with the project environment**

Run:

```bash
npm run build
```

Expected: Prisma generation, Next compilation, TypeScript and page generation all complete successfully. If the build lacks required Supabase/Mapbox environment values, rerun after loading the existing local development environment; never invent or commit credentials.

- [ ] **Step 6: Commit traceability**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace public guide demo parity"
```

- [ ] **Step 7: Perform the final clean-tree audit**

Run:

```bash
git status --short
git log -5 --oneline
git diff HEAD~5 --check
```

Expected: empty status, the scoped commits visible, and no diff-check error. Do not merge or push unless the Product Owner separately requests those operations.
