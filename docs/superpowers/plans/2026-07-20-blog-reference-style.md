# Blog Reference Style Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reproduire sur la liste et le détail blog la charte des screenshots Chalet Manager sans modifier le shell public MyStay ni les règles métier de la spec 029.

**Architecture:** Les pages Server Components conservent leurs queries et métadonnées. La liste reçoit une composition Tailwind dédiée ; le détail garde le carousel existant avec une variante visuelle blog et délègue le temps de lecture à une fonction pure testée. Le Markdown reste nettoyé par la pipeline existante et reçoit uniquement des styles descendants limités au composant blog.

**Tech Stack:** Next.js 16 App Router, TypeScript strict, Tailwind CSS, Jest, Testing Library.

---

## File map

- Modify: `src/app/(public)/blog/page.tsx` — composition visuelle de la liste.
- Modify: `src/app/(public)/blog/[slug]/page.tsx` — composition du détail, date, temps de lecture et tags.
- Modify: `src/features/blog/components/BlogMarkdown.tsx` — typographie Markdown limitée au blog.
- Modify: `src/features/categories/components/PoiDetailHeroCarousel.tsx` — variante visuelle optionnelle `blog` sans impact par défaut.
- Create: `src/features/blog/lib/reading-time.ts` — calcul pur du temps de lecture.
- Modify: `tests/integration/blog.AC-01-01.public-list-published.test.tsx` — contrat visuel de liste.
- Modify: `tests/integration/blog.AC-02-01.article-detail.test.tsx` — contrat visuel du détail.
- Create: `tests/unit/blog.AC-02-01.reading-time.test.ts` — calcul du temps de lecture.
- Modify: `docs/traceability-matrix.md` — rattachement des nouveaux fichiers et assertions à AC-01-01/AC-02-01.

### Task 1: List styling

- [ ] **Step 1: Add failing structural assertions**

Dans `tests/integration/blog.AC-01-01.public-list-published.test.tsx`, conserver les assertions fonctionnelles et ajouter :

```tsx
expect(screen.getByText('Blog & Guides')).toBeInTheDocument()
expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent('Accueil/Blog')
expect(screen.getByText('Toutes')).toBeInTheDocument()
expect(screen.getByTestId('blog-grid')).toHaveClass('grid-cols-2')
expect(screen.getByTestId('blog-card-week-end-saint-gervais')).toHaveClass('aspect-square')
```

- [ ] **Step 2: Run the list test and verify RED**

Run: `npm test -- tests/integration/blog.AC-01-01.public-list-published.test.tsx --runInBand`

Expected: FAIL because the new visual landmarks/classes are absent.

- [ ] **Step 3: Implement the screenshot composition**

Dans `src/app/(public)/blog/page.tsx` :

- envelopper le contenu dans un fond `bg-slate-50` avec padding généreux ;
- rendre le surtitre, le titre fin uppercase, l'introduction italique et le breadcrumb ;
- rendre `Toutes` et les catégories présentes comme pilules non interactives ;
- rendre une grille `grid grid-cols-2 gap-5` ;
- transformer chaque lien en carte `group relative aspect-square overflow-hidden rounded-[28px]` ;
- placer la cover en `absolute inset-0 h-full w-full object-cover`, un overlay, le titre centré et la catégorie en bas à droite ;
- conserver le lien canonique, le `data-testid`, le fallback sans cover et le contexte City dans le titre de page.

- [ ] **Step 4: Run list and empty/city tests and verify GREEN**

Run: `npm test -- tests/integration/blog.AC-01-01.public-list-published.test.tsx tests/integration/blog.AC-01-02.public-list-empty.test.tsx tests/integration/blog.AC-01-03.city-filter.test.tsx --runInBand`

Expected: 3 suites PASS.

### Task 2: Reading time and article styling

- [ ] **Step 1: Add the failing reading-time test**

Créer `tests/unit/blog.AC-02-01.reading-time.test.ts` :

```ts
import { estimateBlogReadingMinutes } from '@/features/blog/lib/reading-time'

describe('029 blog article reading time', () => {
  it('returns at least one minute and rounds up at 200 words per minute', () => {
    expect(estimateBlogReadingMinutes('court article')).toBe(1)
    expect(estimateBlogReadingMinutes(Array.from({ length: 201 }, () => 'mot').join(' '))).toBe(2)
  })
})
```

