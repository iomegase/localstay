# Page `/le-logement` glissable (2 pages) — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer `/le-logement` en deux pages glissables horizontalement — page 1 « Infos pratiques » (sections fixes), page 2 « À découvrir » (blocs personnalisés) — via un composant `LodgingPager` en CSS scroll-snap natif, le swipe n'apparaissant que s'il existe au moins un bloc.

**Architecture:** La page reste un Server Component (data flow Prisma inchangé). Un nouveau client component `LodgingPager` encapsule le titre de page actif, les dots de pagination, le conteneur scroll-snap et le suivi de page active (IntersectionObserver) ; il reçoit exactement deux panneaux en `children`. Le rendu d'un bloc perso est extrait en composant présentationnel `PracticalBlockCard`.

**Tech Stack:** Next 16 (App Router, RSC), React 19, TypeScript, Tailwind 3.4, Jest + Testing Library (jsdom). CSS scroll-snap natif — aucune nouvelle dépendance.

## Global Constraints

- Coquille publique mobile-first `max-w-[430px]` ; header collant + `PublicBottomNav` inchangés.
- `/le-logement/page.tsx` reste un Server Component ; les 2 requêtes Prisma (`lodgingCustomization` + `lodgingPracticalBlock`), `buildSections` et `hasContent` sont conservés tels quels.
- 3 branches de rendu : `!hasContent` → état vide actuel ; `hasContent && practicalBlocks.length === 0` → rendu liste unique actuel (PAS de pager) ; `hasContent && practicalBlocks.length > 0` → `LodgingPager` à 2 panneaux.
- Titres : page 1 = `Infos pratiques`, page 2 = `À découvrir`.
- `jest.setup.ts` ne fournit PAS `IntersectionObserver` ni `Element.prototype.scrollIntoView` → chaque test qui monte `LodgingPager` doit les stubber.
- Aucune modification du modèle de données, de la route customization, ni de l'éditeur owner.

---

### Task 1: Composant `LodgingPager`

**Files:**
- Create: `src/features/public-menu/components/LodgingPager.tsx`
- Test: `tests/unit/public-menu.lodging-pager.test.tsx`

**Interfaces:**
- Produces: `LodgingPager({ titles, children }: { titles: [string, string]; children: ReactNode }): JSX.Element` — rend exactement les 2 panneaux fournis en `children`, un titre actif et 2 dots ; consommé par Task 2.

- [ ] **Step 1: Écrire les tests (échouent)**

Créer `tests/unit/public-menu.lodging-pager.test.tsx` :

```tsx
/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LodgingPager } from '@/features/public-menu/components/LodgingPager'

beforeAll(() => {
  // jsdom n'implémente ni IntersectionObserver ni scrollIntoView
  class IOStub {
    constructor(_cb: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
  }
  // @ts-expect-error stub de test
  global.IntersectionObserver = IOStub
  Element.prototype.scrollIntoView = jest.fn()
})

describe('LodgingPager', () => {
  function renderPager() {
    return render(
      <LodgingPager titles={['Infos pratiques', 'À découvrir']}>
        <div>PANEL ONE</div>
        <div>PANEL TWO</div>
      </LodgingPager>,
    )
  }

  it('renders both panels, the active title and two pagination dots (first active)', () => {
    renderPager()
    expect(screen.getByText('PANEL ONE')).toBeInTheDocument()
    expect(screen.getByText('PANEL TWO')).toBeInTheDocument()
    expect(screen.getByText('Infos pratiques')).toBeInTheDocument()
    const dots = screen.getAllByRole('button', { name: /aller à/i })
    expect(dots).toHaveLength(2)
    expect(dots[0]).toHaveAttribute('aria-current', 'true')
    expect(dots[1]).toHaveAttribute('aria-current', 'false')
  })

  it('scrolls to the second panel when its dot is tapped', async () => {
    const user = userEvent.setup()
    renderPager()
    await user.click(screen.getByRole('button', { name: /aller à à découvrir/i }))
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled()
  })
})
```

