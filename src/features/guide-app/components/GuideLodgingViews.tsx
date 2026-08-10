import * as LucideIcons from 'lucide-react'
import {
  ArrowRight,
  BedDouble,
  Clock3,
  Copy,
  DoorOpen,
  HousePlug,
  Info,
  KeyRound,
  ListOrdered,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  Recycle,
  ScrollText,
  Siren,
  Trash2,
  Wifi,
} from 'lucide-react'
import { getTrashBin } from '@/features/guide-customization/lib/trash-bins'
import { FRENCH_EMERGENCY_NUMBERS } from '@/features/guide-app/lib/emergency-numbers'
import { inlineMarkdown } from '@/features/guide-app/lib/inline-markdown'
import { formatFrenchPhone, frenchPhoneHref } from '@/shared/lib/french-phone'
import { PracticalMediaCard } from '@/features/guide-app/components/PracticalMediaCard'
import { ArrivalInstructionCard } from '@/features/guide-app/components/ArrivalInstructionCard'
import { DepartureChecklist } from '@/features/guide-app/components/DepartureChecklist'
import { GuideDarkMarkdown } from '@/features/guide-app/components/GuideDarkMarkdown'
import { GuideLodgingTabs } from '@/features/guide-app/components/GuideLodgingTabs'

/** Résout une icône Lucide depuis un slug kebab-case (recycle → Recycle). */
function resolvePracticalIcon(slug: string): LucideIcons.LucideIcon {
  const name = slug
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('') as keyof typeof LucideIcons
  return (LucideIcons[name] as LucideIcons.LucideIcon | undefined) ?? Info
}
import type {
  GuideArrivalInstruction,
  GuideLodging,
  GuidePracticalCard,
  GuideView,
} from '@/features/guide-app/types'

const cardClass =
  'rounded-[22px] border border-slate-100 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]'

const navyCardClass =
  'rounded-[26px] bg-slate-900 text-white shadow-[0_10px_28px_rgba(15,23,42,0.14)]'

function equipmentCountLabel(count: number): string {
  return `${count} équipement${count === 1 ? '' : 's'}`
}

