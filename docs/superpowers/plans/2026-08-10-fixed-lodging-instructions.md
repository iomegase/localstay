# Fixed Lodging Instructions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les consignes de sortie et le règlement personnalisables par deux listes MyStay fixes et partagées.

**Architecture:** Un module `fixed-lodging-content.ts` devient la source immuable. L'adaptateur privé, la démo et la page historique le consomment ; le formulaire Owner masque les anciens champs, tandis que les colonnes Supabase restent conservées mais ignorées à l'affichage.

**Tech Stack:** Next.js 16, React, TypeScript strict, Prisma/Supabase existants, Jest, Testing Library.

---

### Task 1: Amender les specs approuvées

**Files:**
- Modify: `specs/features/012-guide-customization/spec.md`
- Modify: `specs/features/036-private-guide-lodging-home/spec.md`
- Modify: `specs/features/039-private-guide-departure-frame/spec.md`

- [ ] **Step 1: Modifier la spec 012**

Ajouter une règle précisant que `checkout_instructions` et `house_rules`
restent en base pour compatibilité, ne sont plus éditables et ne pilotent plus
l'affichage. Retirer ces deux champs des comportements UI personnalisables.

- [ ] **Step 2: Modifier la spec 036**

Ajouter une règle contenant exactement les trois phrases fixes du règlement,
dans l'ordre validé, et préciser que les anciennes valeurs `house_rules` sont
ignorées dans le guide privé et la démo.

- [ ] **Step 3: Modifier la spec 039**

Mettre à jour AC-01-02, BR-04 et Data Model pour imposer les neuf consignes
fixes, dans l'ordre validé, sans lecture de `checkout_instructions`.

- [ ] **Step 4: Vérifier et commit**

```bash
rg -n "checkout_instructions|house_rules|fixe" \
  specs/features/012-guide-customization/spec.md \
  specs/features/036-private-guide-lodging-home/spec.md \
  specs/features/039-private-guide-departure-frame/spec.md
git diff --check
git add specs/features/012-guide-customization/spec.md specs/features/036-private-guide-lodging-home/spec.md specs/features/039-private-guide-departure-frame/spec.md
git commit -m "docs(guide): specify fixed lodging instructions"
```

Expected: les trois specs restent `status: approved`, sans question ouverte.

### Task 2: Écrire les tests rouges

**Files:**
- Create: `tests/unit/guide-app.fixed-lodging-content.test.ts`
- Modify: `tests/unit/private-guide-app.AC-01-05.data.test.ts`
- Modify: `tests/unit/guide-customization.customization-form-blocks.test.tsx`
- Modify: `tests/integration/le-logement.practical-blocks.test.tsx`

- [ ] **Step 1: Tester les textes exacts**

Créer le test suivant :

```ts
import {
  FIXED_DEPARTURE_INSTRUCTIONS,
  FIXED_HOUSE_RULES,
} from '@/features/guide-app/lib/fixed-lodging-content'

describe('fixed lodging content', () => {
  it('exposes the nine departure instructions', () => {
    expect(FIXED_DEPARTURE_INSTRUCTIONS).toEqual([
      'Déposer vos déchets au point de recyclage indiqué ci-dessous.',
      'Faire la vaisselle ou lancer le lave-vaisselle avant votre départ.',
      'Rassembler le linge de toilette utilisé dans la salle de bain.',
      'Laisser les draps en place sur les lits.',
      "Remettre les meubles, chaises et objets déplacés à leur emplacement d'origine.",
      'Fermer les fenêtres et les Velux.',
      'Éteindre les lumières ainsi que les appareils électriques inutiles.',
      'Ne pas éteindre le chauffage.',
      "Vérifier que vous n'avez rien oublié dans le logement.",
    ])
  })

  it('exposes the three house rules', () => {
    expect(FIXED_HOUSE_RULES).toEqual([
      'Merci de respecter le logement, son mobilier ainsi que le voisinage pendant toute la durée de votre séjour.',
      'Les fêtes et nuisances sonores, notamment entre 22 h et 8 h, ne sont pas autorisées.',
      "Merci d'utiliser les équipements conformément à leur destination et de nous signaler rapidement tout incident ou dommage.",
    ])
  })
})
```

- [ ] **Step 2: Tester l'indépendance à Supabase**

Dans le test de `getPrivateGuideData`, fournir :

```ts
checkout_instructions: 'Ancienne consigne personnalisée',
house_rules: 'Ancienne règle personnalisée',
```

Puis attendre `FIXED_DEPARTURE_INSTRUCTIONS` et `FIXED_HOUSE_RULES` dans le
résultat, jamais les anciennes chaînes.

- [ ] **Step 3: Tester le formulaire Owner**

Ajouter un test qui rend `CustomizationForm` avec d'anciennes valeurs et
vérifie :

```tsx
expect(
  screen.queryByRole('textbox', { name: 'Consignes de départ' }),
).not.toBeInTheDocument()
expect(
  screen.queryByRole('textbox', { name: 'Règlement intérieur' }),
).not.toBeInTheDocument()
```

- [ ] **Step 4: Adapter le test de la page historique**

Faire attendre la première et la dernière consigne fixe même lorsque la valeur
historique `checkout_instructions` vaut `null`.

- [ ] **Step 5: Vérifier RED**

```bash
npm test -- --runInBand \
  tests/unit/guide-app.fixed-lodging-content.test.ts \
  tests/unit/private-guide-app.AC-01-05.data.test.ts \
  tests/unit/guide-customization.customization-form-blocks.test.tsx \
  tests/integration/le-logement.practical-blocks.test.tsx
```

