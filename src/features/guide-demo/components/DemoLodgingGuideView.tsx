'use client'

import { useState } from 'react'
import {
  Copy,
  DoorOpen,
  HousePlug,
  Info,
  KeyRound,
  ListOrdered,
  LogOut,
  MapPin,
  Navigation,
  Wifi,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  DemoLodgingDepartureSection,
  DemoLodgingDiscoverSection,
  DemoLodgingPracticalSection,
} from './DemoLodgingGuideSections'
import type {
  DemoArrivalInstruction,
  DemoLodging,
} from '@/features/guide-demo/types'

type LodgingSubView = 'arrival' | 'practical' | 'rules' | 'departure'

const TABS: readonly {
  view: LodgingSubView
  label: string
  icon: LucideIcon
}[] = [
  { view: 'arrival', label: 'Accès', icon: KeyRound },
  { view: 'practical', label: 'Infos', icon: Wifi },
  { view: 'rules', label: 'Équipements', icon: HousePlug },
  { view: 'departure', label: 'Départ', icon: LogOut },
]

const NAVY_CARD =
  'rounded-[26px] bg-slate-900 text-white shadow-[0_10px_28px_rgba(15,23,42,0.14)]'

export function DemoLodgingGuideView({ lodging }: { lodging: DemoLodging }) {
  const [view, setView] = useState<LodgingSubView>('arrival')
  const [checkedInstructions, setCheckedInstructions] = useState<boolean[]>(
    () => lodging.departureInstructions.map(() => false),
  )

  const completedCount = checkedInstructions.filter(Boolean).length

  function toggleInstruction(index: number) {
    setCheckedInstructions(current =>
      current.map((checked, itemIndex) =>
        itemIndex === index ? !checked : checked,
      ),
    )
  }

  if (view === 'arrival') {
    return (
      <DemoGuideSubPage
        view={view}
        eyebrow=""
        title="Bienvenue"
        icon={DoorOpen}
        onNavigate={setView}
      >
        <DemoArrivalView lodging={lodging} />
      </DemoGuideSubPage>
    )
  }

  if (view === 'practical') {
    return (
      <DemoGuideSubPage
        view={view}
        eyebrow="Bon à savoir"
        title="Informations pratiques"
        icon={Info}
        onNavigate={setView}
      >
        <section className={`${NAVY_CARD} p-5`}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
              <Wifi className="h-5 w-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/50">
                Réseau Wi-Fi
              </p>
              <h2 className="text-sm font-semibold text-white">{lodging.wifiName}</h2>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/10 px-3 py-3">
            <code className="text-xs text-white/90">{lodging.wifiPassword}</code>
            <Copy className="h-4 w-4 text-white/50" aria-hidden="true" />
          </div>
        </section>
        <DemoLodgingPracticalSection lodging={lodging} />
      </DemoGuideSubPage>
    )
  }

  if (view === 'rules') {
    return (
      <DemoGuideSubPage
        view={view}
        eyebrow="Le nécessaire"
        title="Les Équipements"
        icon={HousePlug}
        onNavigate={setView}
      >
        <DemoLodgingDiscoverSection lodging={lodging} />
      </DemoGuideSubPage>
    )
  }

  return (
    <DemoGuideSubPage
      view={view}
      eyebrow="Avant de partir"
      title="Checklist du départ"
      icon={LogOut}
      onNavigate={setView}
    >
      <DemoLodgingDepartureSection
        lodging={lodging}
        checkedInstructions={checkedInstructions}
        completedCount={completedCount}
        onToggleInstruction={toggleInstruction}
      />
    </DemoGuideSubPage>
  )
}

