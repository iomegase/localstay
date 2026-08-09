# Private Guide Equipment Labels Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les libellés visibles `Consignes` par `Équipements`, afficher le nombre de blocs pratiques et utiliser l'icône `HousePlug` sur les surfaces concernées.

**Architecture:** Conserver la vue interne `rules` et la route `/sejour/logement/consignes`, puis modifier les libellés et icônes de `GuideLodgingTabs` et `GuideLodgingViews`. Le compteur utilise `lodging.practicalCards.length` avec une pluralisation locale, sans modifier les données ni le routage.

**Tech Stack:** Next.js 16, TypeScript, React, Tailwind CSS, Jest, Testing Library.

---

### Task 1: Mettre à jour le contrat approuvé

**Files:**
- Modify: `specs/features/036-private-guide-lodging-home/spec.md`

- [ ] **Step 1: Aligner les critères et le comportement UI**

Modifier AC-01-03 afin qu'il exige les heures et le nombre d'équipements, sans
nombre de règles. Remplacer `Consignes` par `Équipements` dans AC-02-03 et
`Consignes du logement` par `Équipements` dans la liste UI.

Ajouter après BR-06 :

```markdown
- **BR-07**: La vue interne `rules` est présentée au Tourist sous le libellé
  `Équipements`. La carte du hub affiche le nombre de blocs pratiques avec la
  forme `1 équipement` au singulier et `N équipements` dans tous les autres
  cas. L'icône Lucide `HousePlug` identifie cette vue dans l'onglet, la carte du
  hub et l'en-tête. La route `/sejour/logement/consignes` reste inchangée.
```

- [ ] **Step 2: Ajouter BR-07 à la table des tests**

```markdown
| BR-07 | unit + integration |
```

- [ ] **Step 3: Vérifier et committer la spec seule**

Run:

```bash
git diff --check -- specs/features/036-private-guide-lodging-home/spec.md
git add specs/features/036-private-guide-lodging-home/spec.md
git commit -m "docs(guide): specify equipment labels"
```

Expected: aucune erreur de format et aucun fichier utilisateur inclus.

### Task 2: Écrire le test de régression rouge

**Files:**
- Create: `tests/unit/guide-app.equipment-labels.test.tsx`

- [ ] **Step 1: Exiger les nouveaux libellés et le compteur d'équipements**

Créer :

```tsx
/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { GuideLodgingTabs } from '@/features/guide-app/components/GuideLodgingTabs'
import { GuideLodgingViews } from '@/features/guide-app/components/GuideLodgingViews'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'

describe('036 BR-07 — libellés Équipements', () => {
  it('renames the rules tab without changing its internal view', () => {
    const onNavigate = jest.fn()
    render(<GuideLodgingTabs view="rules" onNavigate={onNavigate} />)

    const equipmentTab = screen.getByRole('button', { name: 'Équipements' })
    expect(equipmentTab).toHaveAttribute('aria-current', 'page')
    expect(equipmentTab.querySelector('.lucide-house-plug')).toBeInTheDocument()
    fireEvent.click(equipmentTab)
    expect(onNavigate).toHaveBeenCalledWith('rules')
  })

  it.each([
    [0, '0 équipements'],
    [1, '1 équipement'],
    [2, '2 équipements'],
  ])('shows %s practical cards as %s on the lodging hub', (count, label) => {
    const onNavigate = jest.fn()
    render(
      <GuideLodgingViews
        view="lodging"
        lodging={{
          ...demoLodging,
          houseRules: ['Règle 1', 'Règle 2', 'Règle 3'],
          practicalCards: Array.from({ length: count }, (_, index) => ({
            id: `equipment-${index}`,
            title: `Équipement ${index}`,
            description: 'Description',
            icon: 'info',
          })),
        }}
        onNavigate={onNavigate}
      />,
    )

    const equipmentLink = screen.getByRole('button', {
      name: new RegExp(`Équipements.*${label}`, 'i'),
    })
    expect(equipmentLink.querySelector('.lucide-house-plug')).toBeInTheDocument()
    expect(screen.queryByText('3 règles')).not.toBeInTheDocument()
    fireEvent.click(equipmentLink)
    expect(onNavigate).toHaveBeenCalledWith('rules')
  })

  it('keeps the canonical rules route unchanged', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/features/guide-app/components/PrivateGuidePage.tsx'),
      'utf8',
    )
    expect(source).toContain("rules: '/sejour/logement/consignes'")
  })

  it('uses HousePlug in the equipment page header', () => {
    const { container } = render(
      <GuideLodgingViews
        view="rules"
        lodging={{ ...demoLodging, houseRules: [], practicalCards: [] }}
        onNavigate={jest.fn()}
      />,
    )
    expect(container.querySelectorAll('.lucide-house-plug')).toHaveLength(2)
  })
})
```

- [ ] **Step 2: Vérifier RED**

Run:

```bash
npm test -- --runInBand tests/unit/guide-app.equipment-labels.test.tsx
```

