# Private Guide Rules Markdown Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre le Markdown complet dans la description de chaque bloc pratique affiché sur la page privée `Consignes du logement`.

**Architecture:** Réutiliser `GuideDarkMarkdown`, déjà sécurisé et stylé pour les cartes bleu nuit, dans les quatre variantes de cartes pratiques. Remplacer les conteneurs `<p>` par des `<div>` afin d'accepter le HTML de bloc produit pour les listes et headings, sans toucher aux données ni aux actions.

**Tech Stack:** Next.js 16, TypeScript, React, Tailwind CSS, react-markdown, Jest, Testing Library.

---

### Task 1: Étendre le contrat approuvé

**Files:**
- Modify: `specs/features/012-guide-customization/spec.md`

- [ ] **Step 1: Ajouter la règle métier BR-23**

Ajouter après BR-22 :

```markdown
- **BR-23**: Dans la page privée `Consignes du logement`, la description de
  chaque bloc pratique est rendue avec le moteur Markdown sécurisé du guide,
  pour toutes les variantes de carte (standard, média, téléphone et
  recyclage). Le titre reste du texte simple et le HTML brut est ignoré.
```

- [ ] **Step 2: Ajouter le mapping de test**

Ajouter à la table des critères :

```markdown
| BR-23 | Markdown rendu dans toutes les variantes de blocs pratiques privés | unit |
```

- [ ] **Step 3: Vérifier et committer le contrat**

Run:

```bash
git diff --check -- specs/features/012-guide-customization/spec.md
git add specs/features/012-guide-customization/spec.md
git commit -m "docs(guide): specify rules card markdown"
```

Expected: aucune erreur de format et un commit limité à la spec 012.

### Task 2: Écrire le test de régression rouge

**Files:**
- Create: `tests/unit/guide-app.practical-card-markdown.test.tsx`

- [ ] **Step 1: Ajouter un test qui exige le renderer Markdown sur les quatre variantes**

Créer le fichier suivant :

```tsx
/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { GuideLodgingViews } from '@/features/guide-app/components/GuideLodgingViews'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'

jest.mock('@/features/guide-app/components/GuideDarkMarkdown', () => ({
  GuideDarkMarkdown: ({ source }: { source: string }) => (
    <div data-testid="guide-dark-markdown">{source}</div>
  ),
}))

describe('BR-23 — Markdown des blocs pratiques privés', () => {
  it('uses the secured Markdown renderer for every practical-card variant', () => {
    const descriptions = [
      'Un **sèche-cheveux** est disponible.',
      '- Télévision\n- Chromecast',
      'Appelez *si nécessaire*.',
      'Triez les **emballages**.',
    ]

    render(
      <GuideLodgingViews
        view="rules"
        lodging={{
          ...demoLodging,
          houseRules: [],
          practicalCards: [
            { id: 'standard', title: 'Salle de bain', description: descriptions[0], icon: 'bath' },
            { id: 'media', title: 'Télévision', description: descriptions[1], icon: 'tv', photoUrl: '/tv.jpg' },
            { id: 'phone', title: 'Assistance', description: descriptions[2], icon: 'phone', phone: '0450000000' },
            { id: 'recycle', title: 'Recyclage', description: descriptions[3], icon: 'recycle' },
          ],
        }}
        onNavigate={jest.fn()}
      />,
    )

    expect(
      screen.getAllByTestId('guide-dark-markdown').map(node => node.textContent),
    ).toEqual(descriptions)
  })
})
```

- [ ] **Step 2: Exécuter le test et vérifier l'échec attendu**

Run:

```bash
npm test -- --runInBand tests/unit/guide-app.practical-card-markdown.test.tsx
```

Expected: FAIL, car aucune des quatre descriptions n'est encore rendue par `GuideDarkMarkdown` dans la vue `rules`.

- [ ] **Step 3: Committer le test rouge**

```bash
git add tests/unit/guide-app.practical-card-markdown.test.tsx
git commit -m "test(guide): require Markdown in rules cards"
```

### Task 3: Brancher le moteur Markdown existant

**Files:**
- Modify: `src/features/guide-app/components/GuideLodgingViews.tsx`
- Modify: `src/features/guide-app/components/PracticalMediaCard.tsx`
- Test: `tests/unit/guide-app.practical-card-markdown.test.tsx`

- [ ] **Step 1: Modifier les cartes standard, téléphone et recyclage**

Dans `GuideLodgingViews.tsx`, conserver `inlineMarkdown` pour les lignes du règlement intérieur, importer `GuideDarkMarkdown`, puis remplacer la description des cartes `WasteCard`, `ContactCard` et `InfoCard` par :

```tsx
<div className="mt-1">
  <GuideDarkMarkdown source={description} />
</div>
```

- [ ] **Step 2: Modifier la carte média**

Dans `PracticalMediaCard.tsx`, remplacer l'import de `inlineMarkdown` par :

```tsx
import { GuideDarkMarkdown } from '@/features/guide-app/components/GuideDarkMarkdown'
```

Puis remplacer son paragraphe de description par :

```tsx
<div className="mt-1">
  <GuideDarkMarkdown source={description} />
</div>
```

- [ ] **Step 3: Exécuter le test ciblé et vérifier GREEN**

Run:

```bash
npm test -- --runInBand tests/unit/guide-app.practical-card-markdown.test.tsx
```

Expected: PASS avec quatre instances du renderer sécurisé.

- [ ] **Step 4: Exécuter les régressions de la page**

Run:

```bash
npm test -- --runInBand tests/integration/private-guide-practical-info.AC-01-06.render.test.tsx tests/unit/guide-app.arrival-instruction-card.test.tsx
```

Expected: deux suites vertes ; les cartes, médias et consignes d'arrivée restent fonctionnels.

- [ ] **Step 5: Vérifier ESLint et TypeScript**

Run:

```bash
npx eslint src/features/guide-app/components/GuideLodgingViews.tsx src/features/guide-app/components/PracticalMediaCard.tsx tests/unit/guide-app.practical-card-markdown.test.tsx
npx tsc --noEmit
```

Expected: aucune erreur.

- [ ] **Step 6: Committer le correctif**

```bash
git add src/features/guide-app/components/GuideLodgingViews.tsx src/features/guide-app/components/PracticalMediaCard.tsx
git commit -m "fix(guide): render Markdown in rules cards"
```

### Task 4: Mettre à jour la traçabilité et vérifier le chantier

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Ajouter BR-23 à la section 012**

```markdown
| BR-23 | Les descriptions de tous les blocs pratiques de la page privée Consignes utilisent le renderer Markdown sécurisé | `src/features/guide-app/components/GuideLodgingViews.tsx`<br>`src/features/guide-app/components/PracticalMediaCard.tsx`<br>`src/features/guide-app/components/GuideDarkMarkdown.tsx` | `tests/unit/guide-app.practical-card-markdown.test.tsx` | ✅ done |
```

- [ ] **Step 2: Lancer la vérification finale**

Run:

```bash
git diff --check
npm test -- --runInBand tests/unit/guide-app.practical-card-markdown.test.tsx tests/integration/private-guide-practical-info.AC-01-06.render.test.tsx tests/unit/guide-app.arrival-instruction-card.test.tsx
npx eslint src/features/guide-app/components/GuideLodgingViews.tsx src/features/guide-app/components/PracticalMediaCard.tsx tests/unit/guide-app.practical-card-markdown.test.tsx
npx tsc --noEmit
```

Expected: trois suites vertes, aucune erreur ESLint, TypeScript ou whitespace.

- [ ] **Step 3: Committer la traçabilité**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace private rules Markdown"
```