Expected: FAIL car le module fixe n'existe pas, l'adaptateur lit encore
Supabase et les champs Owner sont encore visibles.

### Task 3: Implémenter la source fixe

**Files:**
- Create: `src/features/guide-app/lib/fixed-lodging-content.ts`
- Modify: `src/features/guide-app/queries/private-guide-data.ts`
- Modify: `src/features/guide-demo/demo-guide-data.ts`
- Modify: `src/app/(public)/le-logement/page.tsx`
- Modify: `src/features/guide-customization/components/CustomizationForm.tsx`
- Test: les quatre fichiers de Task 2

- [ ] **Step 1: Créer les constantes**

```ts
export const FIXED_DEPARTURE_INSTRUCTIONS = [
  'Déposer vos déchets au point de recyclage indiqué ci-dessous.',
  'Faire la vaisselle ou lancer le lave-vaisselle avant votre départ.',
  'Rassembler le linge de toilette utilisé dans la salle de bain.',
  'Laisser les draps en place sur les lits.',
  "Remettre les meubles, chaises et objets déplacés à leur emplacement d'origine.",
  'Fermer les fenêtres et les Velux.',
  'Éteindre les lumières ainsi que les appareils électriques inutiles.',
  'Ne pas éteindre le chauffage.',
  "Vérifier que vous n'avez rien oublié dans le logement.",
] as const

export const FIXED_HOUSE_RULES = [
  'Merci de respecter le logement, son mobilier ainsi que le voisinage pendant toute la durée de votre séjour.',
  'Les fêtes et nuisances sonores, notamment entre 22 h et 8 h, ne sont pas autorisées.',
  "Merci d'utiliser les équipements conformément à leur destination et de nous signaler rapidement tout incident ou dommage.",
] as const
```

- [ ] **Step 2: Brancher le guide privé**

Importer les deux constantes dans `private-guide-data.ts` et utiliser :

```ts
departureInstructions: [...FIXED_DEPARTURE_INSTRUCTIONS],
houseRules: [...FIXED_HOUSE_RULES],
```

Supprimer `splitContent` uniquement s'il ne possède plus aucun appel.

- [ ] **Step 3: Brancher la démo**

Dans `demo-guide-data.ts`, remplacer les deux tableaux locaux par :

```ts
departureInstructions: [...FIXED_DEPARTURE_INSTRUCTIONS],
houseRules: [...FIXED_HOUSE_RULES],
```

- [ ] **Step 4: Brancher la page historique**

Importer `FIXED_DEPARTURE_INSTRUCTIONS`, inclure sa longueur dans
`hasContent`, définir `checklistItems = [...FIXED_DEPARTURE_INSTRUCTIONS]`
et toujours rendre `DepartureChecklist`. Supprimer `extractChecklistItems`
devenu inutilisé.

- [ ] **Step 5: Retirer les deux champs Owner**

Supprimer de `PRACTICAL_SECTIONS` les objets `checkout_instructions` et
`house_rules`. Conserver leurs types et valeurs de payload afin qu'une
sauvegarde d'un autre champ n'efface pas les anciennes données.

- [ ] **Step 6: Vérifier GREEN**

```bash
npm test -- --runInBand \
  tests/unit/guide-app.fixed-lodging-content.test.ts \
  tests/unit/private-guide-app.AC-01-05.data.test.ts \
  tests/unit/guide-customization.customization-form-blocks.test.tsx \
  tests/integration/le-logement.practical-blocks.test.tsx \
  tests/integration/private-guide-departure.AC-01-02-03.checklist.test.tsx \
  tests/integration/private-guide-practical-info.AC-01-06.render.test.tsx
```

Expected: 6 suites PASS.

- [ ] **Step 7: Commit**

```bash
git add src/features/guide-app/lib/fixed-lodging-content.ts src/features/guide-app/queries/private-guide-data.ts src/features/guide-demo/demo-guide-data.ts src/app/'(public)'/le-logement/page.tsx src/features/guide-customization/components/CustomizationForm.tsx tests/unit/guide-app.fixed-lodging-content.test.ts tests/unit/private-guide-app.AC-01-05.data.test.ts tests/unit/guide-customization.customization-form-blocks.test.tsx tests/integration/le-logement.practical-blocks.test.tsx
git commit -m "fix(guide): use fixed lodging instructions"
```

### Task 4: Tracer et vérifier

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Ajouter la traçabilité**

Ajouter aux sections 012, 036 et 039 les liens vers le module fixe, l'adaptateur,
la démo, le formulaire, la page historique et les quatre tests de Task 2.

- [ ] **Step 2: Vérifier le lot**

```bash
npx eslint src/features/guide-app/lib/fixed-lodging-content.ts src/features/guide-app/queries/private-guide-data.ts src/features/guide-demo/demo-guide-data.ts src/app/'(public)'/le-logement/page.tsx src/features/guide-customization/components/CustomizationForm.tsx tests/unit/guide-app.fixed-lodging-content.test.ts tests/unit/private-guide-app.AC-01-05.data.test.ts tests/unit/guide-customization.customization-form-blocks.test.tsx tests/integration/le-logement.practical-blocks.test.tsx
npx tsc --noEmit
git diff --check
```

Expected: trois codes de sortie à 0.

- [ ] **Step 3: Commit la traçabilité**

```bash
git add docs/traceability-matrix.md
git commit -m "docs: trace fixed lodging instructions"
```

