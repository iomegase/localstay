# Private Guide Lodging Video Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher sur `/sejour` un bouton conditionnel qui ouvre la vidéo YouTube existante du logement dans une fenêtre superposée accessible.

**Architecture:** Étendre l'adaptateur serveur `getPrivateGuideData` avec le champ Prisma existant `presentation_video_url`, puis exposer une propriété de présentation optionnelle sur `GuideLodging`. Garder `GuideHome` déclaratif en déléguant la validation YouTube, l'état de la fenêtre et ses interactions à un composant client dédié qui réutilise `YouTubeEmbed`.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript strict, Prisma, Tailwind CSS, Lucide React, Jest, Testing Library.

---

## File structure

- Modify: `src/features/guide-app/types.ts` — ajoute l'URL vidéo optionnelle au read model privé.
- Modify: `src/features/guide-app/queries/private-guide-data.ts` — sélectionne et adapte `presentation_video_url` sans nouvelle query.
- Create: `src/features/guide-app/components/GuideLodgingVideoButton.tsx` — bouton, validation partagée, fenêtre et fermeture.
- Modify: `src/features/guide-app/components/GuideHome.tsx` — place le nouveau module avant le livret d'accueil.
- Modify: `tests/unit/private-guide-app.AC-01-05.data.test.ts` — verrouille la sélection et le mapping serveur.
- Create: `tests/integration/private-guide-lodging-video.AC-01-01-05.home.test.tsx` — couvre visibilité, ordre, lecture différée et fermetures.
- Modify: `docs/traceability-matrix.md` — relie les cinq AC de la spec 044 au code et aux tests.

### Task 1: Transmettre l'URL YouTube dans le read model privé

**Files:**
- Modify: `tests/unit/private-guide-app.AC-01-05.data.test.ts`
- Modify: `src/features/guide-app/types.ts:161-184`
- Modify: `src/features/guide-app/queries/private-guide-data.ts:29-42,116-154`

- [ ] **Step 1: Write the failing adapter test**

Ajouter ce test dans `tests/unit/private-guide-app.AC-01-05.data.test.ts` :

```typescript
it('maps the existing presentation video URL onto the private guide lodging', async () => {
  lodgingFindFirst.mockResolvedValue({
    id: 'lodging-1',
    name: 'Le Chalet Hygge',
    city: { name: 'Saint-Gervais-les-Bains', latitude: 45.891, longitude: 6.713 },
    customization: {
      welcome_message: null,
      cover_photo_url: null,
      lodging_address: null,
      lodging_latitude: null,
      lodging_longitude: null,
      wifi_ssid: null,
      wifi_password: null,
      emergency_contacts: null,
      useful_services: null,
      trash_bins: null,
      trash_location: null,
      presentation_video_url: '  https://youtu.be/dQw4w9WgXcQ  ',
    },
    practical_blocks: [],
    arrival_instructions: [],
  })
  featuredFindMany.mockResolvedValue([])

  const result = await getPrivateGuideData('lodging-1')

  expect(result?.lodging.presentationVideoUrl).toBe(
    'https://youtu.be/dQw4w9WgXcQ',
  )
  expect(lodgingFindFirst).toHaveBeenCalledWith(
    expect.objectContaining({
      select: expect.objectContaining({
        customization: expect.objectContaining({
          select: expect.objectContaining({ presentation_video_url: true }),
        }),
      }),
    }),
  )
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
npx jest --runInBand tests/unit/private-guide-app.AC-01-05.data.test.ts
```

Expected: FAIL because `presentation_video_url` is not selected and `presentationVideoUrl` is `undefined`.

- [ ] **Step 3: Extend the read model and adapter minimally**

Dans `GuideLodging`, ajouter :

```typescript
/** Vidéo YouTube de présentation configurée par l'Owner. */
presentationVideoUrl?: string
```

Dans le `select` de `customization`, ajouter :

```typescript
presentation_video_url: true,
```

Dans l'objet `lodging` retourné par `getPrivateGuideData`, ajouter :

```typescript
presentationVideoUrl:
  customization?.presentation_video_url?.trim() || undefined,
```

- [ ] **Step 4: Run focused tests and typecheck**

Run:

```bash
npx jest --runInBand tests/unit/private-guide-app.AC-01-05.data.test.ts
npx tsc --noEmit
```

Expected: adapter suite PASS and TypeScript exit 0.

- [ ] **Step 5: Commit the data flow**

```bash
git add tests/unit/private-guide-app.AC-01-05.data.test.ts \
  src/features/guide-app/types.ts \
  src/features/guide-app/queries/private-guide-data.ts
git commit -m "feat(private-guide): expose lodging presentation video"
```

### Task 2: Ajouter le bouton et la fenêtre vidéo

**Files:**
- Create: `tests/integration/private-guide-lodging-video.AC-01-01-05.home.test.tsx`
- Create: `src/features/guide-app/components/GuideLodgingVideoButton.tsx`
- Modify: `src/features/guide-app/components/GuideHome.tsx:1-80`

- [ ] **Step 1: Write the failing home interaction tests**

