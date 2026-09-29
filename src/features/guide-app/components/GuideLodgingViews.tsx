import * as LucideIcons from 'lucide-react'
import {
  ArrowRight,
  BedDouble,
  Clock3,
  DoorOpen,
  HousePlug,
  Info,
  KeyRound,
  LogOut,
  MapPin,
  Navigation,
  Phone,
  Recycle,
  ScrollText,
  Siren,
  Wifi,
} from 'lucide-react'
import { FRENCH_EMERGENCY_NUMBERS } from '@/features/guide-app/lib/emergency-numbers'
import { inlineMarkdown } from '@/features/guide-app/lib/inline-markdown'
import { formatFrenchPhone, frenchPhoneHref } from '@/shared/lib/french-phone'
import { PracticalMediaCard } from '@/features/guide-app/components/PracticalMediaCard'
import { ArrivalInstructionCard } from '@/features/guide-app/components/ArrivalInstructionCard'
import { DepartureChecklist } from '@/features/guide-app/components/DepartureChecklist'
import { GuideDarkMarkdown } from '@/features/guide-app/components/GuideDarkMarkdown'
import { GuideLodgingTabs } from '@/features/guide-app/components/GuideLodgingTabs'
import { GuideWifiCard } from '@/features/guide-app/components/GuideWifiCard'
import {
  GUIDE_CARD,
  GUIDE_PASTILLE,
  GuideCardHeading,
  GuideInfoCard,
  GuideSectionTitle,
} from '@/features/guide-app/components/GuideCard'

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

function equipmentCountLabel(count: number): string {
  return `${count} équipement${count === 1 ? '' : 's'}`
}

/** Lien du point de tri : URL directe si déjà un lien, sinon recherche Google Maps. */
function trashLocationHref(location: string): string {
  return /^https?:\/\//i.test(location)
    ? location
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`
}

/** Point de tri : lien configuré par l'Owner, sinon recherche « point de tri <ville> ». */
function trashPointHref(lodging: GuideLodging): string {
  return lodging.trashLocation
    ? trashLocationHref(lodging.trashLocation)
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        `point de tri ${lodging.city.replace(/-/g, ' ')}`,
      )}`
}

