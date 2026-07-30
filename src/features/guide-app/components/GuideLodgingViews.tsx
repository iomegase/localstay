import { GuideLodgingGallery } from '@/features/guide-app/components/GuideLodgingGallery'
import {
  ArrowLeft,
  BedDouble,
  Car,
  Check,
  Clock3,
  Copy,
  DoorOpen,
  Info,
  KeyRound,
  LogOut,
  MapPin,
  Navigation as NavigationIcon,
  Phone,
  ScrollText,
  Settings,
  Wifi,
} from 'lucide-react'
import type {
  GuideLodging,
  GuideView,
} from '@/features/guide-app/types'

const cardClass =
  'rounded-[22px] border border-slate-100 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]'

export function GuideLodgingViews({
  view,
  lodging,
  onNavigate,
}: {
  view: Extract<GuideView, 'lodging' | 'arrival' | 'departure' | 'practical'>
  lodging: GuideLodging
  onNavigate: (view: GuideView) => void
}) {
  if (view === 'arrival') {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lodging.latitude},${lodging.longitude}`
    return (
      <GuideSubPage
        eyebrow="Votre séjour commence ici"
        title="Bienvenue"
        icon={DoorOpen}
        onBack={() => onNavigate('lodging')}
      >
        <InstructionList items={lodging.arrivalInstructions} />
        <InfoCard
          icon={MapPin}
          title="Localisation"
          description={lodging.addressLabel}
        />
        <a
          href={mapsUrl}
          target="_blank"
          rel="noreferrer"
          className="flex items-center justify-center gap-2 rounded-[22px] bg-pink-600 p-4 text-sm font-semibold text-white shadow-[0_12px_30px_rgba(219,39,119,0.22)] transition-colors hover:bg-pink-700"
        >
          <NavigationIcon className="h-4 w-4" aria-hidden="true" />
          Itinéraire Google Maps
        </a>
      </GuideSubPage>
    )
  }

  if (view === 'departure') {
    return (
      <GuideSubPage
        eyebrow="Avant de partir"
        title={`Départ avant ${lodging.checkOut}`}
        icon={LogOut}
        onBack={() => onNavigate('lodging')}
      >
        <InstructionList items={lodging.departureInstructions} />
      </GuideSubPage>
    )
  }

  if (view === 'practical') {
    return (
      <GuideSubPage
        eyebrow="Bon à savoir"
        title="Informations pratiques"
        icon={Info}
        onBack={() => onNavigate('lodging')}
      >
        <section className={`${cardClass} p-5`}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-slate-600">
              <Wifi className="h-5 w-5" />
            </span>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-[0.15em] text-slate-400">
                Réseau Wi-Fi
              </p>
              <h2 className="text-sm font-semibold text-slate-900">
                {lodging.wifiName}
              </h2>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
            <code className="text-xs text-slate-700">{lodging.wifiPassword}</code>
            <Copy className="h-4 w-4 text-slate-400" aria-hidden="true" />
          </div>
        </section>
        <div className="grid gap-3">
          {lodging.practicalCards.map(card => (
            <InfoCard
              key={card.id}
              icon={card.icon === 'car' ? Car : Settings}
              title={card.title}
              description={card.description}
            />
          ))}
        </div>
        <section className={`${cardClass} p-5`}>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-slate-600">
              <Phone className="h-5 w-5" />
            </span>
            <h2 className="text-sm font-semibold text-slate-900">Numéros utiles</h2>
          </div>
          <div className="mt-4 divide-y divide-slate-100">
            {lodging.usefulNumbers.map(item => (
              <div key={item.label} className="flex items-center justify-between py-2.5 text-xs">
                <span className="text-slate-500">{item.label}</span>
                <span className="font-semibold text-slate-900">{item.number}</span>
              </div>
            ))}
          </div>
        </section>
      </GuideSubPage>
    )
  }

  return (
    <div className="space-y-4 px-3 pb-24 pt-3">
      <section>
        <GuideLodgingGallery images={lodging.gallery} alt={lodging.name} />
        <div className="mt-4 px-1">
          <h1 className="text-[24px] font-semibold leading-tight tracking-[-0.04em] text-slate-900">
            {lodging.name}
          </h1>
          <p className="mt-1.5 flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="h-4 w-4 text-slate-400" />
            {lodging.city}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-2.5">
        <Fact icon={Clock3} label="Arrivée" value={lodging.checkIn} />
        <Fact icon={LogOut} label="Départ" value={lodging.checkOut} />
      </section>

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
          copy="Wi-Fi, équipements et contacts"
          onClick={() => onNavigate('practical')}
        />
        <GuideLink
          icon={ScrollText}
          title="Consignes du logement"
          copy={`${lodging.equipment.length} équipements · ${lodging.houseRules.length} règles`}
          onClick={() => onNavigate('practical')}
        />
        <GuideLink
          icon={LogOut}
          title="Préparer le départ"
          copy={`Checklist avant ${lodging.checkOut}`}
          onClick={() => onNavigate('departure')}
        />
      </section>
    </div>
  )
}

function GuideSubPage({
  eyebrow,
  title,
  icon: Icon,
  onBack,
  children,
}: {
  eyebrow: string
  title: string
  icon: typeof BedDouble
  onBack: () => void
  children: React.ReactNode
}) {
  return (
    <div className="space-y-4 px-4 pb-24 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Guide logement
      </button>
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

function InstructionList({ items }: { items: string[] }) {
  return (
    <ol className={`${cardClass} divide-y divide-slate-100 p-2`}>
      {items.map((item, index) => (
        <li key={item} className="flex gap-3 p-3 text-xs leading-5 text-slate-600">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-600">
            {index + 1}
          </span>
          <span className="pt-1">{item}</span>
        </li>
      ))}
    </ol>
  )
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Clock3
  label: string
  value: string
}) {
  return (
    <div className={`${cardClass} flex items-center gap-3 p-4`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-pink-50 text-slate-600">
        <Icon className="h-4 w-4" />
      </span>
      <span>
        <span className="block text-[9px] text-slate-400">{label}</span>
        <strong className="block text-sm text-slate-900">{value}</strong>
      </span>
    </div>
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
      className={`${cardClass} grid w-full grid-cols-[42px_minmax(0,1fr)_24px] items-center gap-3 p-4 text-left`}
    >
      <span className="grid h-[42px] w-[42px] place-items-center rounded-[14px] bg-pink-50 text-slate-600">
        <Icon className="h-5 w-5" />
      </span>
      <span className="min-w-0">
        <strong className="block text-sm text-slate-900">{title}</strong>
        <small className="mt-1 block truncate text-[10px] text-slate-500">{copy}</small>
      </span>
      <Check className="h-4 w-4 text-slate-300" />
    </button>
  )
}

function InfoCard({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof Info
  title: string
  description: string
}) {
  return (
    <article className={`${cardClass} p-5`}>
      <div className="flex items-center gap-3">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-slate-600">
          <Icon className="h-4 w-4" />
        </span>
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
    </article>
  )
}
