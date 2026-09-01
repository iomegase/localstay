import type { ReactNode } from 'react'
import Image from 'next/image'
import {
  CookingPot,
  Info,
  ListChecks,
  MapPin,
  Play,
  ScrollText,
  Siren,
  Thermometer,
  Trash2,
  Tv,
  Wifi,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type {
  DemoLodging,
  DemoPracticalCard,
} from '@/features/guide-demo/types'

type LodgingAccent = 'orange' | 'green' | 'pink' | 'blue'

const TILE: Record<LodgingAccent, string> = {
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-lime-100 text-lime-700',
  pink: 'bg-pink-100 text-pink-600',
  blue: 'bg-blue-100 text-blue-700',
}

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
    tileClass: 'bg-yellow-100',
    iconClass: 'text-yellow-500',
  },
  verte: {
    label: 'Poubelle verte',
    hint: 'Verre',
    tileClass: 'bg-green-100',
    iconClass: 'text-green-600',
  },
  bordeaux: {
    label: 'Poubelle bordeaux',
    hint: 'Ordures ménagères',
    tileClass: 'bg-red-100',
    iconClass: 'text-red-900',
  },
} as const

function getTrashPresentation(type: string) {
  if (!(type in TRASH_PRESENTATION)) return null
  return TRASH_PRESENTATION[type as keyof typeof TRASH_PRESENTATION]
}

export function DemoLodgingAccessSection({
  lodging,
  mediaOpen,
  onToggleMedia,
}: {
  lodging: DemoLodging
  mediaOpen: boolean
  onToggleMedia: () => void
}) {
  const mediaTriggerId = 'demo-lodging-media-trigger'
  const mediaPanelId = 'demo-lodging-media-panel'

  return (
    <div className="grid gap-5 border-t border-slate-100 pt-5">
      <ContentBlock icon={MapPin} title="Adresse" accent="orange">
        <p>{lodging.addressLabel}</p>
      </ContentBlock>

      <ContentBlock icon={ListChecks} title="Instructions d’arrivée" accent="orange">
        <ol className="grid gap-3">
          {lodging.arrivalInstructions.map((instruction, index) => (
            <li key={`${instruction.title}-${index}`} className="rounded-2xl bg-slate-50 p-4">
              {instruction.title ? (
                <strong className="block text-sm text-slate-900">
                  {instruction.title}
                </strong>
              ) : null}
              <p className="mt-1 text-[13px] leading-6 text-slate-600">
                {instruction.text}
              </p>
            </li>
          ))}
        </ol>
      </ContentBlock>

      <div>
        <button
          type="button"
          id={mediaTriggerId}
          aria-expanded={mediaOpen}
          aria-controls={mediaPanelId}
          onClick={onToggleMedia}
          className="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500"
        >
          <Play className="h-4 w-4" aria-hidden="true" />
          Vidéo de présentation (démonstration)
        </button>
        {mediaOpen ? (
          <section
            id={mediaPanelId}
            role="region"
            aria-labelledby={mediaTriggerId}
            className="mt-3 overflow-hidden rounded-[24px] bg-slate-900 text-white"
          >
            <Image
              src={lodging.coverImage}
              alt="Aperçu local de la présentation du logement"
              width={640}
              height={360}
              className="aspect-video w-full object-cover opacity-75"
            />
            <p className="p-4 text-sm leading-6 text-white/80">
              Aucun média d’accès privé n’est publié dans cette démonstration.
              Cet aperçu local illustre uniquement l’emplacement de la vidéo.
            </p>
          </section>
        ) : null}
      </div>

      <ContentBlock icon={Wifi} title="Réseau Wi-Fi" accent="green">
        <p className="mb-3 text-xs font-bold uppercase tracking-[0.12em] text-lime-700">
          Identifiants fictifs
        </p>
        <dl className="grid gap-2 rounded-2xl bg-slate-900 p-4 text-white">
          <div className="flex items-center justify-between gap-3">
            <dt className="text-xs text-white/60">Réseau</dt>
            <dd className="text-sm font-semibold">{lodging.wifiName}</dd>
          </div>
          <div className="flex items-center justify-between gap-3">
            <dt className="text-xs text-white/60">Mot de passe</dt>
            <dd className="text-sm font-semibold">{lodging.wifiPassword}</dd>
          </div>
        </dl>
      </ContentBlock>
    </div>
  )
}

