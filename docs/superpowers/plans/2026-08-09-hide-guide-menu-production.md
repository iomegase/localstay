# Hide Guide Menu in Production Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Retirer temporairement le bouton burger et son overlay des guides privé et démo en production, sans affecter leur comportement local ni les autres menus publics.

**Architecture:** Un helper pur traduit `NODE_ENV` en disponibilité du menu. `GuideApp` utilise ce résultat par défaut, le transmet au `GuideHeader` et ne monte l'overlay que lorsque le menu est disponible ; une prop optionnelle permet aux tests de simuler explicitement chaque environnement.

**Tech Stack:** Next.js 16, React, TypeScript strict, Tailwind CSS, Jest, Testing Library.

---

### Task 1: Amender le contrat approuvé du guide privé

**Files:**
- Modify: `specs/features/034-private-guide-app/spec.md`

- [ ] **Step 1: Corriger le critère du header**

Remplacer dans `AC-01-03` l'obligation permanente de conserver le menu par le contrat temporaire suivant :

```markdown
- **AC-01-03**: Given la home privée, When elle s'affiche à 375 px, Then elle
  conserve le header MyStay, le titre de bienvenue, trois accès rapides et la
  navigation basse sans débordement horizontal. En production, le bouton menu
  est absent ; hors production, il reste disponible pour les vérifications.
```

- [ ] **Step 2: Ajouter la règle métier d'environnement**

Ajouter à la suite de `BR-12` :

```markdown
- **BR-13**: Dans le `GuideApp` partagé par le guide privé et le guide démo, le
  bouton burger et `GuideMenuOverlay` ne sont pas rendus lorsque
  `NODE_ENV === 'production'`. Ils restent disponibles hors production. Les
  autres menus publics ne sont pas concernés.
```

Dans `UI Behaviour`, remplacer la mention du bouton de menu par :

```markdown
- Header partagé : logo MyStay approuvé ; le bouton menu est rendu uniquement
  hors production.
```

- [ ] **Step 3: Vérifier et commit la spec**

Run:

```bash
rg -n "AC-01-03|BR-13|bouton menu" specs/features/034-private-guide-app/spec.md
git diff --check
```

Expected: la spec reste `status: approved`, les trois mentions concordent et `git diff --check` ne signale rien.

```bash
git add specs/features/034-private-guide-app/spec.md
git commit -m "docs(guide): specify production menu visibility"
```

### Task 2: Écrire les tests de régression en échec

**Files:**
- Create: `tests/unit/guide-app.menu-visibility.test.tsx`
- Modify: `src/features/guide-app/components/GuideHeader.tsx`
- Modify: `src/features/guide-app/components/GuideApp.tsx`
- Create: `src/features/guide-app/lib/guide-menu-visibility.ts`

- [ ] **Step 1: Écrire le contrat testable**

Créer `tests/unit/guide-app.menu-visibility.test.tsx` :

```tsx
/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { GuideApp } from '@/features/guide-app/components/GuideApp'
import { isGuideMenuEnabled } from '@/features/guide-app/lib/guide-menu-visibility'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'
import { demoPois } from '@/features/guide-demo/demo-pois'

describe('034 BR-13 — visibilité temporaire du menu GuideApp', () => {
  it('active le menu hors production et le désactive en production', () => {
    expect(isGuideMenuEnabled('development')).toBe(true)
    expect(isGuideMenuEnabled('test')).toBe(true)
    expect(isGuideMenuEnabled('production')).toBe(false)
  })

  it('conserve le burger et l’overlay lorsque le menu est activé', () => {
    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
        menuEnabled
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir le menu' }))
    expect(screen.getByTestId('guide-menu-overlay')).toBeInTheDocument()
  })

  it('ne rend ni burger ni overlay lorsque le menu est désactivé', () => {
    render(
      <GuideApp
        mode="demo"
        lodging={demoLodging}
        pois={demoPois}
        menuEnabled={false}
      />,
    )

    expect(screen.queryByRole('button', { name: 'Ouvrir le menu' })).not.toBeInTheDocument()
    expect(screen.queryByTestId('guide-menu-overlay')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Accueil du guide' })).toBeInTheDocument()
  })
})
```

- [ ] **Step 2: Exécuter le test et observer l'échec**

Run:

```bash
npm test -- --runInBand tests/unit/guide-app.menu-visibility.test.tsx
```

Expected: FAIL parce que le helper et la prop `menuEnabled` n'existent pas.

### Task 3: Implémenter le masquage conditionnel minimal

**Files:**
- Create: `src/features/guide-app/lib/guide-menu-visibility.ts`
- Modify: `src/features/guide-app/components/GuideHeader.tsx`
- Modify: `src/features/guide-app/components/GuideApp.tsx`
- Test: `tests/unit/guide-app.menu-visibility.test.tsx`

- [ ] **Step 1: Créer le helper pur**

