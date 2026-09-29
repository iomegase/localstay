'use client'

import { useState } from 'react'
import {
  Copy,
  DoorOpen,
  HousePlug,
  Info,
  KeyRound,
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
import { DemoMediaFrames } from './DemoMediaFrames'
import {
  DEMO_GUIDE_CARD,
  DEMO_PASTILLE,
  DemoCardHeading,
  DemoInfoCard,
  DemoSectionTitle,
} from './DemoGuideCard'
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
        <DemoWifiCard name={lodging.wifiName} password={lodging.wifiPassword} />
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

      <div data-demo-card="true" className={`${DEMO_GUIDE_CARD} flex items-center gap-4`}>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${DEMO_PASTILLE.step}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <div>
          {eyebrow ? (
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-pink-300">
              {eyebrow}
            </p>
          ) : null}
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

function DemoWifiCard({ name, password }: { name: string; password: string }) {
  const [copied, setCopied] = useState(false)

  async function copyPassword() {
    try {
      await navigator.clipboard.writeText(password)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <section data-testid="demo-practical-wifi" data-demo-card="true" className={DEMO_GUIDE_CARD}>
      <DemoCardHeading
        icon={Wifi}
        tone="wifi"
        as="h2"
        title="Wi-Fi"
        hint={
          <>
            Réseau <span className="font-semibold text-white">{name}</span>
          </>
        }
      />
      <button
        type="button"
        onClick={copyPassword}
        aria-label={`Copier le mot de passe Wi-Fi ${password}`}
        className="mt-4 flex w-full items-center justify-between gap-3 rounded-2xl bg-slate-100 px-4 py-3 text-left text-slate-900 transition-transform active:scale-[0.99]"
      >
        <span className="min-w-0">
          <span className="block text-[9px] font-semibold uppercase tracking-[0.15em] text-slate-500">
            Mot de passe
          </span>
          <code className="text-base font-bold">{password}</code>
        </span>
        <span className="flex shrink-0 flex-col items-end gap-1 text-[9px] text-slate-600">
          <Copy className="h-4 w-4 text-slate-900" aria-hidden="true" />
          <span aria-live="polite">{copied ? 'Copié' : 'Tapoter pour copier'}</span>
        </span>
      </button>
    </section>
  )
}

function DemoArrivalView({ lodging }: { lodging: DemoLodging }) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lodging.addressLabel)}`
  const [street, ...locality] = lodging.addressLabel.split(',').map(part => part.trim())

  return (
    <div className="grid gap-5">
      <section className="grid gap-3">
        <DemoSectionTitle>Localisation</DemoSectionTitle>
        <DemoInfoCard
          testId="demo-access-location"
          icon={MapPin}
          tone="location"
          title={street}
          hint={locality.length > 0 ? locality.join(', ') : undefined}
          trailing={
            <a
              href={mapsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-[9px] font-bold uppercase tracking-[0.12em] text-pink-600 shadow-[0_7px_16px_rgba(17,24,39,0.14)] transition-transform active:scale-[0.98]"
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pink-600 text-white">
                <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              Maps
            </a>
          }
        />
      </section>

      <section className="grid gap-3">
        <DemoSectionTitle>Instructions</DemoSectionTitle>
        {lodging.arrivalInstructions.map((instruction, index) => (
          <DemoArrivalInstructionCard
            key={`${instruction.title}-${index}`}
            index={index}
            instruction={instruction}
          />
        ))}
      </section>
    </div>
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
    <article data-testid="demo-arrival-instruction" data-demo-card="true" className={DEMO_GUIDE_CARD}>
      <DemoCardHeading
        step={index + 1}
        tone="step"
        as="h3"
        title={instruction.title ?? `Instruction ${index + 1}`}
      />
      <p className="mt-3 text-[13px] leading-5 text-white/80">{instruction.text}</p>
      <DemoMediaFrames
        photos={instruction.photos}
        photoPlaceholders={instruction.photoPlaceholders}
        videoPlaceholder={instruction.videoPlaceholder}
        altPrefix={`Illustration de l'instruction ${index + 1} —`}
      />
    </article>
  )
}
