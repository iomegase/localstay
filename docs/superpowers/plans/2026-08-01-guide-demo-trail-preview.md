# Guide Demo Trail Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher le tracé public de Porcherey dans la fiche randonnée de démonstration avec un bouton de démarrage visible mais désactivé.

**Architecture:** `demoPois` référence un instantané TypeScript simplifié de la géométrie publique publiée. `TrailPreviewMap` gagne une variante compacte non interactive réutilisable ; son comportement privé interactif reste celui par défaut. `GuidePoiDetails` compose cet aperçu uniquement en mode démonstration et ne branche aucune action GPS.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS, Mapbox Static Images, Jest, Testing Library.

---

### Task 1: Ajouter l’instantané public du tracé

**Files:**
- Create: `src/features/guide-demo/demo-trail-geometry.ts`
- Modify: `src/features/guide-app/types.ts`
- Modify: `src/features/guide-demo/demo-pois.ts`
- Test: `tests/unit/public-guide-demo.AC-05-06.data.test.ts`

- [ ] **Step 1: Écrire le test rouge des données randonnée**

Ajouter l’import et le test suivants :

```tsx
import { isValidTrailGeometry } from '@/features/trail-navigation/lib/geo'

it('includes the published Porcherey trail geometry without enabling tracking', () => {
  const porcherey = demoPois.find(poi => poi.slug === 'alpage-de-porcherey')

  expect(isValidTrailGeometry(porcherey?.trail?.geometry)).toBe(true)
  expect(porcherey?.trail).toMatchObject({
    startLatitude: 45.8535446,
    startLongitude: 6.7236865,
    reliability: 'reliable',
    trackingEnabled: false,
  })
})
```

- [ ] **Step 2: Vérifier l’échec du test**

Run: `npm test -- tests/unit/public-guide-demo.AC-05-06.data.test.ts --runInBand`

Expected: FAIL, car `geometry`, `startLatitude`, `startLongitude` et `reliability` ne sont pas encore présents.

- [ ] **Step 3: Créer la constante de géométrie publique simplifiée**

Créer `demo-trail-geometry.ts` avec la géométrie publiée simplifiée en conservant ses segments :

```ts
import type { TrailMultiLineString } from '@/features/trail-navigation/types'

export const demoPorchereyGeometry: TrailMultiLineString = {
  type: 'MultiLineString',
  coordinates: [[[6.7236865,45.8535446],[6.7238534,45.8527003]],[[6.7238534,45.8527003],[6.7238576,45.8525156]],[[6.7238576,45.8525156],[6.7237149,45.8515499]],[[6.7237149,45.8515499],[6.7231155,45.8514514]],[[6.7231155,45.8514514],[6.7229975,45.8514812]],[[6.7229975,45.8514812],[6.7229432,45.851514]],[[6.7229432,45.851514],[6.7221267,45.8518122]],[[6.7221267,45.8518122],[6.7220037,45.8517165]],[[6.7220037,45.8517165],[6.7213072,45.851856]],[[6.7213072,45.851856],[6.7191727,45.8511009]],[[6.7191727,45.8511009],[6.7190763,45.851304]],[[6.7180733,45.8526783],[6.7190763,45.851304]],[[6.716492,45.8539871],[6.7180733,45.8526783]],[[6.7154531,45.8544008],[6.716492,45.8539871]],[[6.7154531,45.8544008],[6.7151835,45.8543158]],[[6.7151835,45.8543158],[6.7144467,45.8534962]],[[6.7144467,45.8534962],[6.7140093,45.8534643]],[[6.713247,45.8533386],[6.7140093,45.8534643]],[[6.7137193,45.8516717],[6.713247,45.8533386]],[[6.7136586,45.8510804],[6.7137193,45.8516717]],[[6.7134741,45.8509019],[6.7136586,45.8510804]],[[6.7079171,45.8548422],[6.7134741,45.8509019]],[[6.7068511,45.8550087],[6.7079171,45.8548422]],[[6.7067554,45.8550131],[6.7068511,45.8550087]],[[6.7067554,45.8550131],[6.7064988,45.854583]],[[6.706723,45.8518909],[6.7066479,45.8527719],[6.7071717,45.853519],[6.7064988,45.854583]],[[6.7074438,45.8426635],[6.7078034,45.8462775],[6.7082203,45.8478046],[6.7077723,45.8493715],[6.706723,45.8518909]],[[6.7074438,45.8426635],[6.7074078,45.8425915]],[[6.7074078,45.8425915],[6.708485,45.8429381]],[[6.708485,45.8429381],[6.7096955,45.8420633],[6.7116851,45.8412085],[6.7141446,45.8420706]],[[6.7200426,45.8410312],[6.7182924,45.8409797],[6.7158931,45.8411558],[6.7141446,45.8420706]],[[6.720141,45.8413107],[6.7200426,45.8410312]],[[6.7216615,45.8407352],[6.7213909,45.8418545],[6.720141,45.8413107]],[[6.7212579,45.8440985],[6.7216615,45.8407352]],[[6.721223,45.8441982],[6.7212579,45.8440985]],[[6.7214072,45.8444314],[6.721223,45.8441982]],[[6.7214736,45.8444768],[6.7214072,45.8444314]],[[6.7225617,45.8473231],[6.7214736,45.8444768]],[[6.7225385,45.8473487],[6.7225617,45.8473231]],[[6.7229394,45.8478238],[6.7225385,45.8473487]],[[6.7229235,45.8478812],[6.7229394,45.8478238]],[[6.7236437,45.8509216],[6.7229235,45.8478812]],[[6.7237149,45.8515499],[6.7236437,45.8509216]],[[6.7238576,45.8525156],[6.7237149,45.8515499]],[[6.7238534,45.8527003],[6.7238576,45.8525156]],[[6.7236865,45.8535446],[6.7238534,45.8527003]]],
}
```