- [ ] **Step 2: Run the unit test and verify RED**

Run: `npm test -- tests/unit/blog.AC-02-01.reading-time.test.ts --runInBand`

Expected: FAIL because `reading-time.ts` does not exist.

- [ ] **Step 3: Implement the pure helper**

Créer `src/features/blog/lib/reading-time.ts` :

```ts
const BLOG_WORDS_PER_MINUTE = 200

export function estimateBlogReadingMinutes(markdown: string): number {
  const wordCount = markdown.trim().split(/\s+/).filter(Boolean).length
  return Math.max(1, Math.ceil(wordCount / BLOG_WORDS_PER_MINUTE))
}
```

- [ ] **Step 4: Add failing article visual assertions**

Dans `tests/integration/blog.AC-02-01.article-detail.test.tsx`, ajouter :

```tsx
expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument()
expect(screen.getByText('15 juin 2026')).toBeInTheDocument()
expect(screen.getByText('1 min')).toBeInTheDocument()
expect(screen.getByTestId('blog-article-cover')).toHaveClass('rounded-[28px]')
expect(screen.getByText('SEJOUR')).toBeInTheDocument()
expect(screen.getByText('ALPES')).toBeInTheDocument()
```

- [ ] **Step 5: Run the article test and verify RED**

Run: `npm test -- tests/integration/blog.AC-02-01.article-detail.test.tsx --runInBand`

Expected: FAIL because date, reading time, styled cover landmark and tags are absent.

- [ ] **Step 6: Implement the article composition**

Dans `PoiDetailHeroCarousel`, ajouter `variant?: 'default' | 'blog'` et appliquer pour `blog` un conteneur paysage `aspect-[2/1] h-auto rounded-[28px]`, une image `object-cover`, sans backdrop flouté ni gradient permanent. Le comportement, les boutons et le mode par défaut restent inchangés.

Dans la page article :

- retirer la sheet superposée et ordonner breadcrumb, catégorie, titre, date/temps, carousel, excerpt, Markdown et tags ;
- formater la date avec `Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })` ;
- appeler `estimateBlogReadingMinutes(article.content_markdown)` ;
- passer `variant="blog"` au carousel dans un wrapper `data-testid="blog-article-cover"` ;
- conserver le JSON-LD, tous les breadcrumbs, toutes les photos et les liens existants.

Dans `BlogMarkdown`, appliquer sur le wrapper des variantes Tailwind descendantes pour les titres fins uppercase, paragraphes plus grands, listes aérées et liens accessibles, sans modifier `MarkdownText` global.

- [ ] **Step 7: Run article and sanitization tests and verify GREEN**

Run: `npm test -- tests/unit/blog.AC-02-01.reading-time.test.ts tests/integration/blog.AC-02-01.article-detail.test.tsx tests/unit/blog.AC-02-05.markdown-sanitization.test.tsx --runInBand`

Expected: 3 suites PASS.

### Task 3: Traceability and verification

- [ ] **Step 1: Update traceability**

Compléter AC-01-01 avec le contrat visuel de la liste et AC-02-01 avec `reading-time.ts`, `BlogMarkdown.tsx`, `PoiDetailHeroCarousel.tsx` et le nouveau test unitaire.

- [ ] **Step 2: Run focused blog tests**

Run: `npm test -- --runInBand --testPathPatterns='blog\\.(AC-01-01|AC-01-02|AC-01-03|AC-02-01|AC-02-05)'`

Expected: toutes les suites ciblées PASS.

- [ ] **Step 3: Run lint/type/build verification**

Run: `npm run build`

Expected: exit 0 sans erreur TypeScript ou Next.js.

- [ ] **Step 4: Visual verification**

Démarrer le serveur puis vérifier `/blog` et un `/blog/[slug]` réel à 390 px : aucun débordement, grille deux colonnes, titres lisibles, cartes carrées, cover paysage et contenu Markdown conforme aux screenshots.

- [ ] **Step 5: Commit implementation**

```bash
git add src/app/'(public)'/blog src/features/blog src/features/categories/components/PoiDetailHeroCarousel.tsx tests docs/traceability-matrix.md
git commit -m "feat: match public blog reference styling"
```