/** Lien du point de tri : URL directe si déjà un lien, sinon recherche Google Maps. */
function trashLocationHref(location: string): string {
  return /^https?:\/\//i.test(location)
    ? location
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

export function GuideLodgingViews({
  view,
  lodging,
  onNavigate,
}: {
  view: Extract<GuideView, 'lodging' | 'arrival' | 'departure' | 'practical' | 'rules'>
  lodging: GuideLodging
  onNavigate: (view: GuideView) => void
}) {
  if (view === 'arrival') {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lodging.latitude},${lodging.longitude}`
    return (
      <GuideSubPage
        eyebrow=""
        title="Bienvenue"
        icon={DoorOpen}
        view="arrival"
        onNavigate={onNavigate}
      >
        <section className={`${navyCardClass} p-5`}>
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
                <MapPin className="h-4 w-4" />
              </span>
              <div className="min-w-0">
                <h2 className="text-sm font-semibold leading-9 text-white">Localisation</h2>
                <p className="mt-1 text-xs leading-5 text-white/70">
                  {lodging.addressLabel.split(',').map((part, index) => (
                    <span key={index} className="block">
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
        <InstructionList items={lodging.arrivalInstructions} />
      </GuideSubPage>
    )
  }

  if (view === 'departure') {
    return (
      <GuideSubPage
        eyebrow="Avant de partir"
        title="Checklist du départ"
        icon={LogOut}
        view="departure"
        onNavigate={onNavigate}
      >
        <section className={`${navyCardClass} p-5`}>
          <DepartureChecklist items={lodging.departureInstructions} />
        </section>
      </GuideSubPage>
    )
  }

  if (view === 'rules') {
    return (
      <GuideSubPage
        eyebrow="Le nécessaire"
        title="Les Équipements"
        icon={HousePlug}
        view="rules"
        onNavigate={onNavigate}
      >
        {lodging.houseRules.length > 0 && (
          <section className={`${navyCardClass} p-5`}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
                <ScrollText className="h-5 w-5" />
              </span>
              <h2 className="text-sm font-semibold text-white tracking-wide">Règlement intérieur</h2>
            </div>
            <ul className="mt-4 space-y-4">
              {lodging.houseRules.map(rule => (
                <li key={rule} className="flex items-center gap-2 text-xs tracking-wide leading-5 text-white/90">
                  <span className="h-1 w-1 shrink-0 rounded-full bg-white/40" />
                  <span>{inlineMarkdown(rule)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {lodging.practicalCards.length > 0 && (
          <div className="grid gap-3">
            {lodging.practicalCards.map(card => (
              <PracticalBlockCard key={card.id} card={card} city={lodging.city} />
            ))}
          </div>
        )}
      </GuideSubPage>
    )
  }

  if (view === 'practical') {
    return (
      <GuideSubPage
        eyebrow="Bon à savoir"
        title="Informations pratiques"
        icon={Info}
        view="practical"
        onNavigate={onNavigate}
      >
        <section className={`${navyCardClass} p-5`}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
              <Wifi className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-white/50">
                Réseau Wi-Fi
              </p>
              <h2 className="text-sm font-semibold text-white">
                {lodging.wifiName}
              </h2>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-white/10 px-3 py-3">
            <code className="text-xs text-white/90">{lodging.wifiPassword}</code>
            <Copy className="h-4 w-4 text-white/50" aria-hidden="true" />
          </div>
        </section>
        <section className={`${navyCardClass} p-5`}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-red-500/20 text-red-300">
              <Siren className="h-5 w-5" />
            </span>
            <h2 className="text-sm font-semibold text-white">Urgences</h2>
          </div>
          <div className="mt-4 divide-y divide-white/10">
            {FRENCH_EMERGENCY_NUMBERS.map(item => (
              <CallRow key={item.number} label={item.label} number={item.number} />
            ))}
          </div>
        </section>

        {lodging.usefulNumbers.length > 0 && (
          <section className={`${navyCardClass} p-5`}>
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
                <Phone className="h-5 w-5" />
              </span>
              <h2 className="text-sm font-semibold text-white">Numéros utiles</h2>
            </div>
            <div className="mt-4 divide-y divide-white/10">
              {lodging.usefulNumbers.map(item => (
                <CallRow key={item.label} label={item.label} number={item.number} />
              ))}
            </div>
          </section>
        )}

        {lodging.trashBins.length > 0 && (
          <section className={`${navyCardClass} p-5`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
                  <Recycle className="h-5 w-5" />
                </span>
                <h2 className="text-sm font-semibold text-white">Recyclage</h2>
              </div>
              {lodging.trashLocation && (
                <a
                  href={trashLocationHref(lodging.trashLocation)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-[9px] font-bold uppercase tracking-[0.12em] text-pink-600 shadow-[0_7px_16px_rgba(17,24,39,0.14)] transition-transform active:scale-[0.98]"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pink-600 text-white">
                    <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                  Maps
                </a>
              )}
            </div>
            <div className="mt-4 space-y-3">
              {lodging.trashBins.map(bin => {
                const preset = getTrashBin(bin.type)
                if (!preset) return null
                return (
                  <div key={bin.type} className="flex items-center gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white">
                      <Trash2 className={`h-5 w-5 ${preset.colorClass}`} />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-white">{preset.label}</p>
                      <p className="text-[11px] text-white/60">{preset.hint}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </GuideSubPage>
    )
  }

  return (
    <div className="flex min-h-full flex-col gap-4 px-3 pb-24 pt-3">
      {/* Conteneur 1 — arrivée / départ, centré */}
      <div className="flex flex-1 flex-col justify-center">
        <section className="grid grid-cols-2 gap-2.5">
          <TimeCard
            label="Arrivée"
            value={lodging.checkIn}
            onClick={() => onNavigate('arrival')}
          />
          <TimeCard
            label="Départ"
            value={lodging.checkOut}
            onClick={() => onNavigate('departure')}
          />
        </section>
      </div>

      {/* Conteneur 2 — accès au livret, centré */}
      <div className="flex flex-1 flex-col justify-center">
        <section className="space-y-2.5">
          <GuideLink
            icon={KeyRound}
            title="Accéder au logement"
            copy="Horaires, accès et arrivée"
            onClick={() => onNavigate('arrival')}
          />
        <GuideLink
          icon={Wifi}
          title="Informations pratiques"
          copy="Wi-Fi · contacts · recyclage"
          onClick={() => onNavigate('practical')}
        />
        <GuideLink
          icon={HousePlug}
          title="Équipements"
          copy={equipmentCountLabel(lodging.practicalCards.length)}
          onClick={() => onNavigate('rules')}
        />
        <GuideLink
          icon={LogOut}
          title="Préparer le départ"
          copy={`Checklist avant ${lodging.checkOut}`}
          onClick={() => onNavigate('departure')}
        />
        </section>
      </div>
    </div>
  )
}

function GuideSubPage({
  eyebrow,
  title,
  icon: Icon,
  view,
  onNavigate,
  children,
}: {
  eyebrow: string
  title: string
  icon: typeof BedDouble
  view: Extract<GuideView, 'arrival' | 'practical' | 'rules' | 'departure'>
  onNavigate: (view: GuideView) => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4 px-4 pb-24 pt-2">
      <GuideLodgingTabs view={view} onNavigate={onNavigate} />
      <div className="flex items-center gap-4 rounded-[26px] bg-slate-900 p-6 text-white">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-pink-600">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-pink-300">
            {eyebrow}
          </p>
          <h1 className="mt-1 text-[28px] font-semibold leading-[1.02] tracking-[-0.04em]">
            {title}
          </h1>
        </div>
      </div>
      {children}
    </div>
  )
}

function InstructionList({ items }: { items: GuideArrivalInstruction[] }) {
  if (items.length === 0) return null
  return (
    <section className={`${navyCardClass} p-5`}>
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-white">
          <ListOrdered className="h-5 w-5" />
        </span>
        <h2 className="text-sm font-semibold text-white">Instructions</h2>
      </div>
      <div className="mt-4 space-y-5">
        {items.map((instruction, index) => (
          <ArrivalInstructionCard key={index} index={index} instruction={instruction} />
        ))}
      </div>
    </section>
  )
}

function TimeCard({
  label,
  value,
  onClick,
}: {
  label: string
  value: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${label} ${value}`}
      className="flex min-h-[132px] flex-col items-center justify-center rounded-[26px] bg-white text-center shadow-[0_10px_28px_rgba(15,23,42,0.06)]"
    >
      <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-400">
        {label}
      </span>
      <span className="mt-2 font-[family-name:var(--font-big-shoulders)] text-[44px] font-semibold leading-none tracking-tight text-slate-900">
        {value}
      </span>
    </button>
  )
}

