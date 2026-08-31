# Auth Pages Noindex Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre les quatre routes d'authentification existantes explicitement non indexables grâce à leur layout commun.

**Architecture:** Le layout App Router `src/app/auth/layout.tsx` est le point d'héritage unique des quatre pages. Il réutilise `privatePageMetadata`, déjà employé par les surfaces privées, tandis que `robots.txt` reste inchangé pour permettre aux moteurs de lire le `noindex`.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Jest, React, metadata Next.js.

---

### Task 1: Contractualiser la politique SEO des routes Auth

**Files:**
- Create: `docs/superpowers/specs/2026-09-01-auth-pages-noindex-design.md`
- Modify: `specs/features/042-seo-public-private-architecture/spec.md`

- [ ] **Step 1: Documenter la décision**

Décrire les quatre routes, le layout commun, la politique robots exacte et la
raison pour laquelle `/auth` ne doit pas être ajouté à `robots.txt`.

- [ ] **Step 2: Ajouter AC-01-05 et BR-05A à la spec approuvée**

Le critère exige `index: false`, `follow: false`, `noarchive: true` pour les
quatre routes, sans changement visuel.

- [ ] **Step 3: Vérifier la cohérence documentaire**

Run: `rg -n "AC-01-05|BR-05A|/auth/login" specs/features/042-seo-public-private-architecture/spec.md docs/superpowers/specs/2026-09-01-auth-pages-noindex-design.md`

Expected: les exigences apparaissent dans la spec et le design, sans question
ouverte.

- [ ] **Step 4: Commit**

```bash
git add specs/features/042-seo-public-private-architecture/spec.md docs/superpowers/specs/2026-09-01-auth-pages-noindex-design.md docs/superpowers/plans/2026-09-01-auth-pages-noindex.md
git commit -m "docs: specify auth pages noindex policy"
```

### Task 2: Prouver puis implémenter les metadata du layout Auth

**Files:**
- Modify: `src/app/auth/layout.tsx`
- Create: `tests/integration/seo-public-private.AC-01-05.auth-metadata.test.tsx`

- [ ] **Step 1: Écrire le test d'intégration en échec**

```tsx
import type { Metadata } from 'next'
import * as authLayoutModule from '@/app/auth/layout'

describe('042 SEO auth metadata — AC-01-05', () => {
  it('applies the private robots policy from the shared auth layout', () => {
    const module = authLayoutModule as typeof authLayoutModule & {
      metadata?: Metadata
    }

    expect(module.metadata).toEqual({
      title: 'Authentification',
      robots: {
        index: false,
        follow: false,
        noarchive: true,
      },
    })
  })
})
```

- [ ] **Step 2: Exécuter le test et vérifier RED**

Run: `npm test -- --runInBand tests/integration/seo-public-private.AC-01-05.auth-metadata.test.tsx`

Expected: FAIL parce que le layout Auth n'exporte pas encore `metadata`.

- [ ] **Step 3: Ajouter l'implémentation minimale**

Ajouter au layout :

```tsx
import type { Metadata } from 'next'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'

export const metadata: Metadata = privatePageMetadata('Authentification')
```

- [ ] **Step 4: Exécuter le test et vérifier GREEN**

Run: `npm test -- --runInBand tests/integration/seo-public-private.AC-01-05.auth-metadata.test.tsx`

Expected: PASS, 1 test réussi.

- [ ] **Step 5: Commit**

```bash
git add src/app/auth/layout.tsx tests/integration/seo-public-private.AC-01-05.auth-metadata.test.tsx
git commit -m "fix: prevent auth pages indexing"
```

### Task 3: Tracer et vérifier la correction

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Ajouter AC-01-05 à la matrice**

Ajouter une ligne reliant la spec, `src/app/auth/layout.tsx` et le nouveau test
d'intégration avec le statut `Implemented`.

- [ ] **Step 2: Exécuter les tests SEO liés**

Run: `npm test -- --runInBand tests/unit/seo-public-private.AC-01-01.private-metadata.test.ts tests/integration/seo-public-private.AC-01-05.auth-metadata.test.tsx tests/unit/seo.sitemap.test.ts`

Expected: toutes les suites et tous les tests passent.

- [ ] **Step 3: Exécuter le lint**

Run: `npm run lint`

Expected: exit code 0.

- [ ] **Step 4: Exécuter le build de production**

Run: `npm run build`

Expected: exit code 0 et génération Next.js terminée.

- [ ] **Step 5: Vérifier le diff et commit**

```bash
git diff --check
git status --short
git add docs/traceability-matrix.md
git commit -m "docs: trace auth pages noindex coverage"
```

Expected: aucune erreur d'espaces ; seuls les fichiers planifiés sont modifiés
avant le dernier commit.

## Auto-revue du plan

- **Couverture de la spec :** AC-01-05 est couvert par Task 2 ; BR-05A et la
  traçabilité sont couverts par Tasks 1 et 3 ; l'absence de changement
  `robots.txt` est explicitement vérifiée par l'architecture existante et les
  tests sitemap/robots liés.
- **Placeholders :** aucun `TODO`, `TBD` ou comportement différé.
- **Cohérence des types :** le test et l'implémentation utilisent `Metadata` de
  Next.js et la fabrique existante `privatePageMetadata`.