Expected: FAIL car l'onglet et la carte utilisent encore `Consignes`, et le
compteur lit encore `houseRules.length`.

### Task 3: Implémenter les libellés, l'icône et le compteur

**Files:**
- Modify: `src/features/guide-app/components/GuideLodgingTabs.tsx`
- Modify: `src/features/guide-app/components/GuideLodgingViews.tsx`
- Test: `tests/unit/guide-app.equipment-labels.test.tsx`
- Modify: `tests/unit/guide-app.lodging-tabs.test.tsx`
- Modify: `tests/integration/private-guide-practical-info.AC-01-06.render.test.tsx`
- Modify: `tests/integration/private-guide-departure.AC-01-02-03.checklist.test.tsx`

- [ ] **Step 1: Renommer l'onglet visible**

Dans `GuideLodgingTabs.tsx`, importer `HousePlug` à la place de `ScrollText`,
puis utiliser :

```tsx
{ view: 'rules', label: 'Équipements', icon: HousePlug },
```

- [ ] **Step 2: Renommer la carte, remplacer son icône et calculer son compteur**

Dans `GuideLodgingViews.tsx`, importer `HousePlug` en conservant `ScrollText`
pour le règlement intérieur, puis ajouter :

```tsx
function equipmentCountLabel(count: number): string {
  return `${count} équipement${count === 1 ? '' : 's'}`
}
```

Puis utiliser :

```tsx
<GuideLink
  icon={HousePlug}
  title="Équipements"
  copy={equipmentCountLabel(lodging.practicalCards.length)}
  onClick={() => onNavigate('rules')}
/>
```

Conserver le titre local déjà présent :

```tsx
title="Les Équipements"
icon={HousePlug}
```

- [ ] **Step 3: Aligner les tests historiques visibles**

Dans `tests/unit/guide-app.lodging-tabs.test.tsx`, remplacer les deux attentes
`Consignes` par `Équipements` :

```tsx
for (const label of ['Accès', 'Infos', 'Équipements', 'Départ']) {
```

```tsx
expect(screen.getByRole('button', { name: 'Équipements' })).toHaveAttribute(
  'aria-current',
  'page',
)
```

Dans `tests/integration/private-guide-practical-info.AC-01-06.render.test.tsx`,
remplacer l'attente de heading par :

```tsx
screen.getByRole('heading', { name: 'Les Équipements' })
```

et le bouton du hub par :

```tsx
screen.getByRole('button', { name: /Équipements/i })
```

Dans `tests/integration/private-guide-departure.AC-01-02-03.checklist.test.tsx`,
renommer le test de la vue `rules` et remplacer son attente par :

```tsx
expect(screen.getByRole('heading', { name: 'Les Équipements' })).toBeInTheDocument()
```

- [ ] **Step 4: Vérifier GREEN et les régressions**

Run:

```bash
npm test -- --runInBand tests/unit/guide-app.equipment-labels.test.tsx tests/unit/guide-app.lodging-tabs.test.tsx tests/integration/private-guide-app.AC-01-03.navigation.test.tsx tests/integration/private-guide-practical-info.AC-01-06.render.test.tsx tests/integration/private-guide-departure.AC-01-02-03.checklist.test.tsx
```

Expected: toutes les suites passent après adaptation des attentes historiques
visibles `Consignes` vers `Équipements`, sans changer les assertions de route
ou de vue `rules`.

- [ ] **Step 5: Vérifier le code**

Run:

```bash
npx eslint src/features/guide-app/components/GuideLodgingTabs.tsx src/features/guide-app/components/GuideLodgingViews.tsx tests/unit/guide-app.equipment-labels.test.tsx
npx tsc --noEmit
```

Expected: aucune erreur.

### Task 4: Mettre à jour la traçabilité

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Ajouter BR-07 à la section 036**

```markdown
| BR-07 | La vue `rules` conserve sa route mais utilise les libellés Équipements et compte les blocs pratiques | `src/features/guide-app/components/GuideLodgingTabs.tsx`<br>`src/features/guide-app/components/GuideLodgingViews.tsx`<br>`src/features/guide-app/components/PrivateGuidePage.tsx` | `tests/unit/guide-app.equipment-labels.test.tsx` | ✅ done |
```

- [ ] **Step 2: Vérifier le chantier complet**

Run:

```bash
git diff --check
npm test -- --runInBand tests/unit/guide-app.equipment-labels.test.tsx tests/unit/guide-app.lodging-tabs.test.tsx tests/integration/private-guide-app.AC-01-03.navigation.test.tsx tests/integration/private-guide-practical-info.AC-01-06.render.test.tsx tests/integration/private-guide-departure.AC-01-02-03.checklist.test.tsx
npx eslint src/features/guide-app/components/GuideLodgingTabs.tsx src/features/guide-app/components/GuideLodgingViews.tsx tests/unit/guide-app.equipment-labels.test.tsx
npx tsc --noEmit
```

Expected: aucun échec sur le périmètre et aucune modification de la route
`/sejour/logement/consignes`.
