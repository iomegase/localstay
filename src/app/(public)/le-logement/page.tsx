import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Wifi, Car, Settings, LogOut, Trash2, Scroll, PhoneCall, Sparkles, ArrowUpRight, Video } from 'lucide-react'
import { prisma } from '@/shared/lib/prisma'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { LodgingPager } from '@/features/public-menu/components/LodgingPager'
import { YouTubeEmbed } from '@/shared/components/YouTubeEmbed'
import { getTrashBin, type TrashBin } from '@/features/guide-customization/lib/trash-bins'
import { WifiCredentials } from './_components/WifiCredentials'

type PracticalBlock = {
  id: string
  title: string
  body: string | null
  icon: string
  photo_url: string | null
  video_url: string | null
  sort_order: number
}

type Theme = {
  bg: string
  text: string
  muted: string
  border: string
  shadow: string
  iconTileBg: string
  iconColor: string
  dashColor: string
  actionBg: string
  actionIcon: string
  isDark: boolean
}

const CARD_SHADOW = 'shadow-[0_10px_40px_rgba(0,0,0,0.06)]'

const themes: Record<'light' | 'red', Theme> = {
  // Carte blanche flottante, accent slate-800, tuile d'icône gris clair, trait signature
  light: {
    bg: 'bg-white',
    text: 'text-slate-800',
    muted: 'text-slate-500',
    border: '',
    shadow: CARD_SHADOW,
    iconTileBg: 'bg-[#F1F3F5]',
    iconColor: 'text-slate-800',
    dashColor: 'bg-slate-800',
    actionBg: 'bg-slate-800',
    actionIcon: 'text-white',
    isDark: false,
  },
  red: {
    bg: 'bg-red-500',
    text: 'text-white',
    muted: 'text-white/80',
    border: '',
    shadow: CARD_SHADOW,
    iconTileBg: 'bg-white/15',
    iconColor: 'text-white',
    dashColor: 'bg-white',
    actionBg: 'bg-white',
    actionIcon: 'text-red-500',
    isDark: true,
  },
}

const PRACTICAL_SECTION_ORDER = ['address', 'presentation-video', 'parking', 'wifi', 'rules', 'services', 'emergency']
const DEPARTURE_SECTION_ORDER = ['checkout', 'trash']