- [ ] **Step 2: Lancer les tests (échouent)**

Run: `npx jest tests/unit/public-menu.lodging-pager.test.tsx`
Expected: FAIL — module `LodgingPager` introuvable.

- [ ] **Step 3: Implémenter le composant**

Créer `src/features/public-menu/components/LodgingPager.tsx` :

```tsx
'use client'

import { Children, useEffect, useRef, useState, type ReactNode } from 'react'

interface LodgingPagerProps {
  titles: [string, string]
  children: ReactNode
}

export function LodgingPager({ titles, children }: LodgingPagerProps) {
  const panels = Children.toArray(children)
  const [active, setActive] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          const index = panelRefs.current.findIndex(panel => panel === entry.target)
          if (index !== -1) setActive(index)
        })
      },
      { root: scrollerRef.current, threshold: 0.5 },
    )
    panelRefs.current.forEach(panel => panel && observer.observe(panel))
    return () => observer.disconnect()
  }, [])

  function goTo(index: number) {
    panelRefs.current[index]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between px-5">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">{titles[active]}</h2>
        <div className="flex items-center gap-2">
          {titles.map((title, index) => (
            <button
              key={title}
              type="button"
              aria-label={`Aller à ${title}`}
              aria-current={index === active}
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === active ? 'w-5 bg-charcoal' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <div
        ref={scrollerRef}
        role="group"
        aria-roledescription="carrousel"
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {panels.map((panel, index) => (
          <div
            key={index}
            ref={node => {
              panelRefs.current[index] = node
            }}
            className="min-h-[50vh] w-full shrink-0 snap-start overflow-y-auto px-5"
          >
            {panel}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Lancer les tests (passent)**

Run: `npx jest tests/unit/public-menu.lodging-pager.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add src/features/public-menu/components/LodgingPager.tsx \
        tests/unit/public-menu.lodging-pager.test.tsx
git commit -m "feat(public-menu): LodgingPager swipeable 2-page component

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Brancher le pager dans `/le-logement` + extraire `PracticalBlockCard`

**Files:**
- Modify: `src/app/(public)/le-logement/page.tsx`
- Test (existant, à modifier): `tests/integration/le-logement.practical-blocks.test.tsx`

**Interfaces:**
- Consumes: `LodgingPager` (Task 1).
- Produces: rien de réutilisé ailleurs (`PracticalBlockCard` est interne à la page).

- [ ] **Step 1: Mettre à jour le test d'intégration (le faire échouer)**

Dans `tests/integration/le-logement.practical-blocks.test.tsx`, ajouter en tête de fichier (après les imports, avant le premier `jest.mock`) le stub IO + scrollIntoView :

```tsx
beforeAll(() => {
  class IOStub {
    constructor(_cb: IntersectionObserverCallback) {}
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords() { return [] }
  }
  // @ts-expect-error stub de test
  global.IntersectionObserver = IOStub
  Element.prototype.scrollIntoView = jest.fn()
})
```

Dans le test `renders custom blocks after the fixed sections, with markdown and photo`, après les assertions existantes, ajouter la vérification de présence du pager :

```tsx
    expect(screen.getByText('À découvrir')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: /aller à/i })).toHaveLength(2)
```

Puis ajouter, à la fin du `describe`, un test du cas « sans bloc » (pas de pager) :

```tsx
  it('renders a single list without pager when there are no custom blocks', async () => {
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue({
      lodging_address: '1 rue des Alpes',
      wifi_ssid: null, wifi_password: null, parking_info: null, equipment_info: null,
      checkout_instructions: null, trash_info: null, trash_location: null,
      house_rules: null, emergency_contacts: null, useful_services: null,
    } as never)
    jest.mocked(prisma.lodgingPracticalBlock.findMany).mockResolvedValue([] as never)

    render(await LeLogementPage())

    expect(screen.getByText('1 rue des Alpes')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /aller à/i })).not.toBeInTheDocument()
    expect(screen.queryByText('À découvrir')).not.toBeInTheDocument()
  })
```

