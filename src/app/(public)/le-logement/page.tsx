import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Wifi, Car, Settings, LogOut, Trash2, Scroll, PhoneCall, Sparkles, ArrowUpRight } from 'lucide-react'
import { prisma } from '@/shared/lib/prisma'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { LodgingPager } from '@/features/public-menu/components/LodgingPager'
import { YouTubeEmbed } from '@/shared/components/YouTubeEmbed'

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
  actionBg: string
  actionIcon: string
  isDark: boolean
}

const themes: Record<'slate' | 'light' | 'red', Theme> = {
  slate: { 
    bg: 'bg-[#8FA3B5]', 
    text: 'text-white', 
    muted: 'text-white/70', 
    actionBg: 'bg-white', 
    actionIcon: 'text-[#8FA3B5]',
    isDark: true 
  },
  light: { 
    bg: 'bg-white', 
    text: 'text-[#1A1D1F]', 
    muted: 'text-[#6F767E]', 
    actionBg: 'bg-[#F4F5F6]', 
    actionIcon: 'text-[#1A1D1F]',
    isDark: false 
  },
  red: {
    bg: 'bg-red-500', 
    text: 'text-white', 
    muted: 'text-white/80', 
    actionBg: 'bg-white', 
    actionIcon: 'text-red-500',
    isDark: true 
  }
}