function GuideLink({
  icon: Icon,
  title,
  copy,
  onClick,
}: {
  icon: typeof Clock3
  title: string
  copy: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center justify-between gap-3 rounded-[26px] bg-slate-900 px-5 py-4 text-left text-white shadow-[0_10px_28px_rgba(15,23,42,0.14)]"
    >
      <span className="flex min-w-0 items-center gap-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-pink-600">
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <strong className="block truncate text-sm font-semibold">{title}</strong>
          <small className="mt-0.5 block truncate text-[11px] text-white/60">{copy}</small>
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-white/80" />
    </button>
  )
}

/** Rend une carte « bloc pratique » selon son contenu (tri, média, contact, texte). */
function PracticalBlockCard({ card, city }: { card: GuidePracticalCard; city: string }) {
  if (card.icon === 'recycle') {
    return <WasteCard title={card.title} description={card.description} city={city} />
  }
  const Icon = resolvePracticalIcon(card.icon)
  if (card.photoUrl || card.videoUrl) {
    return (
      <PracticalMediaCard
        icon={Icon}
        title={card.title}
        description={card.description}
        photoUrl={card.photoUrl}
        videoUrl={card.videoUrl}
      />
    )
  }
  if (card.phone) {
    return (
      <ContactCard
        icon={Icon}
        title={card.title}
        description={card.description}
        phone={card.phone}
      />
    )
  }
  return <InfoCard icon={Icon} title={card.title} description={card.description} />
}

