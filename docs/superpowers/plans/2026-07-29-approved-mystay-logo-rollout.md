# Approved MyStay Logo Rollout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer toutes les occurrences actives de l'ancien logo par les variantes approuvées, via un composant `MyStayLogo` partagé, sans modifier les layouts.

**Architecture:** Un Server Component `MyStayLogo` centralise la résolution des quatre variantes d'assets et délègue les dimensions aux consommateurs par `className`. Les surfaces marketing, guide, Auth, dashboard Owner et Super-admin réutilisent ce composant ; les favicons existants restent inchangés.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, `next/image`, Tailwind CSS, Jest, Testing Library, Playwright.

---

### Task 1: Contrat du composant de marque

**Files:**
- Create: `src/shared/components/brand/MyStayLogo.tsx`
- Create: `tests/unit/approved-brand-identity.AC-01-01-03.logo.test.tsx`

- [x] **Step 1: Write the failing variant test**

```tsx
render(<MyStayLogo form="horizontal" tone="standard" />)
expect(screen.getByAltText('MyStay')).toHaveAttribute(
  'src',
  expect.stringContaining('mystay-logo-approved%404x.png'),
)
```

Tester aussi `horizontal/reversed`, `mark/standard` et `mark/reversed`.

- [x] **Step 2: Run the test and verify RED**

Run:

```bash
npm test -- tests/unit/approved-brand-identity.AC-01-01-03.logo.test.tsx --runInBand
```

Expected: FAIL because `MyStayLogo` does not exist.

- [x] **Step 3: Implement the typed resolver**

```tsx
import Image from 'next/image'

type LogoForm = 'horizontal' | 'mark'
type LogoTone = 'standard' | 'reversed'

const sources = {
  horizontal: {
    standard: '/mystay-logo-approved/mystay-logo-approved@4x.png',
    reversed: '/mystay-logo-approved/mystay-logo-approved-reversed@4x.png',
  },
  mark: {
    standard: '/mystay-logo-approved/mystay-mark-approved@4x.png',
    reversed: '/mystay-logo-approved/mystay-mark-approved@4x.png',
  },
} satisfies Record<LogoForm, Record<LogoTone, string>>
```

Le monogramme transparent conserve sa couleur approuvée dans les deux tons ;
aucun filtre CSS n'est appliqué.

- [x] **Step 4: Run the unit test and verify GREEN**

Expected: four variant assertions pass.

### Task 2: Adoption marketing et GuideApp

**Files:**
- Modify: `src/features/marketing/components/MarketingHeader.tsx`
- Modify: `src/features/guide-app/components/GuideHeader.tsx`
- Create: `tests/integration/approved-brand-identity.AC-01-04.guide-header.test.tsx`

- [x] **Step 1: Write the failing GuideHeader test**

```tsx
render(<GuideHeader mode="demo" city="Saint-Gervais-les-Bains" onOpenHome={jest.fn()} />)
expect(screen.getByAltText('MyStay')).toHaveAttribute(
  'src',
  expect.stringContaining('mystay-logo-approved%404x.png'),
)
expect(screen.getByText('Saint-Gervais-les-Bains')).toBeInTheDocument()
```

- [x] **Step 2: Run the test and verify RED**

Expected: FAIL because the current header renders a Mountain icon and text.

- [x] **Step 3: Replace local image selection**

`MarketingBrand` and `GuideHeader` render `MyStayLogo`; the existing links,
buttons, city label and dimensions remain unchanged.

- [x] **Step 4: Run both brand tests and verify GREEN**

### Task 3: Adoption Auth et dashboards

**Files:**
- Modify: `src/app/(auth)/layout.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`
- Modify: `src/app/admin/layout.tsx`
- Create: `tests/unit/approved-brand-identity.AC-01-05.legacy-logo.test.ts`

- [x] **Step 1: Write the failing legacy-path test**

```ts
for (const source of activeBrandSources) {
  expect(source).not.toContain('src="/logo.png"')
}
```

- [x] **Step 2: Run the test and verify RED**

Expected: FAIL with the active `/logo.png` occurrences.

- [x] **Step 3: Replace active legacy images**

Use `horizontal/standard` in Auth, `mark/standard` in compact white dashboard
circles and `mark/reversed` on compact dark mobile headers. Remove
`brightness-0`, `invert` and obsolete replacement comments.

- [x] **Step 4: Run brand tests and verify GREEN**

### Task 4: Traceability and verification

**Files:**
- Modify: `docs/traceability-matrix.md`
- Modify: `docs/superpowers/plans/2026-07-29-approved-mystay-logo-rollout.md`
- Test: `tests/e2e/public-guide-demo.AC-05-01-09.test.ts`

- [x] **Step 1: Add spec 032 traceability rows**

Map AC-01-01 through AC-01-06 to the shared component, consumers and tests.

- [x] **Step 2: Run focused tests**

```bash
npm test -- tests/unit/approved-brand-identity.AC-01-01-03.logo.test.tsx tests/integration/approved-brand-identity.AC-01-04.guide-header.test.tsx tests/unit/approved-brand-identity.AC-01-05.legacy-logo.test.ts --runInBand
```

- [x] **Step 3: Run static verification**

```bash
npx eslint src/shared/components/brand/MyStayLogo.tsx src/features/marketing/components/MarketingHeader.tsx src/features/guide-app/components/GuideHeader.tsx
npx tsc --noEmit --pretty false
npm run build
```

- [x] **Step 4: Run visual responsive verification**

Verify Auth, marketing, GuideApp, dashboard and admin at mobile and desktop
widths, with no horizontal overflow.

- [x] **Step 5: Leave the work local**

Do not push or deploy. Keep the local server available on port 3000.
