import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  BedDouble,
  Car,
  Clock3,
  Info,
  KeyRound,
  LogOut,
  Map,
  MapPin,
  Ruler,
  ScrollText,
  Settings,
  Siren,
  Sofa,
  Sparkles,
  Trash2,
  Users,
  Video,
  Wifi,
} from 'lucide-react'
import { prisma } from '@/shared/lib/prisma'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { YouTubeEmbed } from '@/shared/components/YouTubeEmbed'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { getTrashBin, isTrashBinType, type TrashBin } from '@/features/guide-customization/lib/trash-bins'
import { DepartureChecklist } from './_components/DepartureChecklist'
import { WifiCredentials } from './_components/WifiCredentials'
import { GuideAccordions, GUIDE_CARD, type GuideSection } from './_components/GuideAccordions'

type PracticalBlock = {
  id: string
  title: string
  body: string | null
  icon: string
  photo_url: string | null
  video_url: string | null
  sort_order: number
}

type BubbleAccent = 'pink' | 'orange' | 'green' | 'violet' | 'blue'

const BUBBLE: Record<BubbleAccent, string> = {
  pink: 'bg-pink-100 text-pink-600',
  orange: 'bg-orange-100 text-orange-600',
  green: 'bg-lime-100 text-lime-700',
  violet: 'bg-violet-100 text-violet-600',
  blue: 'bg-blue-100 text-blue-700',
}

const BODY = 'text-[14px] leading-7 text-slate-600 [&_h1,&_h2,&_h3,&_h4,&_strong]:text-slate-900 [&_a]:text-blue-600'

