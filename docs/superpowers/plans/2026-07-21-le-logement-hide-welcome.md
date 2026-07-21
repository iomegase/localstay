# Hide `/le-logement` Welcome Message Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Masquer tous les messages de bienvenue sur `/le-logement` sans modifier leur stockage ni leurs autres usages.

**Architecture:** La requête Prisma et le modèle restent inchangés. Seul le JSX de `/le-logement` retire la salutation du hero et la carte du message Owner, tout en conservant la section `#bienvenue` et ses trois raccourcis.

**Tech Stack:** Next.js 16, React 19, TypeScript strict, Tailwind CSS, Jest et Testing Library.

---

### Task 1: Masquer le message dans le rendu public

**Files:**
- Modify: `tests/integration/le-logement.practical-blocks.test.tsx`
- Modify: `src/app/(public)/le-logement/page.tsx`
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Écrire le test d'intégration en échec**

Dans le scénario riche qui fournit `welcome_message: 'Bienvenue chez vous ♡'`, remplacer l'assertion de présence du bloc par :

```tsx
expect(screen.queryByText('Bienvenue chez vous ♡')).not.toBeInTheDocument()
expect(screen.queryByTestId('lodging-welcome-message')).not.toBeInTheDocument()
expect(screen.getByRole('heading', { name: 'Votre séjour commence ici' })).toBeInTheDocument()
expect(screen.getByRole('link', { name: /Préparer mon arrivée/i })).toBeInTheDocument()
expect(screen.getByRole('link', { name: /Découvrir le logement/i })).toBeInTheDocument()
expect(screen.getByRole('link', { name: /Anticiper mon départ/i })).toBeInTheDocument()
```

- [ ] **Step 2: Vérifier RED**

Run: `npm test -- tests/integration/le-logement.practical-blocks.test.tsx --runInBand`  
Expected: FAIL parce que la salutation et le message Owner sont encore rendus.

- [ ] **Step 3: Retirer uniquement le JSX concerné**

Dans `src/app/(public)/le-logement/page.tsx` :

- supprimer le `<p>` statique `Bienvenue chez vous ♡` du hero ;
- supprimer la carte de bienvenue et son rendu conditionnel de `customization.welcome_message` ;
- conserver le `GuideSection` `id="bienvenue"`, son titre et le bloc des trois `SectionShortcut` ;
- conserver `welcome_message: true` dans le `select` Prisma.

La section prend cette forme :

```tsx
<GuideSection id="bienvenue" number="01" eyebrow="Bienvenue" title="Votre séjour commence ici">
  <div className="grid gap-2">
    <SectionShortcut href="#infos-pratiques" label="Préparer mon arrivée" detail="Adresse, parking et connexion" color="amber" />
    <SectionShortcut href="#bon-a-savoir" label="Découvrir le logement" detail="Équipements et conseils" color="green" />
    <SectionShortcut href="#depart" label="Anticiper mon départ" detail="Consignes et tri" color="pink" />
  </div>
</GuideSection>
```

- [ ] **Step 4: Vérifier GREEN et les régressions**

Run: `npm test -- tests/integration/le-logement.practical-blocks.test.tsx tests/unit/le-logement.interactions.test.tsx tests/unit/public-menu.lodging-guide-menu.test.tsx tests/unit/public-layout.mockup-menu.test.tsx --runInBand`  
Expected: 4 suites PASS.

Run: `npx tsc --noEmit`  
Expected: exit 0.

- [ ] **Step 5: Mettre à jour la traçabilité**

Ajouter `BR-20` à la ligne de `/le-logement` dans `docs/traceability-matrix.md` et préciser que le message reste conservé côté données mais n'est plus rendu sur cette route.

- [ ] **Step 6: Commit**

```bash
git add src/app/'(public)'/le-logement/page.tsx \
  tests/integration/le-logement.practical-blocks.test.tsx \
  docs/traceability-matrix.md
git commit -m "fix: hide welcome message on le-logement"
```
