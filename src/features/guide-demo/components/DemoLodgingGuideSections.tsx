import {
  CookingPot,
  HousePlug,
  Info,
  ListChecks,
  MapPin,
  Phone,
  ScrollText,
  Siren,
  Thermometer,
  Trash2,
  Tv,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
  DemoLodging,
  DemoPracticalCard,
} from '@/features/guide-demo/types'
import { DemoMediaFrames } from './DemoMediaFrames'

const EQUIPMENT_ICONS: Record<string, LucideIcon> = {
  tv: Tv,
  thermometer: Thermometer,
  'cooking-pot': CookingPot,
}

const PROGRESS_WIDTHS = [
  'w-0',
  'w-[11.111%]',
  'w-[22.222%]',
  'w-[33.333%]',
  'w-[44.444%]',
  'w-[55.555%]',
  'w-[66.666%]',
  'w-[77.777%]',
  'w-[88.888%]',
  'w-full',
] as const

const TRASH_PRESENTATION = {
  jaune: {
    label: 'Poubelle jaune',
    hint: 'Emballages & papiers recyclables',
    pastilleClass: 'bg-yellow-500',
  },
  verte: {
    label: 'Poubelle verte',
    hint: 'Verre',
    pastilleClass: 'bg-green-600',
  },
  bordeaux: {
    label: 'Poubelle bordeaux',
    hint: 'Ordures ménagères',
    pastilleClass: 'bg-red-900',
  },
} as const

function getTrashPresentation(type: string) {
  if (!(type in TRASH_PRESENTATION)) return null
  return TRASH_PRESENTATION[type as keyof typeof TRASH_PRESENTATION]
}