export function DemoLodgingDiscoverSection({ lodging }: { lodging: DemoLodging }) {
  return (
    <div className="grid gap-5 border-t border-slate-100 pt-5">
      <section aria-labelledby="demo-equipment-heading">
        <h4 id="demo-equipment-heading" className="text-lg font-semibold text-slate-900">
          Équipements
        </h4>
        <div className="mt-3 grid gap-3">
          {lodging.practicalCards.map(card => (
            <EquipmentCard key={card.id} card={card} />
          ))}
        </div>
      </section>

      <ContentBlock icon={ScrollText} title="Règlement" accent="blue">
        <ul className="grid gap-3">
          {lodging.houseRules.map(rule => (
            <li key={rule} className="flex gap-3 text-[13px] leading-6 text-slate-600">
              <span className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
              <span>{rule}</span>
            </li>
          ))}
        </ul>
      </ContentBlock>
    </div>
  )
}

export function DemoLodgingPracticalSection({ lodging }: { lodging: DemoLodging }) {
  return (
    <div className="grid gap-5 border-t border-slate-100 pt-5">
      <ContentBlock icon={Siren} title="Urgences publiques" accent="pink">
        <dl className="divide-y divide-slate-100">
          {lodging.emergencyNumbers.map(item => (
            <div key={item.number} className="flex items-center justify-between gap-3 py-3">
              <dt className="text-sm text-slate-600">{item.label}</dt>
              <dd className="text-lg font-extrabold text-slate-900">{item.number}</dd>
            </div>
          ))}
        </dl>
      </ContentBlock>

      <ContentBlock icon={Info} title="Numéros utiles" accent="blue">
        <dl className="divide-y divide-slate-100">
          {lodging.usefulNumbers.map(item => (
            <div key={item.label} className="flex items-center justify-between gap-3 py-3">
              <dt className="text-sm text-slate-600">{item.label}</dt>
              <dd className="text-sm font-bold text-slate-900">{item.number}</dd>
            </div>
          ))}
        </dl>
      </ContentBlock>
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

      <ContentBlock icon={Trash2} title="Tri des déchets" accent="green">
        <div className="grid gap-3">
          {lodging.trashBins.map(bin => {
            const presentation = getTrashPresentation(bin.type)
            if (!presentation) return null

            return (
              <div key={bin.type} className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3">
                <span
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${presentation.tileClass}`}
                >
                  <Trash2
                    className={`h-5 w-5 ${presentation.iconClass}`}
                    aria-hidden="true"
                  />
                </span>
                <div>
                  <p className="text-sm font-bold text-slate-900">
                    {presentation.label}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {presentation.hint}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
        {lodging.trashLocation ? (
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-blue-50 p-4 text-sm font-semibold text-blue-900">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            {lodging.trashLocation}
          </p>
        ) : null}
      </ContentBlock>
    </div>
  )
}

function EquipmentCard({ card }: { card: DemoPracticalCard }) {
  const Icon = EQUIPMENT_ICONS[card.icon] ?? Info

  return (
    <article className="flex items-start gap-3 rounded-[24px] bg-slate-50 p-4">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-lime-100 text-lime-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </span>
      <div>
        <h5 className="font-semibold text-slate-900">{card.title}</h5>
        <p className="mt-1 text-[13px] leading-6 text-slate-600">
          {card.description}
        </p>
      </div>
    </article>
  )
}

function ContentBlock({
  icon: Icon,
  title,
  accent,
  children,
}: {
  icon: LucideIcon
  title: string
  accent: LodgingAccent
  children: ReactNode
}) {
  return (
    <section>
      <div className="flex items-center gap-3">
        <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TILE[accent]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </span>
        <h4 className="text-base font-semibold text-slate-900">{title}</h4>
      </div>
      <div className="mt-3 text-[14px] leading-7 text-slate-600">{children}</div>
    </section>
  )
}