function trashPointHint(lodging: GuideLodging): string {
  if (lodging.trashLocation && !/^https?:\/\//i.test(lodging.trashLocation)) {
    return lodging.trashLocation
  }
  return lodging.trashLocation ? 'Voir sur Google Maps' : 'Rechercher à proximité sur Google Maps'
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
  const recyclingCards = lodging.practicalCards.filter(
    card => card.icon === 'recycle',
  )
  const equipmentCards = lodging.practicalCards.filter(
    card => card.icon !== 'recycle',
  )

  if (view === 'arrival') {
    const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lodging.latitude},${lodging.longitude}`
    const [street, ...locality] = lodging.addressLabel.split(',').map(part => part.trim())
    return (
      <GuideSubPage
        eyebrow=""
        title="Bienvenue"
        icon={DoorOpen}
        view="arrival"
        onNavigate={onNavigate}
      >
        <section className="grid gap-3">
          <GuideSectionTitle>Localisation</GuideSectionTitle>
          <GuideInfoCard
            testId="guide-access-location"
            icon={MapPin}
            tone="location"
            title={street}
            hint={locality.length > 0 ? locality.join(', ') : undefined}
            trailing={<MapsButton href={mapsUrl} />}
          />
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
        <section
          data-testid="guide-departure-checklist"
          data-guide-card="true"
          className={GUIDE_CARD}
        >
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
          <section className="grid gap-3">
            <GuideSectionTitle>Règlement</GuideSectionTitle>
            <div data-testid="guide-house-rules" data-guide-card="true" className={GUIDE_CARD}>
              <GuideCardHeading
                icon={ScrollText}
                tone="rules"
                as="h3"
                title="Règlement intérieur"
              />
              <ul className="mt-3 divide-y divide-white/10">
                {lodging.houseRules.map(rule => (
                  <li key={rule} className="flex gap-3 py-2.5 text-[13px] leading-5 text-white/80">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#c2457e]" />
                    <span>{inlineMarkdown(rule)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {equipmentCards.length > 0 && (
          <section className="grid gap-3">
            <GuideSectionTitle>Équipements</GuideSectionTitle>
            {equipmentCards.map(card => (
              <PracticalBlockCard key={card.id} card={card} />
            ))}
          </section>
        )}
      </GuideSubPage>
    )
  }

  if (view === 'practical') {
    const showTrashPoint =
      Boolean(lodging.trashLocation) ||
      lodging.trashBins.length > 0 ||
      recyclingCards.length > 0
    return (
      <GuideSubPage
        eyebrow="Bon à savoir"
        title="Informations pratiques"
        icon={Info}
        view="practical"
        onNavigate={onNavigate}
      >
        <GuideWifiCard name={lodging.wifiName} password={lodging.wifiPassword} />

        <section className="grid gap-3">
          <GuideSectionTitle>Urgences</GuideSectionTitle>
          {FRENCH_EMERGENCY_NUMBERS.map(item => (
            <GuideInfoCard
              key={item.number}
              testId="guide-practical-emergency"
              href={frenchPhoneHref(item.number)}
              icon={Siren}
              tone="emergency"
              title={item.label}
              trailing={<PhoneLabel value={item.number} />}
            />
          ))}
        </section>

        {lodging.usefulNumbers.length > 0 && (
          <section className="grid gap-3">
            <GuideSectionTitle>Numéros utiles</GuideSectionTitle>
            {lodging.usefulNumbers.map(item => (
              <GuideInfoCard
                key={item.label}
                testId="guide-practical-useful-number"
                href={frenchPhoneHref(item.number)}
                icon={Phone}
                tone="phone"
                title={item.label}
                trailing={<PhoneLabel value={formatFrenchPhone(item.number)} />}
              />
            ))}
          </section>
        )}

        {(recyclingCards.length > 0 || showTrashPoint) && (
          <section className="grid gap-3">
            <GuideSectionTitle>Tri des déchets</GuideSectionTitle>
            {recyclingCards.map(card => (
              <article
                key={card.id}
                data-testid="guide-practical-recycling"
                data-guide-card="true"
                className={GUIDE_CARD}
              >
                <GuideCardHeading icon={Recycle} tone="location" as="h3" title={card.title} />
                <div className="mt-3">
                  <GuideDarkMarkdown source={card.description} />
                </div>
              </article>
            ))}
            {showTrashPoint && (
              <GuideInfoCard
                testId="guide-practical-trash-location"
                href={trashPointHref(lodging)}
                external
                icon={MapPin}
                tone="location"
                title="Point de tri"
                hint={trashPointHint(lodging)}
              />
            )}
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
          copy={equipmentCountLabel(equipmentCards.length)}
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
      <div data-guide-card="true" className={`${GUIDE_CARD} flex items-center gap-4`}>
        <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-full ${GUIDE_PASTILLE.step}`}>
          <Icon className="h-5 w-5" />
        </span>
        <div>
          {eyebrow ? (
            <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-pink-300">
              {eyebrow}
            </p>
          ) : null}
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
    <section className="grid gap-3">
      <GuideSectionTitle>Instructions</GuideSectionTitle>
      {items.map((instruction, index) => (
        <ArrivalInstructionCard key={index} index={index} instruction={instruction} />
      ))}
    </section>
  )
}

function MapsButton({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-[9px] font-bold uppercase tracking-[0.12em] text-pink-600 shadow-[0_7px_16px_rgba(17,24,39,0.14)] transition-transform active:scale-[0.98]"
    >
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pink-600 text-white">
        <Navigation className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      Maps
    </a>
  )
}

function PhoneLabel({ value }: { value: string }) {
  return <span className="whitespace-nowrap text-sm font-bold">{value}</span>
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

/** Rend une carte « bloc pratique » selon son contenu (média, contact, texte). */
function PracticalBlockCard({ card }: { card: GuidePracticalCard }) {
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
  return (
    <article data-testid="guide-practical-block" data-guide-card="true" className={GUIDE_CARD}>
      <GuideCardHeading icon={Icon} tone="equipment" as="h3" title={card.title} />
      <div className="mt-3">
        <GuideDarkMarkdown source={card.description} />
      </div>
      {card.phone ? (
        <a
          href={`tel:${card.phone.replace(/\s/g, '')}`}
          className="mt-4 flex items-center justify-center gap-2 rounded-2xl bg-slate-100 p-3 text-sm font-semibold text-slate-900 transition-transform active:scale-[0.99]"
        >
          <Phone className="h-4 w-4" aria-hidden="true" />
          {card.phone}
        </a>
      ) : null}
    </article>
  )
}