export default async function LeLogementPage() {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) redirect('/')

  // 🚀 OPTIMISATION : Requêtes parallèles pour diviser le temps d'attente par 2
  const [customization, practicalBlocks] = await Promise.all([
    prisma.lodgingCustomization.findFirst({
      where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
      select: {
        welcome_message: true,
        cover_photo_url: true, presentation_video_url: true,
        lodging_address: true, wifi_ssid: true, wifi_password: true,
        parking_info: true, parking_photo_url: true, parking_video_url: true,
        equipment_info: true, checkout_instructions: true, trash_location: true, trash_bins: true,
        house_rules: true, emergency_contacts: true, useful_services: true,
      },
    }),
    prisma.lodgingPracticalBlock.findMany({
      where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
      orderBy: { sort_order: 'asc' },
      select: { id: true, title: true, body: true, icon: true, photo_url: true, video_url: true, sort_order: true },
    })
  ])

  const sections = buildSections(customization)
  const practicalSections = PRACTICAL_SECTION_ORDER
    .map(key => sections.find(section => section.key === key && section.hasValue))
    .filter((section): section is Section => Boolean(section))
  const departureSections = DEPARTURE_SECTION_ORDER
    .map(key => sections.find(section => section.key === key && section.hasValue))
    .filter((section): section is Section => Boolean(section))
  // La carte Équipements est déplacée en tête de la page 3 « Bon à savoir ».
  const equipmentSection = sections.find(section => section.key === 'equipment' && section.hasValue) ?? null

  const presentationPhoto = customization?.cover_photo_url ?? null
  const hasPresentationContent = Boolean(presentationPhoto || customization?.welcome_message)
  const hasPracticalContent = practicalSections.length > 0
  const hasBonASavoirContent = Boolean(equipmentSection) || practicalBlocks.length > 0
  const hasDepartureContent = departureSections.length > 0
  const hasContent = hasPresentationContent || hasPracticalContent || hasBonASavoirContent || hasDepartureContent

  return (
    <div className="bg-white pt-8 pb-28">
      {!hasContent ? (
        <div className="mx-6 flex flex-col items-center rounded-[40px] bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-medium text-[#6F767E]">
            Les informations pratiques n&apos;ont pas encore été renseignées.
          </p>
          <Link
            href={`/guide/${lodgingContext.citySlug}`}
            className="mt-6 inline-flex items-center justify-center rounded-full bg-[#1A1D1F] px-8 py-4 text-[13px] font-bold text-white transition-transform hover:scale-105"
          >
            Explorer le guide
          </Link>
        </div>
      ) : (
        <LodgingPager titles={['Bienvenue', 'Infos pratiques', 'Bon à savoir', 'Départ & consignes']}>
          <div className="flex flex-col gap-8 pb-10 mt-4">
            <div className="px-2">
              <h1 className="text-[36px] font-bold leading-none tracking-tighter text-[#1A1D1F]">
                {lodgingContext.lodgingName}
              </h1>
            </div>

            {presentationPhoto && (
              <section className="flex flex-col gap-4 -mx-4">
                <div className="relative aspect-[2/1] w-full overflow-hidden">
                  <Image src={presentationPhoto} alt="Présentation du logement" fill unoptimized sizes="(max-width: 430px) 100vw, 430px" className="object-cover" />
                </div>
              </section>
            )}

            {customization?.welcome_message ? (
              <div
                data-testid="lodging-welcome-message"
                className={`px-5 py-2 font-hand [&_p]:!text-xl [&_p]:!leading-snug [&_p]:!text-left  [&_h3]:!text-4xl [&_h3]:!normal-case ${getMarkdownTextStyles(false)}`}
              >
                <MarkdownText source={customization.welcome_message} breaks />
              </div>
            ) : (
              <p className="px-5 text-sm font-medium text-[#6F767E]">
                Bienvenue dans votre guide logement.
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-4 pb-10 mt-4">
            {hasPracticalContent ? (
              practicalSections.map((section) => (
                <PracticalCard key={section.key} section={section} />
              ))
            ) : (
              <div className="w-full flex items-center justify-center rounded-[40px] bg-white p-10 text-center text-sm font-medium text-[#6F767E]">
                Aucune information renseignée.
              </div>
            )}
          </div>

          {/* Page 3 : Équipements en tête, puis blocs personnalisés du propriétaire */}
          <div className="flex flex-col gap-4 pb-10 mt-4">
            {hasBonASavoirContent ? (
              <>
                {equipmentSection && <PracticalCard section={equipmentSection} />}
                {practicalBlocks.map((block) => (
                  <PracticalBlockCard key={block.id} block={block} theme={themes.light} />
                ))}
              </>
            ) : (
              <div className="w-full flex items-center justify-center rounded-[40px] bg-white p-10 text-center text-sm font-medium text-[#6F767E]">
                Aucun bloc renseigné.
              </div>
            )}
          </div>

          {/* Page 4 : départ & poubelles uniquement */}
          <div className="flex flex-col gap-4 pb-10 mt-4">
            {departureSections.length > 0 ? (
              departureSections.map((section) => (
                <PracticalCard key={section.key} section={section} />
              ))
            ) : (
              <div className="w-full flex items-center justify-center rounded-[40px] bg-white p-10 text-center text-sm font-medium text-[#6F767E]">
                Aucune consigne renseignée.
              </div>
            )}
          </div>
        </LodgingPager>
      )}
    </div>
  )
}

// 🚀 OPTIMISATION : CSS plus concis et performant avec sélecteurs groupés
const getMarkdownTextStyles = (isDark: boolean) => 
  isDark 
    ? 'text-white/95 [&_p,&_li,&_span,&_a]:!text-white/95 [&_h1,&_h2,&_h3,&_h4,&_strong]:!text-white' 
    : 'text-[#6F767E] [&_p,&_li,&_span,&_a]:!text-[#6F767E] [&_h1,&_h2,&_h3,&_h4,&_strong]:!text-[#1A1D1F]'

function PracticalBlockCard({ block, theme }: { block: PracticalBlock, theme: Theme }) {
  return (
    <section className={`w-full rounded-[28px] p-6 sm:p-8 flex flex-col ${theme.bg} ${theme.text} ${theme.shadow}`}>
      <div className="flex items-center gap-3 mb-6">
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${theme.iconTileBg}`}>
          <CategoryIcon iconSlug={block.icon} className={`h-5 w-5 ${theme.iconColor}`} />
        </div>
        <div className="min-w-0">
          <h2 className="font-semibold text-[22px] tracking-tight">{block.title}</h2>
          <div className={`mt-2 h-1 w-8 rounded-full ${theme.dashColor}`} />
        </div>
      </div>

      {/* 🚀 OPTIMISATION : Aspect 2/1 pour éviter l'écrasement de l'image (comme sur vos maquettes) */}
      {block.photo_url && (
        <div className="relative mb-6 aspect-[2/1] w-full overflow-hidden rounded-[24px]">
          <Image src={block.photo_url} alt={block.title} fill unoptimized sizes="(max-width: 430px) 100vw, 430px" className="object-contain" />
        </div>
      )}

      {block.video_url && (
        <div className="mb-6">
          <YouTubeEmbed url={block.video_url} title={block.title} className="rounded-[24px]" />
        </div>
      )}

      {/* 🚀 OPTIMISATION : Tailles de texte réduites pour plus d'élégance (14px / 15px) */}
      {block.body && (
        <div className={`text-[15px] sm:text-[16px] leading-relaxed flex-1 ${getMarkdownTextStyles(theme.isDark)}`}>
          <MarkdownText source={block.body} />
        </div>
      )}
    </section>
  )
}

function PracticalCard({ section }: { section: Section }) {
  const { theme, isSquare } = section
  
  const mapUrl = section.mapsLocation ? buildMapsUrl(section.mapsLocation) : 
                 (section.format === 'address' && section.value) ? buildMapsUrl(section.value) : null

  const wrapperClasses = isSquare 
    ? 'w-[calc(50%-8px)] sm:w-48 aspect-square' 
    : 'w-full min-h-[160px] sm:min-h-[200px]'

  const innerClasses = `relative group overflow-hidden rounded-[28px] ${isSquare ? 'px-4 py-6' : 'p-6 sm:p-8'} flex flex-col ${theme.bg} ${theme.text} ${theme.shadow} h-full w-full`

  const CardContent = (
    <section className={innerClasses}>
      {section.backgroundImage && (
        <>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-2/3">
            <Image src={section.backgroundImage} alt="" fill unoptimized sizes="(max-width: 430px) 66vw, 290px" className="object-cover object-bottom" />
          </div>
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-white via-white/85 to-white/20" />
        </>
      )}

      <div className={`relative z-10 flex justify-between items-center w-full ${isSquare ? 'mb-3' : 'mb-6'}`}>
        <div className="flex items-center gap-3 min-w-0">
          {section.icon && (
            <div className={`flex shrink-0 items-center justify-center rounded-2xl ${theme.iconTileBg} ${isSquare ? 'h-9 w-9' : 'h-11 w-11'} ${theme.iconColor}`}>
              {section.icon}
            </div>
          )}
          <div className="min-w-0">
            <h2 className={`font-semibold tracking-tight truncate ${isSquare ? 'text-base leading-tight' : 'text-lg sm:text-xl'}`}>{section.title}</h2>
            <div className={`mt-2 h-1 rounded-full ${theme.dashColor} ${isSquare ? 'w-6' : 'w-8'}`} />
          </div>
        </div>
        {mapUrl && (
          <div className={`shrink-0 rounded-full flex items-center gap-1.5 px-4 py-2 transition-transform group-hover:-translate-y-0.5 ${theme.actionBg}`}>
            <span className={`text-[13px] font-medium ${theme.actionIcon}`}>
              Ouvrir dans Maps
            </span>
            <ArrowUpRight className={`w-4 h-4 ${theme.actionIcon} group-hover:rotate-45 transition-transform`} />
          </div>
        )}
      </div>

      {(section.photoUrl || section.videoUrl) && (
        <div className="relative z-10 mb-6 flex flex-col gap-3">
          {section.photoUrl && (
            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-[24px]">
              <Image src={section.photoUrl} alt={section.title} fill unoptimized sizes="(max-width: 430px) 100vw, 430px" className="object-contain" />
            </div>
          )}
          {section.videoUrl && <YouTubeEmbed url={section.videoUrl} title={section.title} className="rounded-[24px]" />}
        </div>
      )}

      <div className={`relative z-10 flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] text-[15px] sm:text-[16px] leading-relaxed flex flex-col justify-end ${section.format === 'wifi' ? '' : getMarkdownTextStyles(theme.isDark)}`}>
        {renderValue(section)}
      </div>
    </section>
  )

  if (mapUrl) {
    return (
      <a href={mapUrl} target="_blank" rel="noopener noreferrer" className={`block ${wrapperClasses}`}>
        {CardContent}
      </a>
    )
  }

  return (
    <div className={wrapperClasses}>
      {CardContent}
    </div>
  )
}

type Section = {
  key: string
  title: string
  icon: React.ReactNode
  value: string | null
  hasValue: boolean
  format: 'markdown' | 'plain' | 'address' | 'wifi'
  mapsLocation?: string | null
  isSquare?: boolean
  photoUrl?: string | null
  videoUrl?: string | null
  backgroundImage?: string | null
  bins?: TrashBin[]
  theme: Theme
}

function buildSections(row: any): Section[] {
  const has = (v: string | null | undefined) => Boolean(v && v.trim().length > 0)
  const wifiCombined = row && (has(row.wifi_ssid) || has(row.wifi_password))
    ? `${row.wifi_ssid ?? '—'}|${row.wifi_password ?? '—'}` : null
  const bins: TrashBin[] = Array.isArray(row?.trash_bins) ? row.trash_bins : []

  return [
    { key: 'address', title: 'Adresse', icon: <MapPin className="h-6 w-6" />, value: row?.lodging_address ?? null, hasValue: has(row?.lodging_address), format: 'address', backgroundImage: '/fallback/fallback-transport.png', theme: themes.light },
    { key: 'presentation-video', title: 'Vidéo du logement', icon: <Video className="h-6 w-6" />, value: null, hasValue: has(row?.presentation_video_url), format: 'plain', videoUrl: row?.presentation_video_url ?? null, theme: themes.light },
    { key: 'wifi', title: 'Réseau Wi-Fi', icon: <Wifi className="h-6 w-6" />, value: wifiCombined, hasValue: Boolean(wifiCombined), format: 'wifi', theme: themes.light },
    { key: 'parking', title: 'Parking', icon: <Car className="h-6 w-6" />, value: row?.parking_info ?? null, hasValue: has(row?.parking_info) || has(row?.parking_photo_url) || has(row?.parking_video_url), format: 'markdown', photoUrl: row?.parking_photo_url ?? null, videoUrl: row?.parking_video_url ?? null, theme: themes.light },
    { key: 'checkout', title: 'Départ', icon: <LogOut className="h-6 w-6" />, value: row?.checkout_instructions ?? null, hasValue: has(row?.checkout_instructions), format: 'markdown', theme: themes.light },
    { key: 'trash', title: 'Poubelles', icon: null, value: null, hasValue: (bins.length > 0) || has(row?.trash_location), format: 'markdown', mapsLocation: row?.trash_location ?? null, bins, theme: themes.light },
    { key: 'equipment', title: 'Équipements', icon: <Settings className="h-6 w-6" />, value: row?.equipment_info ?? null, hasValue: has(row?.equipment_info), format: 'markdown', theme: themes.light },
    { key: 'rules', title: 'Règlement', icon: <Scroll className="h-6 w-6" />, value: row?.house_rules ?? null, hasValue: has(row?.house_rules), format: 'markdown', theme: themes.light },
    { key: 'services', title: 'Services', icon: <Sparkles className="h-6 w-6" />, value: row?.useful_services ?? null, hasValue: has(row?.useful_services), format: 'markdown', theme: themes.light },
    { key: 'emergency', title: 'Urgences', icon: <PhoneCall className="h-6 w-6" />, value: row?.emergency_contacts ?? null, hasValue: has(row?.emergency_contacts), format: 'markdown', theme: themes.red, isSquare: true },
  ]
}

function capitalizeWords(value: string): string {
  return value.replace(/\p{L}[\p{L}'’-]*/gu, word => word.charAt(0).toUpperCase() + word.slice(1))
}

function buildMapsUrl(value: string): string {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed) && /(google\.[a-z]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(trimmed)) return trimmed
  return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}`
}

function renderValue(section: Section) {
  if (section.key === 'trash') {
    const bins = section.bins ?? []
    if (bins.length === 0) return null
    return (
      <div className="flex flex-col gap-4">
        {bins.map(bin => {
          const preset = getTrashBin(bin.type)
          return (
            <div key={bin.type} className="flex items-start gap-3">
              <Trash2 className={`h-9 w-9 shrink-0 ${preset?.colorClass ?? ''}`} />
              <div>
                <p className="text-[15px] sm:text-base font-bold leading-tight">{preset?.label ?? bin.type}</p>
                <p className="text-[13px] sm:text-[14px] leading-snug opacity-70">{preset?.hint ?? ''}</p>
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (!section.value) return null

  if (section.key === 'emergency') {
    return <p className="text-4xl  font-extrabold leading-none tracking-tighter">{section.value}</p>
  }

  if (section.format === 'address') {
    const lines = section.value
      .split(',')
      .map(part => part.trim())
      .filter(Boolean)
      // Capitalise uniquement la ligne ville (celle qui porte le code postal).
      .map(line => (/\d{4,6}/.test(line) ? capitalizeWords(line) : line))
    return (
      <div className="font-medium text-[15px] sm:text-base leading-snug space-y-0.5">
        {lines.map((line, i) => (
          <p key={i}>{line}</p>
        ))}
      </div>
    )
  }

  if (section.format === 'wifi') {
    const [ssid, password] = section.value.split('|')
    return <WifiCredentials ssid={ssid ?? null} password={password ?? null} />
  }

  if (section.format === 'markdown') {
    return <MarkdownText source={section.value} />
  }

  return <p>{section.value}</p>
}