export default async function LeLogementPage() {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) redirect('/')

  const [customization, practicalBlocks, publicProfile] = await Promise.all([
    prisma.lodgingCustomization.findFirst({
      where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
      select: {
        welcome_message: true,
        cover_photo_url: true,
        presentation_video_url: true,
        lodging_address: true,
        wifi_ssid: true,
        wifi_password: true,
        parking_info: true,
        parking_photo_url: true,
        parking_video_url: true,
        equipment_info: true,
        checkout_instructions: true,
        trash_location: true,
        trash_bins: true,
        house_rules: true,
        emergency_contacts: true,
        useful_services: true,
      },
    }),
    prisma.lodgingPracticalBlock.findMany({
      where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
      orderBy: { sort_order: 'asc' },
      select: { id: true, title: true, body: true, icon: true, photo_url: true, video_url: true, sort_order: true },
    }),
    prisma.lodgingPublicProfile.findFirst({
      where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
      select: { max_guests: true, bedroom_count: true, surface_m2: true },
    }),
  ])

  const has = (value: string | null | undefined) => Boolean(value?.trim())
  const trashBins = parseTrashBins(customization?.trash_bins)
  const hasContent = Boolean(
    practicalBlocks.length
    || customization && Object.entries(customization).some(([key, value]) => key !== 'trash_bins' && has(typeof value === 'string' ? value : null))
    || trashBins.length,
  )

  if (!hasContent) {
    return (
      <div className="-mt-6 min-h-[calc(100dvh-64px)] bg-[#f6f6f4] px-4 py-10">
        <div className={`${GUIDE_CARD} flex flex-col items-center p-10 text-center`}>
          <p className="text-sm font-medium text-slate-500">Les informations pratiques n&apos;ont pas encore été renseignées.</p>
          <Link href={`/guide/${lodgingContext.citySlug}`} className="mt-6 rounded-full bg-slate-900 px-7 py-4 text-sm font-bold text-white">
            Explorer le guide
          </Link>
        </div>
      </div>
    )
  }

  const mapUrl = customization?.lodging_address ? buildMapsUrl(customization.lodging_address) : null
  const trashMapUrl = customization?.trash_location ? buildMapsUrl(customization.trash_location) : null
  const checklistItems = extractChecklistItems(customization?.checkout_instructions)
  const hasWifi = has(customization?.wifi_ssid) || has(customization?.wifi_password)

  const stats: { icon: React.ReactNode; value: string; label: string }[] = []
  if (publicProfile?.max_guests != null) stats.push({ icon: <Users className="h-5 w-5" />, value: String(publicProfile.max_guests), label: 'Voyageurs' })
  if (publicProfile?.bedroom_count != null) stats.push({ icon: <BedDouble className="h-5 w-5" />, value: String(publicProfile.bedroom_count), label: 'Chambres' })
  if (publicProfile?.surface_m2 != null) stats.push({ icon: <Ruler className="h-5 w-5" />, value: `${publicProfile.surface_m2} m²`, label: 'Surface' })

  // ─── Accordéon 1 : accéder au logement ───────────────────────────────────
  const accessContent: React.ReactNode[] = []
  if (customization?.lodging_address) {
    accessContent.push(
      <PanelDetail key="address" icon={<MapPin className="h-5 w-5" />} accent="orange" title="Adresse">
        <p>{customization.lodging_address}</p>
        {mapUrl && (
          <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 font-bold text-orange-600">
            Ouvrir dans Maps <ArrowUpRight className="h-4 w-4" />
          </a>
        )}
      </PanelDetail>,
    )
  }
  if (customization?.presentation_video_url) {
    accessContent.push(
      <PanelDetail key="video" icon={<Video className="h-5 w-5" />} accent="pink" title="Vidéo du logement">
        <YouTubeEmbed url={customization.presentation_video_url} title="Vidéo du logement" className="mt-2 rounded-[18px]" />
      </PanelDetail>,
    )
  }
  if (has(customization?.parking_info) || has(customization?.parking_photo_url) || has(customization?.parking_video_url)) {
    accessContent.push(
      <PanelDetail key="parking" icon={<Car className="h-5 w-5" />} accent="orange" title="Parking">
        {customization?.parking_info && <MarkdownText source={customization.parking_info} />}
        {customization?.parking_photo_url && <MediaImage src={customization.parking_photo_url} alt="Parking" />}
        {customization?.parking_video_url && <YouTubeEmbed url={customization.parking_video_url} title="Parking" className="mt-3 rounded-[18px]" />}
      </PanelDetail>,
    )
  }
  if (hasWifi) {
    accessContent.push(
      <PanelDetail key="wifi" icon={<Wifi className="h-5 w-5" />} accent="green" title="Réseau Wi-Fi">
        <WifiCredentials ssid={customization?.wifi_ssid ?? null} password={customization?.wifi_password ?? null} />
      </PanelDetail>,
    )
  }

  // ─── Accordéon 2 : découvrir le logement ─────────────────────────────────
  const discoverContent: React.ReactNode[] = []
  if (customization?.equipment_info) {
    discoverContent.push(
      <PanelDetail key="equipment" icon={<Settings className="h-5 w-5" />} accent="green" title="Équipements">
        <MarkdownText source={customization.equipment_info} />
      </PanelDetail>,
    )
  }
  for (const block of practicalBlocks) {
    discoverContent.push(<PracticalBlockDetail key={block.id} block={block} />)
  }
  if (customization?.house_rules) {
    discoverContent.push(
      <PanelDetail key="rules" icon={<ScrollText className="h-5 w-5" />} accent="blue" title="Règlement">
        <MarkdownText source={customization.house_rules} />
      </PanelDetail>,
    )
  }
  if (customization?.useful_services) {
    discoverContent.push(
      <PanelDetail key="services" icon={<Sparkles className="h-5 w-5" />} accent="orange" title="Services">
        <MarkdownText source={customization.useful_services} />
      </PanelDetail>,
    )
  }

  // ─── Accordéon 3 : infos pratiques ───────────────────────────────────────
  const practicalContent: React.ReactNode[] = []
  if (customization?.emergency_contacts) {
    practicalContent.push(
      <PanelDetail key="emergency" icon={<Siren className="h-5 w-5" />} accent="pink" title="Urgences">
        <p className="text-[13px] text-slate-500">Numéro à composer en cas d&apos;urgence</p>
        <p data-testid="lodging-emergency-number" className="mt-1 text-3xl font-extrabold leading-none text-slate-900">
          {customization.emergency_contacts}
        </p>
      </PanelDetail>,
    )
  }

  // ─── Accordéon 4 : départ ────────────────────────────────────────────────
  const departureContent: React.ReactNode[] = []
  if (customization?.checkout_instructions) {
    departureContent.push(
      <div key="departure" className={BODY}>
        {checklistItems.length > 0 ? <DepartureChecklist items={checklistItems} /> : <MarkdownText source={customization.checkout_instructions} />}
      </div>,
    )
  }
  if (trashBins.length > 0 || customization?.trash_location) {
    departureContent.push(
      <PanelDetail key="trash" icon={<Trash2 className="h-5 w-5" />} accent="green" title="Poubelles">
        <div className="space-y-4">
          {trashBins.map(bin => {
            const preset = getTrashBin(bin.type)
            return (
              <div key={bin.type} className="flex items-start gap-3">
                <Trash2 className={`h-8 w-8 shrink-0 ${preset?.colorClass ?? 'text-slate-500'}`} />
                <div>
                  <p className="font-bold text-slate-800">{preset?.label}</p>
                  <p className="text-xs text-slate-500">{preset?.hint}</p>
                </div>
              </div>
            )
          })}
        </div>
        {trashMapUrl && (
          <a href={trashMapUrl} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 font-bold text-white">
            Voir le point de tri <MapPin className="h-4 w-4" />
          </a>
        )}
      </PanelDetail>,
    )
  }

  const sections: GuideSection[] = []
  if (accessContent.length > 0) {
    sections.push({ key: 'access', title: 'Accéder au logement', subtitle: 'Adresse, vidéo, accès et stationnement', icon: <KeyRound className="h-5 w-5" />, accent: 'orange', content: accessContent })
  }
  if (discoverContent.length > 0) {
    sections.push({ key: 'discover', title: 'Découvrir le logement', subtitle: 'Équipements, règlement et services', icon: <Sofa className="h-5 w-5" />, accent: 'green', content: discoverContent })
  }
  if (practicalContent.length > 0) {
    sections.push({ key: 'practical', title: 'Infos pratiques', subtitle: 'Urgences et numéros utiles', icon: <Info className="h-5 w-5" />, accent: 'pink', content: practicalContent })
  }
  if (departureContent.length > 0) {
    sections.push({ key: 'departure', title: 'Départ', subtitle: 'Consignes de départ et tri des déchets', icon: <LogOut className="h-5 w-5" />, accent: 'blue', content: departureContent })
  }

  return (
    <div className="-mt-6 min-h-[calc(100dvh-64px)] bg-[#f6f6f4] px-4 pb-10 pt-4 text-slate-900">
      {/* Hero */}
      <section className="relative min-h-[410px] overflow-hidden rounded-[32px] text-white shadow-[0_10px_30px_rgba(17,17,17,0.08)]">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 to-slate-700" />
        {customization?.cover_photo_url && (
          <Image
            src={customization.cover_photo_url}
            alt={lodgingContext.lodgingName}
            fill
            priority
            unoptimized
            sizes="(max-width: 430px) 100vw, 430px"
            className="object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-black/10" />

        <div className={`relative flex min-h-[410px] flex-col items-start justify-center px-6 pt-8 ${stats.length > 0 ? 'pb-32' : 'pb-8'}`}>
          <span className="inline-flex rounded-full bg-gradient-to-br from-[#9d174d] to-[#be185d] px-4 py-2.5 text-xs font-extrabold uppercase tracking-[0.12em]">
            Votre guide de séjour
          </span>
          <h1 className="mb-2 mt-4 font-serif text-[clamp(44px,12vw,64px)] font-medium italic leading-[0.95] tracking-[-0.04em]">
            {lodgingContext.lodgingName}
          </h1>
          <p className="flex items-center gap-2.5 text-[17px] font-semibold">
            <MapPin className="h-5 w-5 text-[#f72585]" strokeWidth={2} />
            {lodgingContext.cityName}
          </p>
        </div>

        {stats.length > 0 && (
          <div className="absolute inset-x-4 bottom-4 grid grid-cols-3 gap-4">
            {stats.map(stat => (
              <div key={stat.label} className="flex items-center justify-center gap-2 rounded-[18px] bg-black/85 px-2 py-4 text-white shadow-[0_8px_24px_rgba(0,0,0,0.14)] backdrop-blur">
                <span className="shrink-0 text-[#f72585]">{stat.icon}</span>
                <div className="min-w-0">
                  <strong className="block text-xl leading-none">{stat.value}</strong>
                  <small className="mt-1.5 block text-[11px] text-white/75">{stat.label}</small>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Arrivée / Départ — informations non cliquables */}
      <section className="mt-4 grid grid-cols-2 gap-4" aria-label="Horaires du séjour">
        <div data-testid="arrival-fact" className={`${GUIDE_CARD} flex items-center gap-3.5 p-5`}>
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${BUBBLE.pink}`}>
            <Clock3 className="h-5 w-5" />
          </span>
          <div>
            <strong className="block text-base text-slate-900">Arrivée</strong>
            <span className="mt-1 block text-[13px] text-slate-500">À partir de 16 h</span>
          </div>
        </div>
        <div data-testid="departure-fact" className={`${GUIDE_CARD} flex items-center gap-3.5 p-5`}>
          <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${BUBBLE.orange}`}>
            <LogOut className="h-5 w-5" />
          </span>
          <div>
            <strong className="block text-base text-slate-900">Départ</strong>
            <span className="mt-1 block text-[13px] text-slate-500">10 h</span>
          </div>
        </div>
      </section>

      <div className="mx-1 mb-4 mt-9">
        <h2 className="text-[26px] font-semibold tracking-[-0.035em] text-slate-900">Votre guide logement</h2>
        <p className="mt-1.5 text-sm text-slate-500">Tout ce qu&apos;il faut savoir pour un séjour parfait.</p>
      </div>

      {sections.length > 0 && <GuideAccordions sections={sections} />}

      {/* Autour de vous — lien direct vers les coups de cœur de l'hôte */}
      <Link
        href="/nos-recommandations"
        aria-label="Autour de vous : les coups de cœur de votre hôte"
        className={`${GUIDE_CARD} mt-3 grid grid-cols-[48px_minmax(0,1fr)_24px] items-center gap-3 p-4`}
      >
        <span className={`grid h-12 w-12 place-items-center rounded-[15px] ${BUBBLE.violet}`}>
          <Map className="h-5 w-5" />
        </span>
        <span className="min-w-0">
          <strong className="block text-[17px] font-semibold text-slate-900">Autour de vous</strong>
          <small className="mt-1 block text-[13px] leading-snug text-slate-500">Retrouvez les coups de cœur de votre hôte</small>
        </span>
        <ArrowRight className="h-6 w-6 text-violet-600" aria-hidden="true" />
      </Link>
    </div>
  )
}

function PanelDetail({
  icon,
  title,
  accent,
  children,
}: {
  icon: React.ReactNode
  title: string
  accent: BubbleAccent
  children: React.ReactNode
}) {
  return (
    <section className="flex items-start gap-3">
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-[14px] ${BUBBLE[accent]}`}>{icon}</span>
      <div className="min-w-0 flex-1">
        <h4 className="mb-1.5 text-base font-semibold text-slate-900">{title}</h4>
        <div className={BODY}>{children}</div>
      </div>
    </section>
  )
}

function PracticalBlockDetail({ block }: { block: PracticalBlock }) {
  return (
    <PanelDetail icon={<CategoryIcon iconSlug={block.icon} className="h-5 w-5" />} accent="green" title={block.title}>
      {block.photo_url && <MediaImage src={block.photo_url} alt={block.title} />}
      {block.video_url && <YouTubeEmbed url={block.video_url} title={block.title} className="mt-3 rounded-[18px]" />}
      {block.body && <MarkdownText source={block.body} />}
    </PanelDetail>
  )
}

function MediaImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative mt-3 aspect-[16/9] overflow-hidden rounded-[18px]">
      <Image src={src} alt={alt} fill unoptimized sizes="(max-width: 430px) 100vw, 430px" className="object-cover" />
    </div>
  )
}

function buildMapsUrl(value: string) {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed) && /(google\.[a-z]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(trimmed)) return trimmed
  return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}`
}

function extractChecklistItems(value: string | null | undefined) {
  if (!value) return []
  return value.split('\n').map(line => line.match(/^\s*[-*]\s+(.+?)\s*$/)?.[1]).filter((item): item is string => Boolean(item))
}

function parseTrashBins(value: unknown): TrashBin[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    if (!item || typeof item !== 'object' || !('type' in item) || typeof item.type !== 'string' || !isTrashBinType(item.type)) return []
    return [{ type: item.type }]
  })
}