export function DemoLodgingDiscoverSection({ lodging }: { lodging: DemoLodging }) {
  return (
    <>
      <section
        data-testid="demo-equipment-list"
        className="rounded-[26px] bg-slate-900 p-5 text-white shadow-[0_10px_28px_rgba(15,23,42,0.14)]"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
            <HousePlug className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold">Équipements</h2>
        </div>
        <div className="mt-4 space-y-5">
          {lodging.practicalCards.map(card => (
            <EquipmentCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      <section
        data-testid="demo-house-rules"
        className="rounded-[26px] bg-slate-900 p-5 text-white shadow-[0_10px_28px_rgba(15,23,42,0.14)]"
      >
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10">
            <ScrollText className="h-5 w-5" aria-hidden="true" />
          </span>
          <h2 className="text-sm font-semibold">Règlement</h2>
        </div>
        <ul className="mt-4 grid gap-3 rounded-2xl bg-slate-800 p-4">
          {lodging.houseRules.map(rule => (
            <li key={rule} className="flex gap-3 text-xs leading-5 tracking-wide text-white/80">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-pink-500" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </section>
    </>
  )
}

export function DemoLodgingPracticalSection({ lodging }: { lodging: DemoLodging }) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-3">
        <h2 className="px-1 text-sm font-semibold text-slate-900">Urgences</h2>
        {lodging.emergencyNumbers.map(item => (
          <DemoInfoCard
            key={item.number}
            title={item.label}
            hint={item.hint}
            trailing={item.number}
            icon={Siren}
            iconClass="bg-red-600"
            testId="demo-practical-emergency"
          />
        ))}
      </section>

      <section className="grid gap-3">
        <h2 className="px-1 text-sm font-semibold text-slate-900">Numéros utiles</h2>
        {lodging.usefulNumbers.map(item => (
          <DemoInfoCard
            key={item.label}
            title={item.label}
            hint={item.hint}
            trailing={item.number}
            icon={Phone}
            iconClass="bg-blue-600"
            testId="demo-practical-useful-number"
          />
        ))}
      </section>

      <section className="grid gap-3">
        <h2 className="px-1 text-sm font-semibold text-slate-900">Tri des déchets</h2>
        {lodging.trashBins.map(bin => {
          const presentation = getTrashPresentation(bin.type)
          if (!presentation) return null

          return (
            <DemoInfoCard
              key={bin.type}
              title={presentation.label}
              hint={presentation.hint}
              icon={Trash2}
              iconClass={presentation.pastilleClass}
              testId="demo-practical-trash-bin"
            />
          )
        })}
        {lodging.trashLocation ? (
          <DemoInfoCard
            title="Point de tri"
            hint={lodging.trashLocation}
            icon={MapPin}
            iconClass="bg-emerald-600"
            testId="demo-practical-trash-location"
          />
        ) : null}
      </section>
    </div>
  )
}

function DemoInfoCard({
  title,
  hint,
  trailing,
  icon: Icon,
  iconClass,
  testId,
}: {
  title: string
  hint?: string
  trailing?: string
  icon: LucideIcon
  iconClass: string
  testId: string
}) {
  return (
    <div
      data-testid={testId}
      className="flex items-center justify-between gap-3 rounded-[22px] bg-slate-900 px-5 py-4 text-white"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${iconClass}`}>
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>
        <span className="min-w-0">
          <span className="block text-sm font-semibold">{title}</span>
          {hint ? (
            <span className="mt-0.5 block text-[10px] text-white/60">{hint}</span>
          ) : null}
        </span>
      </span>
      {trailing ? (
        <span className="shrink-0 whitespace-nowrap text-sm font-bold">{trailing}</span>
      ) : null}
    </div>
  )
}

export function DemoLodgingDepartureSection({
  lodging,
  checkedInstructions,
  completedCount,
  onToggleInstruction,
}: {
  lodging: DemoLodging
  checkedInstructions: readonly boolean[]
  completedCount: number
  onToggleInstruction: (index: number) => void
}) {
  const total = lodging.departureInstructions.length
  const progressWidth = PROGRESS_WIDTHS[completedCount] ?? 'w-full'

  return (
    <div className="grid gap-5 border-t border-slate-100 pt-5">
      <section
        role="group"
        aria-label="Checklist de départ"
        className="rounded-[24px] bg-slate-900 p-5 text-white"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-500/20 text-blue-200">
              <ListChecks className="h-5 w-5" aria-hidden="true" />
            </span>
            <h4 className="font-semibold">Checklist du départ</h4>
          </div>
          <span aria-live="polite" className="text-sm font-bold text-blue-200">
            {completedCount} / {total}
          </span>
        </div>
        <div
          role="progressbar"
          aria-label="Progression de la checklist de départ"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={completedCount}
          className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15"
        >
          <div
            className={`h-full rounded-full bg-blue-400 transition-[width] ${progressWidth}`}
          />
        </div>
        <div className="mt-4 grid gap-2">
          {lodging.departureInstructions.map((instruction, index) => (
            <label
              key={instruction}
              className="flex cursor-pointer items-start gap-3 rounded-2xl bg-white/10 p-3 text-[13px] leading-5 text-white/90"
            >
              <input
                type="checkbox"
                checked={checkedInstructions[index]}
                onChange={() => onToggleInstruction(index)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-blue-500"
              />
              <span>{instruction}</span>
            </label>
          ))}
        </div>
      </section>

    </div>
  )
}

function EquipmentCard({ card }: { card: DemoPracticalCard }) {
  const Icon = EQUIPMENT_ICONS[card.icon] ?? Info

  return (
    <article
      data-testid="demo-equipment-item"
      className="rounded-2xl bg-slate-800 p-4 shadow-[0_6px_18px_rgba(0,0,0,0.28)]"
    >
      <div className="flex items-center gap-3">
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-white/10 text-white">
          <Icon className="h-3.5 w-3.5" aria-hidden="true" />
        </span>
        <h3 className="min-w-0 text-xs font-semibold uppercase tracking-[0.14em] text-white">
          {card.title}
        </h3>
      </div>
      <p className="mt-3 text-xs leading-5 tracking-wide text-white/80">
        {card.description}
      </p>
      <DemoMediaFrames
        photos={card.photoUrl ? [card.photoUrl] : []}
        photoPlaceholders={card.photoPlaceholders}
        videoPlaceholder={card.videoPlaceholder}
        altPrefix={`Illustration ${card.title}`}
      />
    </article>
  )
}
