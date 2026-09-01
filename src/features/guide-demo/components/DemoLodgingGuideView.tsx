'use client'

import { useState } from 'react'
import Image from 'next/image'
import {
  BedDouble,
  ChevronDown,
  Clock3,
  Info,
  KeyRound,
  LogOut,
  MapPin,
  Ruler,
  Sofa,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import {
  DemoLodgingAccessSection,
  DemoLodgingDepartureSection,
  DemoLodgingDiscoverSection,
  DemoLodgingPracticalSection,
} from './DemoLodgingGuideSections'
import type { DemoLodging } from '@/features/guide-demo/types'

type LodgingSectionKey = 'access' | 'discover' | 'practical' | 'departure'
type LodgingAccent = 'orange' | 'green' | 'pink' | 'blue'

type LodgingSectionDefinition = {
  key: LodgingSectionKey
  title: string
  subtitle: string
  icon: LucideIcon
  accent: LodgingAccent
}

const LODGING_SECTIONS: readonly LodgingSectionDefinition[] = [
  {
    key: 'access',
    title: 'Accéder au logement',
    subtitle: 'Adresse, vidéo, accès et Wi-Fi',
    icon: KeyRound,
    accent: 'orange',
  },
  {
    key: 'discover',
    title: 'Découvrir le logement',
    subtitle: 'Équipements, règlement et services',
    icon: Sofa,
    accent: 'green',
  },
  {
    key: 'practical',
    title: 'Infos pratiques',
    subtitle: 'Urgences et numéros utiles',
    icon: Info,
    accent: 'pink',
  },
  {
    key: 'departure',
    title: 'Départ',
    subtitle: 'Consignes et tri des déchets',
    icon: LogOut,
    accent: 'blue',
  },
]

const CARD =
  'rounded-[24px] bg-white shadow-[0_4px_18px_rgba(17,17,17,0.09)]'

const TILE: Record<LodgingAccent, string> = {
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-lime-100 text-lime-700',
  pink: 'bg-pink-100 text-pink-600',
  blue: 'bg-blue-100 text-blue-700',
}

const ACCENT_TEXT: Record<LodgingAccent, string> = {
  orange: 'text-orange-600',
  green: 'text-lime-700',
  pink: 'text-pink-600',
  blue: 'text-blue-700',
}

export function DemoLodgingGuideView({ lodging }: { lodging: DemoLodging }) {
  const [openSection, setOpenSection] = useState<LodgingSectionKey | null>(null)
  const [mediaOpen, setMediaOpen] = useState(false)
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

  return (
    <div
      data-testid="demo-lodging-guide"
      className="min-h-full overflow-x-hidden bg-white px-4 pb-32 pt-4 text-slate-900"
    >
      <section
        data-testid="demo-lodging-hero"
        className="relative min-h-[410px] overflow-hidden rounded-[32px] text-white shadow-[0_10px_30px_rgba(17,17,17,0.08)]"
      >
        <Image
          src={lodging.coverImage}
          alt={`Intérieur fictif de ${lodging.name}`}
          fill
          sizes="(max-width: 430px) 100vw, 430px"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-black/10" />

        <div className="relative flex min-h-[410px] flex-col items-start justify-center px-6 pb-32 pt-8">
          <span className="inline-flex rounded-full bg-gradient-to-br from-[#9d174d] to-[#be185d] px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em]">
            Votre guide de séjour
          </span>
          <h1 className="mb-2 mt-4 font-serif text-[clamp(44px,12vw,64px)] font-medium italic leading-[0.95] tracking-[-0.04em]">
            {lodging.name}
          </h1>
          <p className="flex items-center gap-2.5 text-[17px] font-semibold">
            <MapPin className="h-5 w-5 text-[#f72585]" aria-hidden="true" />
            {lodging.city}
          </p>
        </div>

        <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-2 min-[380px]:gap-4">
          <HeroStat icon={Users} value={String(lodging.maxGuests)} label="Voyageurs" />
          <HeroStat icon={BedDouble} value={String(lodging.bedroomCount)} label="Chambres" />
          <HeroStat icon={Ruler} value={`${lodging.surfaceM2} m²`} label="Surface" />
        </div>
      </section>

      <section className="mt-4 grid grid-cols-2 gap-4" aria-label="Horaires du séjour">
        <StayFact
          testId="arrival-fact"
          icon={Clock3}
          label="Arrivée"
          value={lodging.checkIn}
          accent="pink"
        />
        <StayFact
          testId="departure-fact"
          icon={LogOut}
          label="Départ"
          value={lodging.checkOut}
          accent="orange"
        />
      </section>

      <div className="mx-1 mb-4 mt-9">
        <h2 className="text-[26px] font-semibold tracking-[-0.035em] text-slate-900">
          Votre guide logement
        </h2>
        <p className="mt-1.5 text-sm text-slate-500">
          Tout ce qu&apos;il faut savoir pour un séjour parfait.
        </p>
      </div>

      <div className="grid gap-3">
        {LODGING_SECTIONS.map(section => {
          const open = openSection === section.key
          const triggerId = `demo-lodging-trigger-${section.key}`
          const panelId = `demo-lodging-panel-${section.key}`
          const Icon = section.icon

          return (
            <article
              key={section.key}
              data-testid="demo-lodging-section"
              className={`${CARD} overflow-hidden`}
            >
              <h3>
                <button
                  type="button"
                  id={triggerId}
                  aria-expanded={open}
                  aria-controls={panelId}
                  onClick={() =>
                    setOpenSection(current =>
                      current === section.key ? null : section.key,
                    )
                  }
                  className="grid w-full grid-cols-[48px_minmax(0,1fr)_24px] items-center gap-3 p-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
                >
                  <span
                    className={`grid h-12 w-12 place-items-center rounded-[15px] ${TILE[section.accent]}`}
                  >
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </span>
                  <span className="min-w-0">
                    <strong className="block text-[17px] font-semibold text-slate-900">
                      {section.title}
                    </strong>
                    <small className="mt-1 block text-[13px] leading-snug text-slate-500">
                      {section.subtitle}
                    </small>
                  </span>
                  <ChevronDown
                    aria-hidden="true"
                    className={`h-6 w-6 transition-transform duration-200 ${ACCENT_TEXT[section.accent]} ${open ? 'rotate-180' : ''}`}
                  />
                </button>
              </h3>

              <div
                id={panelId}
                role="region"
                aria-labelledby={triggerId}
                hidden={!open}
                className="px-4 pb-5"
              >
                {section.key === 'access' ? (
                  <DemoLodgingAccessSection
                    lodging={lodging}
                    mediaOpen={mediaOpen}
                    onToggleMedia={() => setMediaOpen(current => !current)}
                  />
                ) : null}
                {section.key === 'discover' ? (
                  <DemoLodgingDiscoverSection lodging={lodging} />
                ) : null}
                {section.key === 'practical' ? (
                  <DemoLodgingPracticalSection lodging={lodging} />
                ) : null}
                {section.key === 'departure' ? (
                  <DemoLodgingDepartureSection
                    lodging={lodging}
                    checkedInstructions={checkedInstructions}
                    completedCount={completedCount}
                    onToggleInstruction={toggleInstruction}
                  />
                ) : null}
              </div>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function HeroStat({
  icon: Icon,
  value,
  label,
}: {
  icon: LucideIcon
  value: string
  label: string
}) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-1.5 rounded-[18px] bg-black/85 px-1.5 py-4 text-white shadow-[0_8px_24px_rgba(0,0,0,0.14)] backdrop-blur min-[380px]:gap-2 min-[380px]:px-2">
      <Icon className="h-5 w-5 shrink-0 text-[#f72585]" aria-hidden="true" />
      <div className="min-w-0">
        <strong className="block text-lg leading-none min-[380px]:text-xl">{value}</strong>
        <small className="mt-1.5 block text-[10px] text-white/75 min-[380px]:text-[11px]">
          {label}
        </small>
      </div>
    </div>
  )
}

function StayFact({
  testId,
  icon: Icon,
  label,
  value,
  accent,
}: {
  testId: 'arrival-fact' | 'departure-fact'
  icon: LucideIcon
  label: string
  value: string
  accent: 'pink' | 'orange'
}) {
  const accentClass =
    accent === 'pink'
      ? 'bg-pink-100 text-pink-600'
      : 'bg-orange-100 text-orange-600'

  return (
    <div
      data-testid={testId}
      className={`${CARD} flex min-w-0 items-center gap-2.5 p-4 min-[380px]:gap-3.5 min-[380px]:p-5`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-2xl min-[380px]:h-11 min-[380px]:w-11 ${accentClass}`}
      >
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div className="min-w-0">
        <strong className="block text-sm text-slate-900 min-[380px]:text-base">
          {label}
        </strong>
        <span className="mt-1 block text-[13px] text-slate-500">{value}</span>
      </div>
    </div>
  )
}