export default async function LeLogementPage() {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) redirect('/')

  // 🚀 OPTIMISATION : Requêtes parallèles pour diviser le temps d'attente par 2
  const [customization, practicalBlocks] = await Promise.all([
    prisma.lodgingCustomization.findFirst({
      where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
      select: {
        cover_photo_url: true, presentation_video_url: true,
        lodging_address: true, wifi_ssid: true, wifi_password: true,
        parking_info: true, parking_photo_url: true, parking_video_url: true,
        equipment_info: true, checkout_instructions: true, trash_info: true, trash_location: true,
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
  const hasFixed = sections.some(section => section.hasValue)
  const hasBlocks = practicalBlocks.length > 0
  const hasContent = hasFixed || hasBlocks

  const presentationPhoto = customization?.cover_photo_url ?? null
  const presentationVideo = customization?.presentation_video_url ?? null
  const hasPresentation = Boolean(presentationPhoto || presentationVideo)

  return (
    <div className="pt-8 bg-[#F4F5F6] min-h-screen pb-20 flex flex-col">
      <div className="mb-10 px-4">
        <p className="text-[14px] font-medium tracking-tight text-[#6F767E] mb-1">
          Bienvenue au
        </p>
        <h1 className="text-[36px] font-bold leading-none tracking-tighter text-[#1A1D1F]">
          {lodgingContext.lodgingName}
        </h1>
      </div>

      {hasPresentation && (
        <section className="mb-10 flex flex-col gap-4 px-4">
          {presentationPhoto && (
            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-[24px]">
              <Image src={presentationPhoto} alt="Présentation du logement" fill unoptimized sizes="(max-width: 430px) 100vw, 430px" className="object-cover" />
            </div>
          )}
          {presentationVideo && <YouTubeEmbed url={presentationVideo} title="Présentation du logement" />}
        </section>
      )}

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
      ) : !hasBlocks ? (
        <div className="flex flex-wrap gap-4 px-4 pb-10">
          {sections.filter(s => s.hasValue).map((section) => (
            <PracticalCard key={section.key} section={section} />
          ))}
        </div>
      ) : (
        <LodgingPager titles={['Quelques conseils & consignes', 'À découvrir']}>
          <div className="flex flex-wrap gap-4 px-4 pb-10">
            {hasFixed ? (
              sections.filter(s => s.hasValue).map((section) => (
                <PracticalCard key={section.key} section={section} />
              ))
            ) : (
              <div className="w-full flex items-center justify-center rounded-[40px] bg-white p-10 text-center text-sm font-medium text-[#6F767E]">
                Aucune information renseignée.
              </div>
            )}
          </div>

          <div className="flex flex-col gap-4 pb-10 px-4">
            {practicalBlocks.map((block, index) => {
              const theme = index % 2 === 0 ? themes.light : themes.slate
              return <PracticalBlockCard key={block.id} block={block} theme={theme} />
            })}
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
    <section className={`w-full rounded-[40px] p-6 sm:p-8 flex flex-col shadow-sm transition-transform hover:scale-[1.01] ${theme.bg} ${theme.text}`}>
      <div className="flex justify-between items-start mb-6">
        <CategoryIcon iconSlug={block.icon} className={`h-8 w-8 ${theme.muted}`} />
      </div>

      {/* 🚀 OPTIMISATION : Aspect 2/1 pour éviter l'écrasement de l'image (comme sur vos maquettes) */}
      {block.photo_url && (
        <div className="relative mb-6 aspect-[2/1] w-full overflow-hidden rounded-[24px]">
          <Image src={block.photo_url} alt={block.title} fill unoptimized sizes="(max-width: 430px) 100vw, 430px" className="object-cover" />
        </div>
      )}

      {block.video_url && (
        <div className="mb-6">
          <YouTubeEmbed url={block.video_url} title={block.title} />
        </div>
      )}

      {/* 🚀 OPTIMISATION : Tailles de texte réduites pour plus d'élégance (14px / 15px) */}
      {block.body && (
        <div className={`text-[14px] sm:text-[15px] leading-relaxed mb-8 flex-1 ${getMarkdownTextStyles(theme.isDark)}`}>
          <MarkdownText source={block.body} />
        </div>
      )}

      <div className="mt-auto pt-2">
        <h2 className="font-bold text-[28px] tracking-tight">{block.title}</h2>
      </div>
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

  const innerClasses = `relative group rounded-[32px] sm:rounded-[40px] p-6 sm:p-8 flex flex-col shadow-sm transition-transform hover:scale-[1.02] ${theme.bg} ${theme.text} h-full w-full`

  const CardContent = (
    <section className={innerClasses}>
      <div className={`flex justify-between items-start w-full ${isSquare ? 'mb-3' : 'mb-6'}`}>
        <div className={theme.muted}>
          {section.icon}
        </div>
        {mapUrl && (
          <div className={`shrink-0 rounded-full flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 transition-colors ${theme.actionBg}`}>
            <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest ${theme.actionIcon}`}>
              Google Maps
            </span>
            <ArrowUpRight className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${theme.actionIcon} group-hover:rotate-45 transition-transform`} />
          </div>
        )}
      </div>

      {(section.photoUrl || section.videoUrl) && (
        <div className="mb-6 flex flex-col gap-3">
          {section.photoUrl && (
            <div className="relative aspect-[2/1] w-full overflow-hidden rounded-[24px]">
              <Image src={section.photoUrl} alt={section.title} fill unoptimized sizes="(max-width: 430px) 100vw, 430px" className="object-cover" />
            </div>
          )}
          {section.videoUrl && <YouTubeEmbed url={section.videoUrl} title={section.title} />}
        </div>
      )}

      {/* 🚀 OPTIMISATION : Tailles de texte harmonisées avec les grandes cartes */}
      <div className={`flex-1 overflow-y-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] text-[14px] sm:text-[15px] leading-relaxed flex flex-col justify-end ${isSquare ? 'mb-3' : 'mb-6'} ${getMarkdownTextStyles(theme.isDark)}`}>
        {renderValue(section)}
      </div>

      <div className="mt-auto">
        <h2 className={`font-bold tracking-tight ${isSquare ? 'text-lg leading-tight' : 'text-xl sm:text-2xl'}`}>{section.title}</h2>
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
  theme: Theme
}

function buildSections(row: any): Section[] {
  const has = (v: string | null | undefined) => Boolean(v && v.trim().length > 0)
  const wifiCombined = row && (has(row.wifi_ssid) || has(row.wifi_password))
    ? `${row.wifi_ssid ?? '—'}|${row.wifi_password ?? '—'}` : null

  return [
    { key: 'address', title: 'Adresse', icon: <MapPin className="h-7 w-7" />, value: row?.lodging_address ?? null, hasValue: has(row?.lodging_address), format: 'address', theme: themes.slate },
    { key: 'wifi', title: 'Réseau Wi-Fi', icon: <Wifi className="h-7 w-7" />, value: wifiCombined, hasValue: Boolean(wifiCombined), format: 'wifi', theme: themes.light },
    { key: 'parking', title: 'Parking', icon: <Car className="h-7 w-7" />, value: row?.parking_info ?? null, hasValue: has(row?.parking_info) || has(row?.parking_photo_url) || has(row?.parking_video_url), format: 'markdown', photoUrl: row?.parking_photo_url ?? null, videoUrl: row?.parking_video_url ?? null, theme: themes.slate },
    { key: 'checkout', title: 'Départ', icon: <LogOut className="h-7 w-7" />, value: row?.checkout_instructions ?? null, hasValue: has(row?.checkout_instructions), format: 'markdown', theme: themes.light },
    { key: 'trash', title: 'Poubelles', icon: <Trash2 className="h-7 w-7" />, value: row?.trash_info ?? null, hasValue: has(row?.trash_info) || has(row?.trash_location), format: 'markdown', mapsLocation: row?.trash_location ?? null, theme: themes.slate },
    { key: 'equipment', title: 'Équipements', icon: <Settings className="h-7 w-7" />, value: row?.equipment_info ?? null, hasValue: has(row?.equipment_info), format: 'markdown', theme: themes.light },
    { key: 'rules', title: 'Règlement', icon: <Scroll className="h-7 w-7" />, value: row?.house_rules ?? null, hasValue: has(row?.house_rules), format: 'markdown', theme: themes.slate },
    { key: 'services', title: 'Services', icon: <Sparkles className="h-7 w-7" />, value: row?.useful_services ?? null, hasValue: has(row?.useful_services), format: 'markdown', theme: themes.light },
    { key: 'emergency', title: 'Urgences', icon: <PhoneCall className="h-7 w-7" />, value: row?.emergency_contacts ?? null, hasValue: has(row?.emergency_contacts), format: 'markdown', theme: themes.red, isSquare: true },
  ]
}

function buildMapsUrl(value: string): string {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed) && /(google\.[a-z]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(trimmed)) return trimmed
  return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}`
}

function renderValue(section: Section) {
  if (!section.value) return null

  if (section.format === 'address') {
    return <p className="font-medium text-[15px] sm:text-base leading-snug">{section.value}</p>
  }

  if (section.format === 'wifi') {
    const [ssid, password] = section.value.split('|')
    return (
      <div className="flex flex-col gap-4">
        {ssid && ssid !== '—' && (
          <div className="flex flex-col">
            <p className={`text-[11px] uppercase tracking-widest font-bold mb-1 ${section.theme.muted}`}>Nom du réseau</p>
            <p className={`font-mono text-base sm:text-lg font-bold break-all ${section.theme.text}`}>{ssid}</p>
          </div>
        )}
        {password && password !== '—' && (
          <div className="flex flex-col">
            <p className={`text-[11px] uppercase tracking-widest font-bold mb-1 ${section.theme.muted}`}>Mot de passe</p>
            <p className={`font-mono text-base sm:text-lg font-bold break-all ${section.theme.text}`}>{password}</p>
          </div>
        )}
      </div>
    )
  }

  if (section.format === 'markdown') {
    return <MarkdownText source={section.value} />
  }

  return <p>{section.value}</p>
}