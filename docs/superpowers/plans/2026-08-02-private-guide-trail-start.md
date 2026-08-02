# Private Guide Trail Start Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Relier le bouton randonnée du guide privé au mode Mapbox Outdoor existant sans activer le suivi dans la démonstration.

**Architecture:** La query privée transmet au `GuideApp` le slug de la City réelle de chaque POI. Le shell routé compose la route canonique avec ce slug et conserve le slug de City du Lodging uniquement comme repli de compatibilité, puis `GuidePoiDetails` déclenche l'action seulement si `canStartTrail` l'autorise.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Tailwind CSS, Jest, Testing Library.

---

### Task 1: Brancher le bouton privé sur la navigation randonnée existante

**Files:**
- Modify: `tests/integration/private-guide-app.AC-01-01-04.home.test.tsx`
- Modify: `tests/integration/private-guide-app.AC-01-03.navigation.test.tsx`
- Modify: `src/features/guide-app/components/PrivateGuidePage.tsx`
- Modify: `src/features/guide-app/components/GuideApp.tsx`
- Modify: `src/features/guide-app/components/GuidePoiDetails.tsx`
- Modify: `src/features/guide-app/queries/private-guide-data.ts`
- Modify: `src/features/guide-app/types.ts`
- Modify: `tests/unit/private-guide-app.AC-01-05.data.test.ts`
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Écrire les tests rouges**

Dans `private-guide-app.AC-01-01-04.home.test.tsx`, exposer `citySlug` dans le mock `GuideApp`, puis vérifier que le contexte actif fournit `saint-gervais-les-bains`.

Dans `private-guide-app.AC-01-03.navigation.test.tsx`, ajouter un POI randonnée privé avec `trackingEnabled: true`, ouvrir sa fiche et cliquer sur `Démarrer la randonnée` :

```tsx
it('opens the existing Mapbox trail navigation from a private trail', () => {
  const trailPoi = {
    ...demoPois.find(poi => poi.slug === 'l-alpage-de-porcherey')!,
    citySlug: 'les-contamines-montjoie',
    trail: {
      ...demoPois.find(poi => poi.slug === 'l-alpage-de-porcherey')!.trail!,
      trackingEnabled: true,
    },
  }

  render(
    <GuideApp
      mode="private"
      lodging={demoLodging}
      pois={[trailPoi]}
      citySlug="saint-gervais-les-bains"
      initialView="favorites"
      routes={{ home: '/sejour', favorites: '/sejour/coups-de-coeur' }}
    />,
  )

  fireEvent.click(screen.getByRole('button', { name: /ouvrir l’alpage de porcherey/i }))
  fireEvent.click(screen.getByRole('button', { name: 'Démarrer la randonnée' }))

  expect(mockPush).toHaveBeenLastCalledWith(
    '/guide/les-contamines-montjoie/rando/l-alpage-de-porcherey/start',
  )
})
```

Dans `private-guide-app.AC-01-05.data.test.ts`, vérifier que l'adaptateur
conserve `poi.city.slug` sur le `GuidePoi` retourné.

- [ ] **Step 2: Vérifier l'échec attendu**

Run:

```bash
npm test -- tests/integration/private-guide-app.AC-01-01-04.home.test.tsx tests/integration/private-guide-app.AC-01-03.navigation.test.tsx --runInBand
```

Expected: FAIL parce que l'adaptateur privé ne conserve pas encore
`poi.city.slug` et que la navigation utilise le slug de City du Lodging au lieu
de celui du POI inter-ville.

- [ ] **Step 3: Transmettre le slug de City du Lodging comme repli**

Dans `PrivateGuidePage.tsx`, conserver le slug du Lodging comme repli de
compatibilité :

```tsx
<GuideApp
  mode="private"
  lodging={guideData.lodging}
  pois={guideData.pois}
  citySlug={lodgingContext.citySlug}
  initialView={initialView}
  routes={PRIVATE_GUIDE_ROUTES}
  menuItems={menuItems}
/>
```

- [ ] **Step 4: Construire l'action de démarrage dans le shell routé**

Ajouter `citySlug?: string` à `GuideAppProps` comme repli de compatibilité et
`citySlug?: string` à `GuidePoi`. La query privée sélectionne et mappe toujours
`poi.city.slug`. Dans `RoutedGuideApp`, transmettre une action côté client :

```tsx
const fallbackCitySlug = props.mode === 'private' ? props.citySlug : undefined

onStartTrail={fallbackCitySlug
  ? poi => router.push(
      `/guide/${poi.citySlug ?? fallbackCitySlug}/rando/${poi.slug}/start`,
    )
  : undefined}
```

Ajouter `onStartTrail?: (poi: GuidePoi) => void` au shell et le transmettre à `GuidePoiDetails`.

- [ ] **Step 5: Activer le bouton seulement lorsque l'action est disponible**

Dans `GuidePoiDetails.tsx`, ajouter la prop optionnelle et remplacer le bouton privé par :

```tsx
{canStartTrail(mode, poi.trail) && onStartTrail && (
  <button
    type="button"
    onClick={() => onStartTrail(poi)}
    aria-label="Démarrer la randonnée"
    className="mt-4 w-full rounded-full bg-emerald-700 px-4 py-3 text-xs font-bold text-white"
  >
    Démarrer
  </button>
)}
```

- [ ] **Step 6: Vérifier les tests ciblés au vert**

Run:

```bash
npm test -- tests/integration/private-guide-app.AC-01-01-04.home.test.tsx tests/integration/private-guide-app.AC-01-03.navigation.test.tsx tests/unit/private-guide-app.AC-01-05.data.test.ts tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx tests/unit/public-guide-demo.AC-05-08.trail.test.ts tests/integration/trail-navigation.session-flow.test.tsx --runInBand
```

Expected: PASS. La City réelle du POI est conservée, la démo garde son bouton
désactivé et les tests du suivi existant restent verts.

- [ ] **Step 7: Mettre à jour la traçabilité**

Ajouter dans la section `021 — Trail Navigation` de `docs/traceability-matrix.md` une ligne reliant `AC-01-05/AC-02-01/AC-02-02/BR-01/BR-04` aux composants, au type et à la query du guide privé, ainsi qu'aux tests de navigation et de mapping inter-ville.

- [ ] **Step 8: Exécuter les vérifications globales**

Run:

```bash
npx tsc --noEmit
npm run lint
npm run build
```

Expected: TypeScript et build terminent avec le code `0`; lint ne contient aucune nouvelle erreur.

- [ ] **Step 9: Commit ciblé**

```bash
git add src/features/guide-app/components/PrivateGuidePage.tsx src/features/guide-app/components/GuideApp.tsx src/features/guide-app/components/GuidePoiDetails.tsx src/features/guide-app/queries/private-guide-data.ts src/features/guide-app/types.ts tests/integration/private-guide-app.AC-01-01-04.home.test.tsx tests/integration/private-guide-app.AC-01-03.navigation.test.tsx tests/unit/private-guide-app.AC-01-05.data.test.ts docs/traceability-matrix.md docs/superpowers/specs/2026-08-02-private-guide-trail-start-design.md docs/superpowers/plans/2026-08-02-private-guide-trail-start.md
git commit -m "feat: restore private trail navigation start"
```