function DemoGuideSubPage({
  view,
  eyebrow,
  title,
  icon: Icon,
  onNavigate,
  children,
}: {
  view: LodgingSubView
  eyebrow: string
  title: string
  icon: LucideIcon
  onNavigate: (view: LodgingSubView) => void
  children: React.ReactNode
}) {
  return (
    <div
      data-testid="demo-lodging-guide"
      className="space-y-4 px-4 pb-24 pt-2"
    >
      <nav
        aria-label="Catégories du livret"
        className="sticky top-0 z-10 -mx-4 grid grid-cols-4 gap-1.5 bg-white px-4 pb-2 pt-1"
      >
        {TABS.map(tab => {
          const active = tab.view === view
          const TabIcon = tab.icon
          return (
            <button
              key={tab.view}
              type="button"
              onClick={() => onNavigate(tab.view)}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-col items-center gap-1 rounded-2xl px-1 py-2 text-[11px] font-semibold shadow-md outline-none transition-shadow focus:outline-none focus-visible:outline-none ${
                active
                  ? 'border-none bg-pink-600 text-white'
                  : 'border border-slate-50 bg-white text-slate-500 hover:text-slate-700 hover:shadow-lg'
              }`}
            >
              <TabIcon className="h-3.5 w-3.5" aria-hidden="true" />
              {tab.label}
            </button>
          )
        })}
      </nav>

      <div className="flex items-center gap-4 rounded-[26px] bg-slate-900 p-6 text-white">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-pink-600">
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-pink-300">
            {eyebrow}
          </p>
          <h1
            data-demo-view-heading="true"
            tabIndex={-1}
            className="mt-1 text-[28px] font-semibold leading-[1.02] tracking-[-0.04em]"
          >
            {title}
          </h1>
        </div>
      </div>
      {children}
    </div>
  )
}

function DemoArrivalView({ lodging }: { lodging: DemoLodging }) {
  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lodging.latitude},${lodging.longitude}`

  return (
    <>
      <section data-testid="demo-access-location" className={`${NAVY_CARD} p-5`}>
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
              <MapPin className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-semibold leading-9 text-white">Localisation</h2>
              <p className="mt-1 text-xs leading-5 text-white/70">
                {lodging.addressLabel.split(',').map((part, index) => (
                  <span key={`${part}-${index}`} className="block">
                    {part.trim()}
                  </span>
                ))}
              </p>
            </div>
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-[9px] font-bold uppercase tracking-[0.12em] text-pink-600 shadow-[0_7px_16px_rgba(17,24,39,0.14)] transition-transform active:scale-[0.98]"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pink-600 text-white">
              <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            Maps
          </a>
        </div>
      </section>

      <section data-testid="demo-access-instructions" className={`${NAVY_CARD} p-5`}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
            <ListOrdered className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold text-white">Instructions</h2>
        </div>
        <div className="mt-4 space-y-5">
          {lodging.arrivalInstructions.map((instruction, index) => (
            <DemoArrivalInstructionCard
              key={`${instruction.title}-${index}`}
              index={index}
              instruction={instruction}
            />
          ))}
        </div>
      </section>
    </>
  )
}

function DemoArrivalInstructionCard({
  instruction,
  index,
}: {
  instruction: DemoArrivalInstruction
  index: number
}) {
  return (
    <article
      data-testid="demo-arrival-instruction"
      className="rounded-2xl bg-slate-800 p-4 shadow-[0_6px_18px_rgba(0,0,0,0.28)]"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-[11px] font-bold text-white">
          {index + 1}
        </span>
        <h3 className="min-w-0 text-xs font-semibold uppercase tracking-[0.14em] text-white">
          {instruction.title ?? `Instruction ${index + 1}`}
        </h3>
      </div>
      <p className="mt-3 text-xs leading-5 tracking-wide text-white/80">
        {instruction.text}
      </p>
      {instruction.photos.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {instruction.photos.map((photo, photoIndex) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={`${photo}-${photoIndex}`}
              src={photo}
              alt={`Illustration ${photoIndex + 1} de l'instruction ${index + 1}`}
              className="h-16 w-16 rounded-xl border border-white/15 object-cover"
            />
          ))}
        </div>
      ) : null}
    </article>
  )
}