const DEMO_TRASH_BINS = ['jaune', 'verte', 'bordeaux'] as const

function WasteCard({
  title,
  description,
  city,
}: {
  title: string
  description: string
  city: string
}) {
  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    `point de tri ${city.replace(/-/g, ' ')}`,
  )}`
  return (
    <article className={`${navyCardClass} p-5`}>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
          <Trash2 className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold leading-9 text-white">{title}</h2>
          <div className="mt-1">
            <GuideDarkMarkdown source={description} />
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
        {DEMO_TRASH_BINS.map(type => {
          const bin = getTrashBin(type)
          if (!bin) return null
          return (
            <div key={type} className="flex items-center gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white">
                <Trash2 className={`h-5 w-5 ${bin.colorClass}`} />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{bin.label}</p>
                <p className="text-[11px] text-white/60">{bin.hint}</p>
              </div>
            </div>
          )
        })}
      </div>
      <a
        href={mapsUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-4 flex items-center justify-center rounded-[18px] bg-pink-600 p-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(219,39,119,0.22)] transition-colors hover:bg-pink-700"
      >
        Point de tri sur Google Maps
      </a>
    </article>
  )
}

function ContactCard({
  icon: Icon,
  title,
  description,
  phone,
}: {
  icon: typeof Info
  title: string
  description: string
  phone: string
}) {
  return (
    <article className={`${navyCardClass} p-5`}>
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
          <Icon className="h-4 w-4" />
        </span>
        <div>
          <h2 className="text-sm font-semibold leading-9 text-white">{title}</h2>
          <div className="mt-1">
            <GuideDarkMarkdown source={description} />
          </div>
        </div>
      </div>
      <a
        href={`tel:${phone.replace(/\s/g, '')}`}
        className="mt-4 flex items-center justify-center gap-2 rounded-[18px] bg-pink-600 p-3.5 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(219,39,119,0.22)] transition-colors hover:bg-pink-700"
      >
        <Phone className="h-4 w-4" aria-hidden="true" />
        {phone}
      </a>
    </article>
  )
}

/** Ligne « libellé → numéro » cliquable pour appeler (icône téléphone verte). */
function CallRow({ label, number }: { label: string; number: string }) {
  return (
    <a
      href={frenchPhoneHref(number)}
      className="flex items-center justify-between gap-3 py-2.5 text-xs"
    >
      <span className="text-white/60">{label}</span>
      <span className="flex items-center gap-2 font-semibold text-white">
        <Phone className="h-3.5 w-3.5 text-green-400" aria-hidden="true" />
        {formatFrenchPhone(number)}
      </span>
    </a>
  )
}

function InfoCard({
  icon: Icon,
  title,
  description,
  tone = 'navy',
}: {
  icon: typeof Info
  title: string
  description: string
  tone?: 'light' | 'navy'
}) {
  const navy = tone === 'navy'
  return (
    <article className={`${navy ? navyCardClass : cardClass} p-5`}>
      <div className="flex items-start gap-3">
        <span
          className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${
            navy ? 'bg-white/10 text-white' : 'bg-blue-50 text-slate-600'
          }`}
        >
          <Icon className="h-4 w-4" />
        </span>
        <h2 className={`text-sm font-semibold leading-9 ${navy ? 'text-white' : 'text-slate-900'}`}>
          {title}
        </h2>
      </div>
      <div className="mt-3 pl-12">
        <GuideDarkMarkdown source={description} />
      </div>
    </article>
  )
}
