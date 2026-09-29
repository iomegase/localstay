import {
  CookingPot,
  Info,
  ListChecks,
  MapPin,
  Phone,
  ScrollText,
  Siren,
  Thermometer,
  Tv,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
  DemoLodging,
  DemoPracticalCard,
} from '@/features/guide-demo/types'
import { DemoMediaFrames } from './DemoMediaFrames'
import {
  DEMO_GUIDE_CARD,
  DemoCardHeading,
  DemoInfoCard,
  DemoSectionTitle,
} from './DemoGuideCard'

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

export function DemoLodgingDiscoverSection({ lodging }: { lodging: DemoLodging }) {
  return (
    <div className="grid gap-5">
      <section data-testid="demo-equipment-list" className="grid gap-3">
        <DemoSectionTitle>Équipements</DemoSectionTitle>
        {lodging.practicalCards.map(card => (
          <EquipmentCard key={card.id} card={card} />
        ))}
      </section>

      <section className="grid gap-3">
        <DemoSectionTitle>Règlement</DemoSectionTitle>
        <div data-testid="demo-house-rules" data-demo-card="true" className={DEMO_GUIDE_CARD}>
          <DemoCardHeading
            icon={ScrollText}
            tone="rules"
            title="Règles de la maison"
            hint={`${lodging.houseRules.length} règles à respecter`}
          />
          <ul className="mt-3 divide-y divide-white/10">
            {lodging.houseRules.map(rule => (
              <li key={rule} className="flex gap-3 py-2.5 text-[13px] leading-5 text-white/80">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c2457e]" />
                <span>{rule}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}

export function DemoLodgingPracticalSection({ lodging }: { lodging: DemoLodging }) {
  return (
    <div className="grid gap-5">
      <section className="grid gap-3">
        <DemoSectionTitle>Urgences</DemoSectionTitle>
        {lodging.emergencyNumbers.map(item => (
          <DemoInfoCard
            key={item.number}
            title={item.label}
            hint={item.hint}
            trailing={<PhoneNumber value={item.number} />}
            icon={Siren}
            tone="emergency"
            testId="demo-practical-emergency"
          />
        ))}
      </section>

      <section className="grid gap-3">
        <DemoSectionTitle>Numéros utiles</DemoSectionTitle>
        {lodging.usefulNumbers.map(item => (
          <DemoInfoCard
            key={item.label}
            title={item.label}
            hint={item.hint}
            trailing={<PhoneNumber value={item.number} />}
            icon={Phone}
            tone="phone"
            testId="demo-practical-useful-number"
          />
        ))}
      </section>

      <section className="grid gap-3">
        <DemoSectionTitle>Tri des déchets</DemoSectionTitle>
        {lodging.trashLocation ? (
          <DemoInfoCard
            title="Point de tri"
            hint={lodging.trashLocation}
            icon={MapPin}
            tone="location"
            testId="demo-practical-trash-location"
          />
        ) : null}
      </section>
    </div>
  )
}

function PhoneNumber({ value }: { value: string }) {
  return <span className="whitespace-nowrap text-sm font-bold">{value}</span>
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
    <section
      role="group"
      aria-label="Checklist de départ"
      data-demo-card="true"
      className={DEMO_GUIDE_CARD}
    >
      <DemoCardHeading
        icon={ListChecks}
        tone="checklist"
        title="À faire avant de partir"
        hint="Cochez chaque point au fur et à mesure"
        trailing={
          <span aria-live="polite" className="text-sm font-bold">
            {completedCount} / {total}
          </span>
        }
      />
      <div
        role="progressbar"
        aria-label="Progression de la checklist de départ"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={completedCount}
        className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/15"
      >
        <div
          className={`h-full rounded-full bg-[#5b7fc4] transition-[width] ${progressWidth}`}
        />
      </div>
      <div className="mt-2 divide-y divide-white/10">
        {lodging.departureInstructions.map((instruction, index) => (
          <label
            key={instruction}
            className="flex cursor-pointer items-start gap-3 py-3 text-[13px] leading-5 text-white/85"
          >
            <input
              type="checkbox"
              checked={checkedInstructions[index]}
              onChange={() => onToggleInstruction(index)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-[#5b7fc4]"
            />
            <span>{instruction}</span>
          </label>
        ))}
      </div>
    </section>
  )
}

function EquipmentCard({ card }: { card: DemoPracticalCard }) {
  const Icon = EQUIPMENT_ICONS[card.icon] ?? Info

  return (
    <article data-testid="demo-equipment-item" data-demo-card="true" className={DEMO_GUIDE_CARD}>
      <DemoCardHeading icon={Icon} tone="equipment" title={card.title} as="h3" />
      <p className="mt-3 text-[13px] leading-5 text-white/80">{card.description}</p>
      <DemoMediaFrames
        photos={card.photoUrl ? [card.photoUrl] : []}
        photoPlaceholders={card.photoPlaceholders}
        videoPlaceholder={card.videoPlaceholder}
        altPrefix={`Illustration ${card.title}`}
      />
    </article>
  )
}