Créer `tests/integration/private-guide-lodging-video.AC-01-01-05.home.test.tsx` avec une fixture `GuideLodging` complète et ces comportements :

```tsx
/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuideHome } from '@/features/guide-app/components/GuideHome'
import type { GuideLodging } from '@/features/guide-app/types'

const lodging: GuideLodging = {
  id: 'lodging-1',
  name: 'Le Chalet Hygge',
  city: 'Saint-Gervais-les-Bains',
  tagline: 'Bienvenue',
  coverImage: '/chalet.jpg',
  gallery: [],
  latitude: 45.891,
  longitude: 6.713,
  addressLabel: 'Saint-Gervais-les-Bains',
  checkIn: '16:00',
  checkOut: '10:00',
  wifiName: '',
  wifiPassword: '',
  arrivalInstructions: [],
  departureInstructions: [],
  houseRules: [],
  practicalCards: [],
  usefulNumbers: [],
  trashBins: [],
  trashLocation: null,
  presentationVideoUrl: 'https://youtu.be/dQw4w9WgXcQ',
}

describe('044-private-guide-lodging-video home module', () => {
  it('renders the video action before the lodging guide and loads no iframe', () => {
    render(<GuideHome lodging={lodging} pois={[]} onNavigate={jest.fn()} />)

    const video = screen.getByRole('button', { name: /^Voir la vidéo du logement/i })
    const guide = screen.getByRole('button', { name: /Découvrir le livret d'accueil/i })
    expect(video.compareDocumentPosition(guide) & Node.DOCUMENT_POSITION_FOLLOWING)
      .toBeTruthy()
    expect(screen.queryByRole('dialog', { name: 'Vidéo du logement' })).toBeNull()
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('opens the dialog, keeps YouTube click-to-load, and closes every supported way', async () => {
    const user = userEvent.setup()
    render(<GuideHome lodging={lodging} pois={[]} onNavigate={jest.fn()} />)

    const opener = screen.getByRole('button', { name: /^Voir la vidéo du logement/i })
    await user.click(opener)
    expect(screen.getByRole('dialog', { name: 'Vidéo du logement' })).toBeInTheDocument()
    expect(document.querySelector('iframe')).toBeNull()

    await user.click(screen.getByRole('button', { name: 'Lire la vidéo : Vidéo du logement' }))
    expect(document.querySelector('iframe')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1',
    )

    await user.click(screen.getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(opener)
    await user.click(screen.getByTestId('lodging-video-backdrop'))
    expect(screen.queryByRole('dialog')).toBeNull()

    await user.click(opener)
    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).toBeNull()
  })

  it.each([undefined, '', 'https://vimeo.com/123'])(
    'omits the whole module when the URL is %p',
    (presentationVideoUrl) => {
      render(
        <GuideHome
          lodging={{ ...lodging, presentationVideoUrl }}
          pois={[]}
          onNavigate={jest.fn()}
        />,
      )

      expect(screen.queryByRole('button', { name: /^Voir la vidéo du logement/i }))
        .toBeNull()
    },
  )
})
```

- [ ] **Step 2: Run the new suite and verify RED**

Run:

```bash
npx jest --runInBand tests/integration/private-guide-lodging-video.AC-01-01-05.home.test.tsx
```

Expected: FAIL because the video button and dialog component do not exist.

- [ ] **Step 3: Implement the focused client component**

Créer `src/features/guide-app/components/GuideLodgingVideoButton.tsx` :

```tsx
'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Video, X } from 'lucide-react'
import { YouTubeEmbed } from '@/shared/components/YouTubeEmbed'
import { extractYouTubeId } from '@/shared/lib/youtube'

export function GuideLodgingVideoButton({ url }: { url?: string }) {
  const [open, setOpen] = useState(false)
  const videoId = url ? extractYouTubeId(url) : null

  useEffect(() => {
    if (!open) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  if (!videoId || !url) return null

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-[22px] bg-slate-900 px-5 py-4 text-left text-white"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-violet-600">
            <Video className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold">
              Voir la vidéo du logement
            </span>
            <span className="mt-0.5 block text-[10px] text-white/60">
              Découvrez votre logement en vidéo
            </span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          data-testid="lodging-video-backdrop"
          className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Vidéo du logement"
            onClick={event => event.stopPropagation()}
            className="w-full max-w-[390px] overflow-hidden rounded-[24px] bg-white p-3 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <h2 className="text-base font-semibold text-slate-900">
                Vidéo du logement
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Fermer
              </button>
            </div>
            <YouTubeEmbed
              url={url}
              title="Vidéo du logement"
              className="rounded-[16px]"
            />
          </section>
        </div>
      )}
    </>
  )
}
```

- [ ] **Step 4: Place it before the existing lodging guide action**

Dans `GuideHome.tsx`, importer le composant :

```typescript
import { GuideLodgingVideoButton } from '@/features/guide-app/components/GuideLodgingVideoButton'
```

Puis, immédiatement avant le bouton `Découvrir le livret d'accueil`, ajouter :