- [ ] **Step 4: Étendre le type partagé et brancher Porcherey**

Ajouter à `GuideTrailSummary` :

```ts
geometry?: unknown
startLatitude?: number | null
startLongitude?: number | null
reliability?: 'reliable' | 'indicative'
```

Importer `demoPorchereyGeometry` dans `demo-pois.ts`, puis compléter `trail` :

```ts
geometry: demoPorchereyGeometry,
startLatitude: 45.8535446,
startLongitude: 6.7236865,
reliability: 'reliable',
```

- [ ] **Step 5: Vérifier le test vert et enregistrer**

Run: `npm test -- tests/unit/public-guide-demo.AC-05-06.data.test.ts --runInBand`

Expected: PASS, 3 tests réussis.

```bash
git add src/features/guide-demo/demo-trail-geometry.ts src/features/guide-app/types.ts src/features/guide-demo/demo-pois.ts tests/unit/public-guide-demo.AC-05-06.data.test.ts
git commit -m "feat: add public Porcherey trail snapshot"
```

### Task 2: Rendre l’aperçu partagé compact et non interactif

**Files:**
- Modify: `src/features/trail-navigation/components/TrailPreviewMap.tsx`
- Test: `tests/unit/trails.preview-reliability-badge.test.tsx`

- [ ] **Step 1: Écrire les tests rouges du nouveau contrat**

Ajouter :

```tsx
it('renders a compact non-interactive preview when startHref is absent', () => {
  render(
    <TrailPreviewMap
      {...base}
      startHref={null}
      variant="compact"
    />,
  )

  const preview = screen.getByLabelText('Aperçu de la randonnée Col de Voza')
  expect(preview).not.toHaveAttribute('href')
  expect(preview.closest('a')).toBeNull()
  expect(screen.getByTestId('trail-preview-viewport')).toHaveClass('h-[190px]')
})

it('keeps the private preview interactive by default', () => {
  render(<TrailPreviewMap {...base} />)

  expect(
    screen.getByRole('link', { name: 'Démarrer la randonnée Col de Voza' }),
  ).toHaveAttribute('href', base.startHref)
  expect(screen.getByTestId('trail-preview-viewport')).toHaveClass('h-[340px]')
})
```

- [ ] **Step 2: Vérifier l’échec ciblé**

Run: `npm test -- tests/unit/trails.preview-reliability-badge.test.tsx --runInBand`

Expected: FAIL, car `startHref` est obligatoire, `variant` est inconnu et le viewport n’a pas de test id.

- [ ] **Step 3: Implémenter le contrat minimal**