Créer `src/features/guide-app/lib/guide-menu-visibility.ts` :

```ts
export function isGuideMenuEnabled(environment = process.env.NODE_ENV): boolean {
  return environment !== 'production'
}
```

- [ ] **Step 2: Rendre le burger conditionnel dans le header**

Ajouter `menuEnabled?: boolean` aux props de `GuideHeader`, avec `true` par défaut, puis entourer le bouton burger :

```tsx
export function GuideHeader({
  onOpenHome,
  onOpenMenu,
  menuEnabled = true,
}: {
  city?: string
  onOpenHome: () => void
  onOpenMenu?: () => void
  menuEnabled?: boolean
}) {
```

```tsx
{menuEnabled && (
  <button
    type="button"
    onClick={onOpenMenu}
    aria-label="Ouvrir le menu"
    data-testid="guide-menu-icon"
    className="translate-x-1 translate-y-1.5 p-2 text-slate-800"
  >
    <Menu className="h-6 w-6" strokeWidth={2} />
  </button>
)}
```

- [ ] **Step 3: Appliquer le contrat dans GuideApp**

Importer `isGuideMenuEnabled`, ajouter `menuEnabled?: boolean` à `GuideAppProps`, puis utiliser sa valeur par défaut dans `GuideAppShell` :

```tsx
import { isGuideMenuEnabled } from '@/features/guide-app/lib/guide-menu-visibility'
```

```ts
type GuideAppProps = {
  mode: GuideMode
  lodging: GuideLodging
  pois: GuidePoi[]
  citySlug?: string
  initialView?: GuideView
  routes?: GuideRouteMap
  menuItems?: GuideMenuItem[]
  lodgings?: GuideLodgingCard[]
  blogPosts?: GuideBlogPost[]
  contact?: GuideContactInfo
  menuEnabled?: boolean
}
```

```tsx
function GuideAppShell({
  mode,
  lodging,
  pois,
  initialView = 'home',
  routes,
  menuItems,
  lodgings,
  blogPosts,
  contact,
  menuEnabled = isGuideMenuEnabled(),
  onOpenRoute,
  onStartTrail,
}: GuideAppProps & {
  onOpenRoute?: (href: string) => boolean
  onStartTrail?: (poi: GuidePoi) => void
}) {
```

Transmettre `menuEnabled={menuEnabled}` au `GuideHeader`, puis ne monter l'overlay que lorsqu'il est actif :

```tsx
<GuideHeader
  city={lodging.city}
  onOpenHome={() => navigate('home')}
  onOpenMenu={() => setMenuOpen(true)}
  menuEnabled={menuEnabled}
/>
```

```tsx
{menuEnabled && (
  <GuideMenuOverlay
    open={menuOpen}
    onClose={() => setMenuOpen(false)}
    onNavigate={navigate}
    lodgingName={lodging.name}
    items={menuItems}
  />
)}
```

- [ ] **Step 4: Exécuter les tests concernés**

Run:

```bash
npm test -- --runInBand \
  tests/unit/guide-app.menu-visibility.test.tsx \
  tests/integration/approved-brand-identity.AC-01-04.guide-header.test.tsx \
  tests/integration/public-guide-demo.AC-05-04.navigation.test.tsx \
  tests/integration/private-guide-app.AC-01-03.navigation.test.tsx
```

Expected: 4 suites PASS, aucun échec.

- [ ] **Step 5: Commit l'implémentation**

```bash
git add \
  src/features/guide-app/lib/guide-menu-visibility.ts \
  src/features/guide-app/components/GuideHeader.tsx \
  src/features/guide-app/components/GuideApp.tsx \
  tests/unit/guide-app.menu-visibility.test.tsx
git commit -m "fix(guide): hide menu in production"
```

### Task 4: Tracer et vérifier la livraison

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Ajouter la traçabilité BR-13**

Dans la section `034 — Private Guide App`, ajouter :

```markdown
| AC-01-03/BR-13 | Le GuideApp privé et démo ne rend ni burger ni overlay en production, mais conserve le menu hors production | `src/features/guide-app/lib/guide-menu-visibility.ts`<br>`src/features/guide-app/components/GuideHeader.tsx`<br>`src/features/guide-app/components/GuideApp.tsx` | `tests/unit/guide-app.menu-visibility.test.tsx` | ✅ done |
```

- [ ] **Step 2: Exécuter les vérifications statiques**

Run:

```bash
npx eslint \
  src/features/guide-app/lib/guide-menu-visibility.ts \
  src/features/guide-app/components/GuideHeader.tsx \
  src/features/guide-app/components/GuideApp.tsx \
  tests/unit/guide-app.menu-visibility.test.tsx
npx tsc --noEmit
git diff --check
```

Expected: les trois commandes terminent avec le code 0.

- [ ] **Step 3: Commit la traçabilité**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace production guide menu visibility"
```
