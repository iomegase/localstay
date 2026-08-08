# Arrival Instruction Card Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Placer le numéro à gauche du titre de chaque consigne d'arrivée, puis rendre le contenu et les médias pleine largeur sous cette ligne.

**Architecture:** Extraire le heading Markdown initial dans une fonction pure locale à `ArrivalInstructionCard`. Rendre un en-tête dédié, puis le Markdown restant et les médias dans deux blocs sans retrait gauche, sans modifier les données persistées ni les lightboxes.

**Tech Stack:** Next.js 16, TypeScript, React, Tailwind CSS, React Markdown, Jest, Testing Library.

---

### Task 1: Étendre le contrat d'arrivée approuvé

**Files:**
- Modify: `specs/features/037-private-guide-arrival/spec.md`

- [ ] **Step 1: Ajouter BR-07**

Ajouter après BR-06 :

```markdown
- **BR-07**: Chaque consigne d'arrivée utilise son premier heading Markdown comme titre. La pastille numérotée est placée à gauche de ce titre ; le contenu Markdown restant et les médias commencent sur les lignes suivantes au bord intérieur gauche de la carte, sans retrait sous le titre. Une consigne historique sans heading utilise `Instruction N` comme titre de repli.
```

- [ ] **Step 2: Ajouter le mapping de test**

```markdown
| BR-07 | unit |
```

- [ ] **Step 3: Committer la spec**

```bash
git add specs/features/037-private-guide-arrival/spec.md
git commit -m "docs(arrival): specify numbered card layout"
```

### Task 2: Écrire le test de disposition rouge

**Files:**
- Modify: `tests/unit/guide-app.arrival-instruction-card.test.tsx`

- [ ] **Step 1: Utiliser une consigne avec heading et tester la structure**

Remplacer le texte de la fixture par :

```typescript
text: '# Accès au garage\n\nOuvrez le portail avec le badge',
```

Ajouter :

```typescript
it('places the number beside the title and the content below at full width', () => {
  render(<ArrivalInstructionCard index={0} instruction={instruction} />)

  const header = screen.getByTestId('arrival-instruction-header')
  expect(within(header).getByText('1')).toBeInTheDocument()
  expect(within(header).getByRole('heading', { name: 'Accès au garage' })).toBeInTheDocument()
  expect(within(header).queryByText('Ouvrez le portail avec le badge')).not.toBeInTheDocument()

  const content = screen.getByTestId('arrival-instruction-content')
  expect(within(content).getByText('Ouvrez le portail avec le badge')).toBeInTheDocument()
  expect(content).not.toHaveClass('pl-10')

  expect(screen.getByTestId('arrival-instruction-media')).not.toHaveClass('pl-10')
})
```

- [ ] **Step 2: Tester les headings acceptés et le repli**

Ajouter :

```typescript
it.each(['#', '##', '###'])('extracts a level %s heading as the card title', marker => {
  render(
    <ArrivalInstructionCard
      index={1}
      instruction={{ text: `${marker} Parking\n\nGarez-vous place 46`, videoUrl: null, photos: [] }}
    />,
  )
  expect(screen.getByRole('heading', { name: 'Parking' })).toBeInTheDocument()
  expect(screen.getByText('Garez-vous place 46')).toBeInTheDocument()
})

it('uses a safe fallback title for a legacy instruction without heading', () => {
  render(
    <ArrivalInstructionCard
      index={2}
      instruction={{ text: 'Sonnez à l’interphone', videoUrl: null, photos: [] }}
    />,
  )
  expect(screen.getByRole('heading', { name: 'Instruction 3' })).toBeInTheDocument()
  expect(screen.getByText('Sonnez à l’interphone')).toBeInTheDocument()
})
```

- [ ] **Step 3: Vérifier RED**

Run:

```bash
npm test -- --runInBand tests/unit/guide-app.arrival-instruction-card.test.tsx
```

Expected: FAIL car l'en-tête, le contenu et les médias dédiés n'existent pas.

- [ ] **Step 4: Committer les tests rouges**

```bash
git add tests/unit/guide-app.arrival-instruction-card.test.tsx
git commit -m "test(arrival): require full-width instruction layout"
```

### Task 3: Implémenter l'extraction et la nouvelle structure

**Files:**
- Modify: `src/features/guide-app/components/ArrivalInstructionCard.tsx`

- [ ] **Step 1: Ajouter l'extracteur local**

```typescript
function splitInstructionText(source: string, index: number): { title: string; body: string } {
  const normalized = source.replace(/^(#{1,3})(?=\S)/, '$1 ')
  const heading = normalized.match(/^\s*#{1,3}\s+(.+?)\s*(?:\r?\n|$)/)

  if (!heading) {
    return { title: `Instruction ${index + 1}`, body: source }
  }

  return {
    title: heading[1].replace(/\s+#+\s*$/, '').trim(),
    body: normalized.slice(heading[0].length).trimStart(),
  }
}
```

- [ ] **Step 2: Remplacer la structure de contenu**

Dans le composant, calculer :

```typescript
const { title, body } = splitInstructionText(instruction.text, index)
```

Puis rendre :

```tsx
<div data-testid="arrival-instruction-header" className="flex items-center gap-3">
  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-bold text-white">
    {index + 1}
  </span>
  <h3 className="min-w-0 text-sm font-bold uppercase tracking-[0.14em] text-white">
    {title}
  </h3>
</div>

{body && (
  <div data-testid="arrival-instruction-content" className="mt-3 min-w-0">
    <GuideDarkMarkdown source={body} />
  </div>
)}
```

Ajouter `data-testid="arrival-instruction-media"` au conteneur des vignettes et remplacer ses classes par :

```text
mt-3 flex flex-wrap gap-2
```

- [ ] **Step 3: Vérifier GREEN et les régressions arrivée**

Run:

```bash
npm test -- --runInBand tests/unit/guide-app.arrival-instruction-card.test.tsx tests/integration/private-guide-arrival.AC-01-01-04.page.test.tsx tests/integration/private-guide-app.AC-01-03.navigation.test.tsx
```

Expected: trois suites vertes.

- [ ] **Step 4: Vérifier ESLint et TypeScript**

```bash
npx eslint src/features/guide-app/components/ArrivalInstructionCard.tsx tests/unit/guide-app.arrival-instruction-card.test.tsx
npx tsc --noEmit
```

Expected: aucune erreur.

- [ ] **Step 5: Committer l'implémentation**

```bash
git add src/features/guide-app/components/ArrivalInstructionCard.tsx
git commit -m "feat(arrival): align instruction content full width"
```

### Task 4: Mettre à jour la traçabilité

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Ajouter BR-07 à la section 037**

```markdown
| BR-07 | Chaque carte d'arrivée place le numéro à gauche du titre et le contenu avec ses médias pleine largeur sur les lignes suivantes | `src/features/guide-app/components/ArrivalInstructionCard.tsx` | `tests/unit/guide-app.arrival-instruction-card.test.tsx` | ✅ done |
```

- [ ] **Step 2: Vérifier le diff du chantier**

```bash
git diff --check -- specs/features/037-private-guide-arrival/spec.md src/features/guide-app/components/ArrivalInstructionCard.tsx tests/unit/guide-app.arrival-instruction-card.test.tsx docs/traceability-matrix.md
git status --short
```

- [ ] **Step 3: Committer la traçabilité**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace arrival instruction layout"
```