Modifier les props :

```ts
interface Props {
  name: string
  geometry: unknown | null
  startLatitude: number | null
  startLongitude: number | null
  startHref?: string | null
  reliability?: TrailReliability
  variant?: 'default' | 'compact'
}
```

Modifier également la signature afin d’appliquer la variante historique par
défaut :

```ts
export function TrailPreviewMap({
  name,
  geometry,
  startLatitude,
  startLongitude,
  startHref,
  reliability = 'reliable',
  variant = 'default',
}: Props) {
```

Construire une seule variable `content` dont le viewport utilise :

```tsx
const content = (
  <div
    data-testid="trail-preview-viewport"
    className={variant === 'compact' ? 'relative h-[190px]' : 'relative h-[340px]'}
  >
    {previewSrc ? (
      <img
        src={previewSrc}
        alt={`Carte randonnée — ${name}`}
        className="absolute inset-0 h-full w-full object-cover"
        loading="eager"
        fetchPriority="high"
        decoding="async"
      />
    ) : (
      <div className="absolute inset-0 bg-gradient-to-br from-[#dfe8d7] to-[#b5c7aa]" />
    )}

    <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-md bg-white/85 px-2 py-1 text-[9px] font-medium text-[#121212] shadow-sm">
      <MapPin className="h-3 w-3" />
      Mapbox outdoors
    </div>

    {isIndicative && (
      <div className="absolute top-3 right-3 flex items-center gap-1.5 rounded-full bg-amber-50/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-amber-700 shadow-sm ring-1 ring-amber-200">
        <AlertTriangle className="h-3 w-3" />
        Tracé indicatif
      </div>
    )}

    {endpoints && (
      <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[#455E4C] shadow-sm">
        {isLoop ? (
          <>
            <RotateCcw className="h-3 w-3" />
            Boucle
          </>
        ) : (
          <>
            <Flag className="h-3 w-3" />
            <span className="opacity-50">→</span>
            <FlagTriangleRight className="h-3 w-3" />
          </>
        )}
      </div>
    )}
  </div>
)
```

Puis choisir seulement l’enveloppe :

```tsx
if (!startHref) {
  return (
    <div
      aria-label={`Aperçu de la randonnée ${name}`}
      className="relative block overflow-hidden bg-[#E8E6DF] shadow-sm"
      data-testid="trail-preview-map"
    >
      {content}
    </div>
  )
}

return (
  <Link
    href={startHref}
    className="relative block overflow-hidden bg-[#E8E6DF] shadow-sm group focus:outline-none focus:ring-2 focus:ring-[#455E4C] focus:ring-offset-2"
    aria-label={`Démarrer la randonnée ${name}`}
    data-testid="trail-preview-map"
  >
    {content}
  </Link>
)
```

- [ ] **Step 4: Vérifier la non-régression et enregistrer**

Run: `npm test -- tests/unit/trails.preview-reliability-badge.test.tsx --runInBand`

Expected: PASS, aperçu non interactif compact et aperçu privé interactif historique.

```bash
git add src/features/trail-navigation/components/TrailPreviewMap.tsx tests/unit/trails.preview-reliability-badge.test.tsx
git commit -m "feat: support compact static trail previews"
```

### Task 3: Composer la carte et le bouton désactivé dans la démo

**Files:**
- Modify: `src/features/guide-app/components/GuidePoiDetails.tsx`
- Test: `tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`

- [ ] **Step 1: Écrire le test rouge de la fiche**

Après les assertions de métriques, ajouter :

```tsx
expect(
  screen.getByLabelText('Aperçu de la randonnée L’Alpage de Porcherey'),
).toBeInTheDocument()

const startButton = screen.getByRole('button', {
  name: 'Commencer la randonnée',
})
expect(startButton).toBeDisabled()
expect(startButton).toHaveAttribute('aria-disabled', 'true')
expect(
  screen.queryByRole('link', { name: /démarrer la randonnée/i }),
).not.toBeInTheDocument()
expect(
  screen.getByText('Suivi GPS indisponible dans le guide de démonstration.'),
).toBeInTheDocument()
```

- [ ] **Step 2: Vérifier l’échec ciblé**

Run: `npm test -- tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx --runInBand`