```tsx
<GuideLodgingVideoButton url={lodging.presentationVideoUrl} />
```

- [ ] **Step 5: Run the interaction suite and focused regressions**

Run:

```bash
npx jest --runInBand \
  tests/integration/private-guide-lodging-video.AC-01-01-05.home.test.tsx \
  tests/integration/private-guide-app.AC-01-01-04.home.test.tsx \
  tests/unit/youtube-embed.test.tsx
npx tsc --noEmit
npx eslint \
  src/features/guide-app/components/GuideLodgingVideoButton.tsx \
  src/features/guide-app/components/GuideHome.tsx \
  tests/integration/private-guide-lodging-video.AC-01-01-05.home.test.tsx
```

Expected: all suites PASS, TypeScript exit 0, ESLint 0 errors.

- [ ] **Step 6: Commit the UI behavior**

```bash
git add src/features/guide-app/components/GuideLodgingVideoButton.tsx \
  src/features/guide-app/components/GuideHome.tsx \
  tests/integration/private-guide-lodging-video.AC-01-01-05.home.test.tsx
git commit -m "feat(private-guide): open lodging video from stay home"
```

### Task 3: Tracer et vérifier la spec 044

**Files:**
- Modify: `docs/traceability-matrix.md`

- [ ] **Step 1: Add one distinct traceability row per acceptance criterion**

Ajouter une section `044 — Private Guide Lodging Video` avec cinq lignes :

```markdown
| `044-private-guide-lodging-video` | US-01 | AC-01-01 | Le bouton vidéo valide précède le livret d'accueil sur `/sejour`. | `src/features/guide-app/components/GuideHome.tsx`<br>`src/features/guide-app/components/GuideLodgingVideoButton.tsx` | `tests/integration/private-guide-lodging-video.AC-01-01-05.home.test.tsx` | Implemented |
| `044-private-guide-lodging-video` | US-01 | AC-01-02 | Le bouton ouvre le lecteur YouTube partagé dans un dialogue superposé. | `src/features/guide-app/components/GuideLodgingVideoButton.tsx`<br>`src/shared/components/YouTubeEmbed.tsx` | `tests/integration/private-guide-lodging-video.AC-01-01-05.home.test.tsx` | Implemented |
| `044-private-guide-lodging-video` | US-01 | AC-01-03 | Le bouton, l'arrière-plan et Échap ferment le dialogue sans navigation. | `src/features/guide-app/components/GuideLodgingVideoButton.tsx` | `tests/integration/private-guide-lodging-video.AC-01-01-05.home.test.tsx` | Implemented |
| `044-private-guide-lodging-video` | US-01 | AC-01-04 | Une URL absente ou invalide masque entièrement le module. | `src/features/guide-app/components/GuideLodgingVideoButton.tsx`<br>`src/shared/lib/youtube.ts` | `tests/integration/private-guide-lodging-video.AC-01-01-05.home.test.tsx` | Implemented |
| `044-private-guide-lodging-video` | US-01 | AC-01-05 | Aucun iframe YouTube n'est chargé avant les actions explicites d'ouverture puis de lecture. | `src/features/guide-app/components/GuideLodgingVideoButton.tsx`<br>`src/shared/components/YouTubeEmbed.tsx` | `tests/integration/private-guide-lodging-video.AC-01-01-05.home.test.tsx`<br>`tests/unit/youtube-embed.test.tsx` | Implemented |
```

- [ ] **Step 2: Audit traceability and forbidden scope**

Run:

```bash
test "$(rg -c '^\| `044-private-guide-lodging-video`' docs/traceability-matrix.md)" -eq 5
git diff --exit-code origin/main -- prisma/schema.prisma prisma/migrations
git diff --check
```

Expected: 5 traceability rows, no Prisma diff, no whitespace errors.

- [ ] **Step 3: Run the feature and private-guide regression suite**

Run:

```bash
npx jest --runInBand \
  tests/unit/private-guide-app.AC-01-05.data.test.ts \
  tests/integration/private-guide-lodging-video.AC-01-01-05.home.test.tsx \
  tests/integration/private-guide-app.AC-01-01-04.home.test.tsx \
  tests/integration/private-guide-app.AC-01-03.navigation.test.tsx \
  tests/integration/private-guide-lodging-home.AC-01-01-04.page.test.tsx \
  tests/unit/youtube.test.ts \
  tests/unit/youtube-embed.test.tsx
npx tsc --noEmit
npm run lint
```

Expected: all selected suites PASS, TypeScript exit 0, ESLint 0 errors (historical warnings may remain).

- [ ] **Step 4: Run the production build**

Run:

```bash
NEXT_PUBLIC_BASE_URL=https://www.mystay.city npm run build
```

Expected: Prisma generation and Next.js production build exit 0.

- [ ] **Step 5: Commit traceability**

```bash
git add docs/traceability-matrix.md
git commit -m "docs(traceability): map private lodging video"
```

- [ ] **Step 6: Perform final review before integration**

Verify the final diff against `origin/main`, confirm the worktree is clean, and request a code review before proposing merge or Pull Request creation.