- [ ] **Step 2: Lancer le test (échoue)**

Run: `npx jest tests/integration/le-logement.practical-blocks.test.tsx`
Expected: FAIL — le pager (`À découvrir` / dots `aller à`) n'existe pas encore dans le cas « avec blocs ».

- [ ] **Step 3: Refactorer la page**

Remplacer intégralement `src/app/(public)/le-logement/page.tsx` par cette version (data flow identique, 3 branches de rendu, `LodgingPager` + `PracticalBlockCard`) :

```tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Wifi, Car, Settings, LogOut, Trash2, Scroll, PhoneCall, Sparkles } from 'lucide-react'
import { prisma } from '@/shared/lib/prisma'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { LodgingPager } from '@/features/public-menu/components/LodgingPager'

type PracticalBlock = {
  id: string
  title: string
  body: string | null
  icon: string
  photo_url: string | null
  sort_order: number
}

export default async function LeLogementPage() {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) redirect('/')

  const customization = await prisma.lodgingCustomization.findFirst({
    where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
    select: {
      lodging_address: true,
      wifi_ssid: true,
      wifi_password: true,
      parking_info: true,
      equipment_info: true,
      checkout_instructions: true,
      trash_info: true,
      trash_location: true,
      house_rules: true,
      emergency_contacts: true,
      useful_services: true,
    },
  })

  const practicalBlocks = await prisma.lodgingPracticalBlock.findMany({
    where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
    orderBy: { sort_order: 'asc' },
    select: { id: true, title: true, body: true, icon: true, photo_url: true, sort_order: true },
  })

  const sections = buildSections(customization)
  const hasFixed = sections.some(section => section.hasValue)
  const hasBlocks = practicalBlocks.length > 0
  const hasContent = hasFixed || hasBlocks

  return (
    <div className="pt-4">
      <div className="mb-6 px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Le logement</p>
        <h1 className="mt-1 font-serif italic text-3xl text-charcoal">{lodgingContext.lodgingName}</h1>
        <p className="mt-1 text-sm text-gray-500">{lodgingContext.cityName}</p>
      </div>

      {!hasContent ? (
        <div className="mx-5 rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Votre hôte n&apos;a pas encore renseigné d&apos;informations pratiques.
          <div className="mt-4">
            <Link
              href={`/guide/${lodgingContext.citySlug}`}
              className="inline-block rounded-full bg-charcoal px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
            >
              Voir le guide
            </Link>
          </div>
        </div>
      ) : !hasBlocks ? (
        <div className="space-y-4 px-5 pb-8">
          {sections.filter(s => s.hasValue).map(section => (
            <PracticalCard key={section.key} section={section} />
          ))}
        </div>
      ) : (
        <LodgingPager titles={['Infos pratiques', 'À découvrir']}>
          <div className="space-y-4 pb-8">
            {hasFixed ? (
              sections.filter(s => s.hasValue).map(section => (
                <PracticalCard key={section.key} section={section} />
              ))
            ) : (
              <p className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
                Aucune info pratique renseignée.
              </p>
            )}
          </div>
          <div className="space-y-4 pb-8">
            {practicalBlocks.map(block => (
              <PracticalBlockCard key={block.id} block={block} />
            ))}
          </div>
        </LodgingPager>
      )}
    </div>
  )
}

function PracticalBlockCard({ block }: { block: PracticalBlock }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-charcoal/5 text-charcoal">
          <CategoryIcon iconSlug={block.icon} className="h-5 w-5" />
        </span>
        <div className="flex-1 pt-1">
          <h2 className="font-serif italic text-lg text-charcoal">{block.title}</h2>
          {block.photo_url && (
            <div className="relative mt-3 aspect-[16/10] overflow-hidden rounded-xl">
              <Image src={block.photo_url} alt={block.title} fill unoptimized sizes="(max-width: 430px) 100vw, 430px" className="object-cover" />
            </div>
          )}
          {block.body && (
            <div className="mt-2 text-sm leading-relaxed text-charcoal/70">
              <MarkdownText source={block.body} />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

type Section = {
  key: string
  title: string
  icon: React.ReactNode
  value: string | null
  hasValue: boolean
  format: 'markdown' | 'plain' | 'address' | 'wifi'
  mapsLocation?: string | null
  mapsCtaLabel?: string
}

type CustomizationRow = {
  lodging_address: string | null
  wifi_ssid: string | null
  wifi_password: string | null
  parking_info: string | null
  equipment_info: string | null
  checkout_instructions: string | null
  trash_info: string | null
  trash_location: string | null
  house_rules: string | null
  emergency_contacts: string | null
  useful_services: string | null
} | null

function buildSections(row: CustomizationRow): Section[] {
  const has = (v: string | null | undefined) => Boolean(v && v.trim().length > 0)
  const wifiCombined = row && (has(row.wifi_ssid) || has(row.wifi_password))
    ? `${row.wifi_ssid ?? '—'}|${row.wifi_password ?? '—'}`
    : null

  return [
    {
      key: 'address',
      title: 'Adresse du logement',
      icon: <MapPin className="h-5 w-5" />,
      value: row?.lodging_address ?? null,
      hasValue: has(row?.lodging_address),
      format: 'address',
    },
    {
      key: 'wifi',
      title: 'Wi-Fi',
      icon: <Wifi className="h-5 w-5" />,
      value: wifiCombined,
      hasValue: Boolean(wifiCombined),
      format: 'wifi',
    },
    {
      key: 'parking',
      title: 'Parking',
      icon: <Car className="h-5 w-5" />,
      value: row?.parking_info ?? null,
      hasValue: has(row?.parking_info),
      format: 'markdown',
    },
    {
      key: 'equipment',
      title: 'Fonctionnement des équipements',
      icon: <Settings className="h-5 w-5" />,
      value: row?.equipment_info ?? null,
      hasValue: has(row?.equipment_info),
      format: 'markdown',
    },
    {
      key: 'checkout',
      title: 'Consignes de départ',
      icon: <LogOut className="h-5 w-5" />,
      value: row?.checkout_instructions ?? null,
      hasValue: has(row?.checkout_instructions),
      format: 'markdown',
    },
    {
      key: 'trash',
      title: 'Poubelles',
      icon: <Trash2 className="h-5 w-5" />,
      value: row?.trash_info ?? null,
      hasValue: has(row?.trash_info) || has(row?.trash_location),
      format: 'markdown',
      mapsLocation: row?.trash_location ?? null,
      mapsCtaLabel: 'Ouvrir le point de tri dans Maps',
    },
    {
      key: 'rules',
      title: 'Règlement intérieur',
      icon: <Scroll className="h-5 w-5" />,
      value: row?.house_rules ?? null,
      hasValue: has(row?.house_rules),
      format: 'markdown',
    },
    {
      key: 'emergency',
      title: 'Urgences',
      icon: <PhoneCall className="h-5 w-5" />,
      value: row?.emergency_contacts ?? null,
      hasValue: has(row?.emergency_contacts),
      format: 'markdown',
    },
    {
      key: 'services',
      title: 'Services utiles',
      icon: <Sparkles className="h-5 w-5" />,
      value: row?.useful_services ?? null,
      hasValue: has(row?.useful_services),
      format: 'markdown',
    },
  ]
}

function PracticalCard({ section }: { section: Section }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-charcoal/5 text-charcoal">
          {section.icon}
        </span>
        <div className="flex-1 pt-1">
          <h2 className="font-serif italic text-lg text-charcoal">{section.title}</h2>
          <div className="mt-2 text-sm leading-relaxed text-charcoal/70">
            {renderValue(section)}
            {section.mapsLocation && section.mapsLocation.trim() !== '' && (
              <a
                href={buildMapsUrl(section.mapsLocation)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-charcoal px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <MapPin className="h-3.5 w-3.5" />
                {section.mapsCtaLabel ?? 'Ouvrir dans Maps'}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function buildMapsUrl(value: string): string {
  const trimmed = value.trim()
  // Si c'est déjà une URL Maps (court ou long), on la prend telle quelle
  if (/^https?:\/\//i.test(trimmed) && /(google\.[a-z]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(trimmed)) {
    return trimmed
  }
  // Sinon on construit une recherche Google Maps depuis le texte (adresse)
  return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}`
}