Expected: FAIL, car l’aperçu et le bouton désactivé ne sont pas encore rendus.

- [ ] **Step 3: Ajouter l’aperçu et l’action inactive**

Importer `Play` et `TrailPreviewMap`. Dans la section randonnée, après les métriques, ajouter :

```tsx
{mode === 'demo' && poi.trail.geometry && (
  <div className="mt-4 overflow-hidden rounded-[18px]">
    <TrailPreviewMap
      name={poi.name}
      geometry={poi.trail.geometry}
      startLatitude={poi.trail.startLatitude ?? null}
      startLongitude={poi.trail.startLongitude ?? null}
      startHref={null}
      reliability={poi.trail.reliability}
      variant="compact"
    />
  </div>
)}

{mode === 'demo' && poi.trail.geometry && (
  <>
    <p className="mt-2 text-center text-[8px] text-slate-400">
      Tracé OSM · données altimétriques IGN
    </p>
    <button
      type="button"
      disabled
      aria-disabled="true"
      className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-emerald-700/35 px-4 py-3 text-xs font-bold text-white"
    >
      <Play className="h-4 w-4 fill-current" aria-hidden="true" />
      Commencer la randonnée
    </button>
  </>
)}
```

Remplacer la mention de démonstration par :

```tsx
<p className="mt-4 rounded-xl bg-slate-50 p-3 text-[9px] leading-4 text-slate-500">
  Suivi GPS indisponible dans le guide de démonstration.
</p>
```

- [ ] **Step 4: Vérifier le test vert et les règles d’accès**

Run: `npm test -- tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx tests/unit/public-guide-demo.AC-05-08.trail.test.ts --runInBand`

Expected: PASS, aperçu visible, bouton désactivé, aucun lien `/start` ni suivi GPS.

- [ ] **Step 5: Enregistrer l’interface**

```bash
git add src/features/guide-app/components/GuidePoiDetails.tsx tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx
git commit -m "feat: show disabled trail preview in demo guide"
```

### Task 4: Traçabilité et vérification complète

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Ajouter AC-05-14/BR-34 à la matrice**

```markdown
| AC-05-14/BR-34 | Porcherey réutilise l’aperçu randonnée partagé avec sa géométrie publique dans une variante compacte non interactive et un bouton de démarrage désactivé | `src/features/guide-demo/demo-trail-geometry.ts`<br>`src/features/guide-demo/demo-pois.ts`<br>`src/features/trail-navigation/components/TrailPreviewMap.tsx`<br>`src/features/guide-app/components/GuidePoiDetails.tsx` | `tests/unit/public-guide-demo.AC-05-06.data.test.ts`<br>`tests/unit/trails.preview-reliability-badge.test.tsx`<br>`tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx` | ✅ done |
```

- [ ] **Step 2: Lancer les tests ciblés**

Run: `npm test -- tests/unit/public-guide-demo.AC-05-06.data.test.ts tests/unit/public-guide-demo.AC-05-08.trail.test.ts tests/unit/trails.preview-reliability-badge.test.tsx tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx --runInBand`

Expected: PASS.

- [ ] **Step 3: Lancer les contrôles statiques**

Run: `git diff --check`

Run: `npx eslint src/features/guide-demo/demo-trail-geometry.ts src/features/guide-demo/demo-pois.ts src/features/guide-app/types.ts src/features/trail-navigation/components/TrailPreviewMap.tsx src/features/guide-app/components/GuidePoiDetails.tsx tests/unit/public-guide-demo.AC-05-06.data.test.ts tests/unit/trails.preview-reliability-badge.test.tsx tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`

Run: `npx tsc --noEmit`

Expected: trois commandes sans erreur.

- [ ] **Step 4: Vérifier visuellement dans le modal smartphone**

Ouvrir `http://localhost:3000`, activer « Voir le guide d’exemple », ouvrir les coups de cœur puis Porcherey. Vérifier que la carte est compacte, le tracé visible, le bouton désactivé, le bloc placé avant « Voir sur la carte » et qu’aucun débordement horizontal n’apparaît.

- [ ] **Step 5: Vérifier le build de production et enregistrer la traçabilité**

Run: `npm run build`

Expected: build Next.js réussi.

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace demo trail preview"
```
