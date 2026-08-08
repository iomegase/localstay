# Practical Block Amenity Icons Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter cinq icônes d'équipements au sélecteur des blocs pratiques et garantir leur validation et leur rendu via le catalogue central.

**Architecture:** Étendre uniquement `PRACTICAL_BLOCK_ICONS`, dont dérivent déjà le sélecteur, la liste de validation API et le rendu Lucide public. Protéger les nouveaux couples slug/libellé et l'interaction de sélection avec des tests unitaires ciblés.

**Tech Stack:** Next.js 16, TypeScript, React, Lucide React, Jest, Testing Library.

---

### Task 1: Étendre le contrat approuvé

**Files:**
- Modify: `specs/features/012-guide-customization/spec.md`

- [ ] **Step 1: Ajouter BR-22**

Ajouter après BR-21 :

```markdown
- **BR-22**: Le catalogue des icônes de blocs pratiques propose aussi `Piscine` (`waves-ladder`), `Jacuzzi` (`bubbles`), `Climatisation` (`air-vent`), `Skis` (`mountain-snow`) et `Terrasse` (`umbrella`). Ces slugs Lucide sont acceptés par la validation API et rendus dans le dashboard Owner comme dans le guide privé.
```

- [ ] **Step 2: Tracer le type de test dans la table d'acceptation**

Ajouter :

```markdown
| BR-22 | Catalogue d'icônes d'équipements disponible et sélectionnable | unit |
```

- [ ] **Step 3: Committer le contrat**

```bash
git add specs/features/012-guide-customization/spec.md
git commit -m "docs(guide): specify amenity block icons"
```

### Task 2: Écrire les tests de régression rouges

**Files:**
- Modify: `tests/unit/guide-customization.practical-block-icons.test.ts`
- Modify: `tests/unit/guide-customization.practical-blocks-editor.test.tsx`

- [ ] **Step 1: Tester les cinq entrées du catalogue**

Ajouter dans le premier `describe` :

```typescript
it('exposes the approved amenity icons', () => {
  expect(PRACTICAL_BLOCK_ICONS).toEqual(
    expect.arrayContaining([
      { slug: 'waves-ladder', label: 'Piscine' },
      { slug: 'bubbles', label: 'Jacuzzi' },
      { slug: 'air-vent', label: 'Climatisation' },
      { slug: 'mountain-snow', label: 'Skis' },
      { slug: 'umbrella', label: 'Terrasse' },
    ]),
  )
})
```

- [ ] **Step 2: Tester le rendu et la sélection dans l'éditeur**

Ajouter dans le second `describe` :

```typescript
it('offers the approved amenity icons and selects skis', async () => {
  const user = userEvent.setup()
  render(<Harness />)

  await user.click(screen.getByRole('button', { name: /ajouter un bloc/i }))

  for (const label of ['Piscine', 'Jacuzzi', 'Climatisation', 'Skis', 'Terrasse']) {
    expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
  }

  await user.click(screen.getByRole('button', { name: 'Skis' }))
  expect(screen.getByTestId('state').textContent).toContain('"icon":"mountain-snow"')
})
```

- [ ] **Step 3: Vérifier que les tests échouent**

Run:

```bash
npm test -- --runInBand tests/unit/guide-customization.practical-block-icons.test.ts tests/unit/guide-customization.practical-blocks-editor.test.tsx
```

Expected: FAIL car les cinq entrées ne sont pas encore dans le catalogue.

- [ ] **Step 4: Committer les tests rouges**

```bash
git add tests/unit/guide-customization.practical-block-icons.test.ts tests/unit/guide-customization.practical-blocks-editor.test.tsx
git commit -m "test(guide): require amenity block icons"
```

### Task 3: Étendre le catalogue central

**Files:**
- Modify: `src/features/guide-customization/lib/practical-block-icons.ts`

- [ ] **Step 1: Ajouter les cinq icônes**

Ajouter à la fin de `PRACTICAL_BLOCK_ICONS` :

```typescript
  { slug: 'waves-ladder', label: 'Piscine' },
  { slug: 'bubbles', label: 'Jacuzzi' },
  { slug: 'air-vent', label: 'Climatisation' },
  { slug: 'mountain-snow', label: 'Skis' },
  { slug: 'umbrella', label: 'Terrasse' },
```

- [ ] **Step 2: Vérifier les tests ciblés**

Run:

```bash
npm test -- --runInBand tests/unit/guide-customization.practical-block-icons.test.ts tests/unit/guide-customization.practical-blocks-editor.test.tsx tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts
```

Expected: trois suites vertes.

- [ ] **Step 3: Vérifier TypeScript et ESLint sur les fichiers touchés**

Run:

```bash
npx eslint src/features/guide-customization/lib/practical-block-icons.ts tests/unit/guide-customization.practical-block-icons.test.ts tests/unit/guide-customization.practical-blocks-editor.test.tsx
npx tsc --noEmit
```

Expected: aucune erreur.

- [ ] **Step 4: Committer l'implémentation**

```bash
git add src/features/guide-customization/lib/practical-block-icons.ts
git commit -m "feat(guide): add practical amenity icons"
```

### Task 4: Mettre à jour la traçabilité

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Ajouter la ligne BR-22 dans la section 012**

```markdown
| BR-22 | Le catalogue des blocs pratiques propose piscine, jacuzzi, climatisation, skis et terrasse avec des slugs Lucide validés | `src/features/guide-customization/lib/practical-block-icons.ts`<br>`src/features/guide-customization/components/PracticalBlocksEditor.tsx`<br>`src/app/api/dashboard/lodgings/[id]/customization/route.ts` | `tests/unit/guide-customization.practical-block-icons.test.ts`<br>`tests/unit/guide-customization.practical-blocks-editor.test.tsx`<br>`tests/contract/guide-customization.AC-01-01-BR-07.api.test.ts` | ✅ done |
```

- [ ] **Step 2: Vérifier le diff final**

```bash
git diff --check -- specs/features/012-guide-customization/spec.md src/features/guide-customization/lib/practical-block-icons.ts tests/unit/guide-customization.practical-block-icons.test.ts tests/unit/guide-customization.practical-blocks-editor.test.tsx docs/traceability-matrix.md
git status --short
```

Expected: seule la modification locale antérieure de `MarketingHome.tsx` reste hors des commits du chantier.

- [ ] **Step 3: Committer la traçabilité**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace practical amenity icons"
```