function renderValue(section: Section) {
  if (!section.value) return null

  if (section.format === 'address') {
    const encoded = encodeURIComponent(section.value)
    return (
      <div className="space-y-2">
        <p>{section.value}</p>
        <a
          href={`https://www.google.com/maps?q=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold hover:text-charcoal"
        >
          Ouvrir dans Maps
        </a>
      </div>
    )
  }

  if (section.format === 'wifi') {
    const [ssid, password] = section.value.split('|')
    return (
      <dl className="space-y-2 font-mono text-[13px]">
        {ssid && ssid !== '—' && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-charcoal/40 text-[10px] uppercase tracking-widest">Réseau</dt>
            <dd className="text-charcoal font-semibold">{ssid}</dd>
          </div>
        )}
        {password && password !== '—' && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-charcoal/40 text-[10px] uppercase tracking-widest">Mot de passe</dt>
            <dd className="text-charcoal font-semibold">{password}</dd>
          </div>
        )}
      </dl>
    )
  }

  if (section.format === 'markdown') {
    return <MarkdownText source={section.value} />
  }

  return <p>{section.value}</p>
}
```

- [ ] **Step 4: Lancer le test (passe)**

Run: `npx jest tests/integration/le-logement.practical-blocks.test.tsx`
Expected: PASS (3 tests : avec blocs + pager, état blocs-only, sans bloc sans pager).

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: aucune erreur.

- [ ] **Step 6: Commit**

```bash
git add "src/app/(public)/le-logement/page.tsx" \
        tests/integration/le-logement.practical-blocks.test.tsx
git commit -m "feat(le-logement): swipeable 2-page layout (infos pratiques + à découvrir)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage :**
- Mécanisme scroll-snap natif, 2 panneaux, dots, titre actif, IO, tap-to-scroll, a11y → Task 1. ✅
- 3 branches de rendu (vide / liste seule / pager) + état page-1 vide quand blocs sans info fixe → Task 2. ✅
- Titres « Infos pratiques » / « À découvrir » → Tasks 1 & 2. ✅
- Data flow Prisma inchangé, header conservé → Task 2 (mêmes requêtes, même `buildSections`). ✅
- Non-régression hôtes sans blocs (pas de pager) → Task 2 Step 1 test « sans bloc ». ✅
- Tests `LodgingPager` (jsdom, IO/scrollIntoView stubbés) + intégration page → Tasks 1 & 2. ✅

**Placeholder scan :** aucun TBD/TODO ; tout le code est fourni (composant complet, page complète, tests complets).

**Type consistency :** `LodgingPager({ titles: [string, string]; children })` défini en Task 1 et appelé en Task 2 avec `titles={['Infos pratiques','À découvrir']}` et 2 enfants. `PracticalBlock` (type local Task 2) couvre les champs sélectionnés par Prisma et consommés par `PracticalBlockCard`. `buildSections`/`PracticalCard`/`renderValue`/`buildMapsUrl` repris à l'identique de la page existante (aucune signature changée).
