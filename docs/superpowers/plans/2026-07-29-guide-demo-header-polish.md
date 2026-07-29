# Guide Demo Header Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Neutraliser les icônes des raccourcis du guide, renforcer le monogramme MyStay dans son header et supprimer le bouton flottant de fermeture du modal.

**Architecture:** Les ajustements restent dans les composants partagés existants `GuideHome`, `GuideHeader` et `GuideDemoModal`. Le composant `MyStayLogo` fournit le monogramme approuvé ; Radix Dialog conserve `Escape`, l’overlay, le focus trap et le retour du focus sans contrôle flottant supplémentaire.

**Tech Stack:** Next.js 16 App Router, React, TypeScript strict, Tailwind CSS, Radix Dialog, Jest, Testing Library, Playwright.

---

### Task 1: Contrat visuel du header partagé

**Files:**
- Modify: `tests/integration/approved-brand-identity.AC-01-04.guide-header.test.tsx`
- Modify: `src/features/guide-app/components/GuideHeader.tsx`

- [x] **Step 1: Write the failing header assertions**

Remplacer l’attente du logo horizontal par le monogramme et vérifier les
dimensions du header et du logo :

```tsx
expect(logoSource).toContain(
  '/mystay-logo-approved/mystay-mark-approved@4x.png',
)
expect(screen.getByRole('banner')).toHaveClass('h-[68px]')
expect(screen.getByAltText('MyStay')).toHaveClass('w-[50px]')
expect(screen.getByText('Saint-Gervais-les-Bains')).toBeInTheDocument()
expect(screen.getByTestId('guide-menu-icon')).toBeInTheDocument()
```

- [x] **Step 2: Run the header test and verify RED**

Run:

```bash
npm test -- tests/integration/approved-brand-identity.AC-01-04.guide-header.test.tsx --runInBand
```

Expected: FAIL because the header still renders the horizontal asset at 72 px
inside a 58 px header.

- [x] **Step 3: Implement the monogram header**

Dans `GuideHeader`, utiliser :

```tsx
<header className="... h-[68px] ...">
  <MyStayLogo
    form="mark"
    className="h-auto w-[50px] object-contain"
    priority
    sizes="50px"
  />
</header>
```

Conserver la ville sous le logo, le badge de démonstration, l’action d’accueil
et le bouton menu. Ajouter `data-testid="guide-menu-icon"` au conteneur du menu.

- [x] **Step 4: Run the header test and verify GREEN**

Expected: both GuideHeader tests pass.

### Task 2: Raccourcis d’accueil neutres

**Files:**
- Create: `tests/integration/public-guide-demo.AC-05-10.visual-polish.test.tsx`
- Modify: `src/features/guide-app/components/GuideHome.tsx`

- [x] **Step 1: Write the failing neutral-color test**

```tsx
render(
  <GuideApp mode="demo" lodging={demoLodging} pois={demoPois} />,
)

for (const name of [/arrivée dès 16:00/i, /wi-fi refuge-mont-blanc/i]) {
  const button = screen.getByRole('button', { name })
  const icon = button.querySelector('[data-testid="quick-card-icon"]')
  expect(icon).toHaveClass('bg-slate-100', 'text-slate-600')
  expect(icon).not.toHaveClass('bg-pink-50', 'text-pink-600')
}
```

- [x] **Step 2: Run the visual-polish test and verify RED**

Run:

```bash
npm test -- tests/integration/public-guide-demo.AC-05-10.visual-polish.test.tsx --runInBand
```

Expected: FAIL because the quick-card icon wrapper still uses pink classes.

- [x] **Step 3: Implement the neutral treatment**

Ajouter `data-testid="quick-card-icon"` et remplacer uniquement le wrapper des
deux raccourcis par :

```tsx
className="grid h-9 w-9 place-items-center rounded-xl bg-slate-100 text-slate-600"
```

- [x] **Step 4: Run the visual-polish test and verify GREEN**

Expected: the two quick-card assertions pass.

### Task 3: Modal sans bouton flottant

**Files:**
- Modify: `tests/integration/public-guide-demo.AC-05-01-03.modal.test.tsx`
- Modify: `src/features/guide-demo/components/GuideDemoModal.tsx`

- [x] **Step 1: Write the failing absence assertion**

Après l’ouverture du modal :

```tsx
expect(
  screen.queryByRole('button', {
    name: 'Fermer le guide de démonstration',
  }),
).not.toBeInTheDocument()
```

Le test existant de fermeture `Escape` et de restauration du focus reste
inchangé.

- [x] **Step 2: Run the modal test and verify RED**

Run:

```bash
npm test -- tests/integration/public-guide-demo.AC-05-01-03.modal.test.tsx --runInBand
```

Expected: FAIL because the floating Radix `Dialog.Close` is still present.

- [x] **Step 3: Remove only the floating control**

Supprimer l’import `X` et le bloc `Dialog.Close`. Ne modifier ni
`Dialog.Overlay`, ni `Dialog.Content`, ni les gestionnaires Radix.

- [x] **Step 4: Run the modal test and verify GREEN**

Expected: modal opens, has no floating close button, closes with `Escape` and
restores focus.

### Task 4: Traceability and verification

**Files:**
- Modify: `docs/traceability-matrix.md`
- Modify: `docs/superpowers/plans/2026-07-29-guide-demo-header-polish.md`

- [x] **Step 1: Add AC-05-10 and amended AC-01-04 traceability**

Relier les critères aux trois composants et aux tests ciblés.

- [x] **Step 2: Run focused regression tests**

```bash
npm test -- tests/integration/approved-brand-identity.AC-01-04.guide-header.test.tsx tests/integration/public-guide-demo.AC-05-10.visual-polish.test.tsx tests/integration/public-guide-demo.AC-05-01-03.modal.test.tsx tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx --runInBand
```

Expected: all focused suites pass.

- [x] **Step 3: Run static checks**

```bash
npx eslint src/features/guide-app/components/GuideHeader.tsx src/features/guide-app/components/GuideHome.tsx src/features/guide-demo/components/GuideDemoModal.tsx
npx tsc --noEmit --pretty false
npm run build
```

Expected: zero errors.

- [x] **Step 4: Run responsive modal verification**

```bash
npx playwright test tests/e2e/public-guide-demo.AC-05-01-09.test.ts --project='Mobile Chrome' --workers=1
```

Expected: mobile, tablet and desktop pass without horizontal overflow.

- [x] **Step 5: Leave work local**

Do not push or deploy. Keep the development server available on port 3000.
