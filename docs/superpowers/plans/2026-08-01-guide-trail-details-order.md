# Guide Trail Details Order Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Placer le bloc randonnée d’une fiche POI avant le bouton « Voir sur la carte », sans modifier son design ni ses interactions.

**Architecture:** Le composant partagé `GuidePoiDetails` conserve une seule section randonnée et la déplace physiquement dans l’ordre JSX. Un test d’intégration traverse le `GuideApp` de démonstration jusqu’à Porcherey et vérifie l’ordre DOM ainsi que les garanties existantes sur les métriques et le suivi GPS.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS, Jest, Testing Library.

---

### Task 1: Verrouiller l’ordre attendu par un test d’intégration

**Files:**
- Modify: `tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`

- [ ] **Step 1: Étendre le test de la fiche randonnée avec l’ordre DOM attendu**

Ajouter à la fin du test `opens a complete POI sheet and keeps trail tracking disabled` :

```tsx
const trailHeading = screen.getByRole('heading', {
  name: 'Les informations du parcours',
})
const trailSection = trailHeading.closest('section')
const mapButton = screen.getByRole('button', { name: 'Voir sur la carte' })

expect(trailSection).not.toBeNull()
expect(
  trailSection?.compareDocumentPosition(mapButton)
  ?? Node.DOCUMENT_POSITION_PRECEDING,
).toBe(Node.DOCUMENT_POSITION_FOLLOWING)
```

- [ ] **Step 2: Exécuter le test pour constater l’échec**

Run: `npm test -- tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx --runInBand`

Expected: FAIL sur l’assertion d’ordre, car le bouton Carte précède encore la section randonnée.

- [ ] **Step 3: Enregistrer le test rouge**

```bash
git add tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx
git commit -m "test: require trail details before map action"
```

### Task 2: Déplacer la section randonnée

**Files:**
- Modify: `src/features/guide-app/components/GuidePoiDetails.tsx:106-180`

- [ ] **Step 1: Déplacer le JSX existant sans le modifier**

Déplacer le bloc conditionnel complet suivant immédiatement après l’attribution photo et avant le commentaire `Voir sur la carte` :

```tsx
{/* Bloc randonnée (sans démarrage GPS en démo) */}
{poi.trail && (
  <section className="mx-6 rounded-[22px] bg-white p-4 shadow-sm">
    <div className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
        <Mountain className="h-5 w-5" />
      </span>
      <div>
        <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-emerald-700">
          Randonnée {formatDifficulty(poi.trail.difficulty)}
        </p>
        <h2 className="text-sm font-semibold text-slate-900">Les informations du parcours</h2>
      </div>
    </div>
    <div className="mt-4 grid grid-cols-3 gap-2">
      <Metric
        icon={Route}
        value={poi.trail.distanceKm === null ? '—' : `${String(poi.trail.distanceKm).replace('.', ',')} km`}
        label="Distance"
      />
      <Metric
        icon={TrendingUp}
        value={poi.trail.elevationGainM === null ? '—' : `${poi.trail.elevationGainM} m`}
        label="Dénivelé"
      />
      <Metric icon={Mountain} value={poi.durationLabel ?? '—'} label="Durée" />
    </div>
    {canStartTrail(mode, poi.trail) && (
      <button
        type="button"
        aria-label="Démarrer la randonnée"
        className="mt-4 w-full rounded-full bg-emerald-700 px-4 py-3 text-xs font-bold text-white"
      >
        Démarrer
      </button>
    )}
    {mode === 'demo' && (
      <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[9px] leading-4 text-slate-500">
        Le suivi GPS est volontairement désactivé dans le guide de démonstration.
      </p>
    )}
  </section>
)}
```

Le bloc ne doit plus apparaître après `ActionButtons`. Ne pas introduire de classe `order`, de duplication ou de nouvelle condition.

- [ ] **Step 2: Exécuter le test d’intégration ciblé**

Run: `npm test -- tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx --runInBand`

Expected: PASS, 2 tests réussis.

- [ ] **Step 3: Exécuter les tests de non-régression randonnée**

Run: `npm test -- tests/unit/public-guide-demo.AC-05-08.trail.test.ts tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx --runInBand`

Expected: PASS, métriques Porcherey visibles et démarrage GPS absent en mode démonstration.

- [ ] **Step 4: Enregistrer l’implémentation**

```bash
git add src/features/guide-app/components/GuidePoiDetails.tsx
git commit -m "fix: place trail details before map action"
```

### Task 3: Mettre à jour la traçabilité et vérifier

**Files:**
- Modify: `docs/traceability-matrix.md:566-595`

- [ ] **Step 1: Ajouter la ligne de traçabilité AC-05-13/BR-33**

Ajouter dans la section `031 — Public Marketing Site` :

```markdown
| AC-05-13/BR-33 | La fiche d’un POI randonnée place physiquement les informations du parcours avant le bouton Carte, tout en conservant les métriques et le suivi GPS désactivé en démonstration | `src/features/guide-app/components/GuidePoiDetails.tsx` | `tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`<br>`tests/unit/public-guide-demo.AC-05-08.trail.test.ts` | ✅ done |
```

- [ ] **Step 2: Vérifier le formatage, le lint et TypeScript**

Run: `git diff --check`

Expected: aucune sortie.

Run: `npx eslint src/features/guide-app/components/GuidePoiDetails.tsx tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx`

Expected: exit 0, aucune erreur.

Run: `npx tsc --noEmit`

Expected: exit 0, aucune erreur TypeScript.

- [ ] **Step 3: Vérifier le build de production**

Run: `npm run build`

Expected: exit 0, build Next.js réussi.

- [ ] **Step 4: Enregistrer la traçabilité**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace guide trail detail order"
```
