import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Wifi, Car, Settings, LogOut, Trash2, Scroll, PhoneCall, Sparkles, MoveRight } from 'lucide-react'
import { prisma } from '@/shared/lib/prisma'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { LodgingPager } from '@/features/public-menu/components/LodgingPager'

type PracticalBlock = {
  id: string
  title: string
  body: string | null
  icon: string
  photo_url: string | null
  sort_order: number
}

// Système de thèmes pour les backgrounds et éléments des cartes Bento
type Theme = {
  bg: string
  iconBg: string
  iconText: string
  btnBg: string
  btnText: string
}

const themes: Record<string, Theme> = {
  blue: { bg: 'bg-[#F0F5FF]', iconBg: 'bg-[#DCE6FF]', iconText: 'text-blue-600', btnBg: 'bg-blue-600', btnText: 'text-white' },
  violet: { bg: 'bg-[#F4F0FF]', iconBg: 'bg-[#E6DFFF]', iconText: 'text-violet-600', btnBg: 'bg-violet-600', btnText: 'text-white' },
  emerald: { bg: 'bg-[#EDFDF5]', iconBg: 'bg-[#D1FAE5]', iconText: 'text-emerald-600', btnBg: 'bg-emerald-600', btnText: 'text-white' },
  amber: { bg: 'bg-[#FFFBEB]', iconBg: 'bg-[#FEF3C7]', iconText: 'text-amber-600', btnBg: 'bg-amber-600', btnText: 'text-white' },
  rose: { bg: 'bg-[#FFF1F2]', iconBg: 'bg-[#FFE4E6]', iconText: 'text-rose-600', btnBg: 'bg-rose-600', btnText: 'text-white' },
  cyan: { bg: 'bg-[#ECFEFF]', iconBg: 'bg-[#CFFAFE]', iconText: 'text-cyan-600', btnBg: 'bg-cyan-600', btnText: 'text-white' },
  slate: { bg: 'bg-[#F8FAFC]', iconBg: 'bg-[#F1F5F9]', iconText: 'text-slate-600', btnBg: 'bg-slate-700', btnText: 'text-white' },
  orange: { bg: 'bg-[#FFF7ED]', iconBg: 'bg-[#FFEDD5]', iconText: 'text-orange-600', btnBg: 'bg-orange-600', btnText: 'text-white' },
}

// Thèmes dynamiques pour la page "À découvrir"
const blockThemes = [themes.emerald, themes.amber, themes.cyan, themes.violet, themes.blue]

export default async function LeLogementPage() {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) redirect('/')

  const customization = await prisma.lodgingCustomization.findFirst({
    where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
    select: {
      lodging_address: true,
      wifi_ssid: true,
      wifi_password: true,
      parking_info: true,
      equipment_info: true,
      checkout_instructions: true,
      trash_info: true,
      trash_location: true,
      house_rules: true,
      emergency_contacts: true,
      useful_services: true,
    },
  })

  const practicalBlocks: PracticalBlock[] = await prisma.lodgingPracticalBlock.findMany({
    where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
    orderBy: { sort_order: 'asc' },
    select: { id: true, title: true, body: true, icon: true, photo_url: true, sort_order: true },
  })

  const sections = buildSections(customization)
  const hasFixed = sections.some(section => section.hasValue)
  const hasBlocks = practicalBlocks.length > 0
  const hasContent = hasFixed || hasBlocks

  return (
    <div className="pt-6">
      {/* Header mis à jour avec plus de hiérarchie */}
      <div className="mb-8 px-5">
        <div className="flex items-center gap-2 mb-2">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-gray-400">Le logement</p>
        </div>
        <h1 className="font-serif italic text-[32px] leading-tight text-charcoal">{lodgingContext.lodgingName}</h1>
        <p className="mt-1 text-sm font-medium text-gray-500">{lodgingContext.cityName}</p>
      </div>

      {!hasContent ? (
        <div className="mx-5 rounded-[28px] border-2 border-dashed border-gray-100 bg-gray-50/50 p-8 text-center text-sm text-gray-500 shadow-sm">
          Votre hôte n&apos;a pas encore renseigné d&apos;informations pratiques.
          <div className="mt-6">
            <Link
              href={`/guide/${lodgingContext.citySlug}`}
              className="inline-flex items-center justify-center rounded-2xl bg-charcoal px-6 py-3 text-xs font-bold uppercase tracking-widest text-white shadow-md transition-transform hover:scale-105"
            >
              Voir le guide
            </Link>
          </div>
        </div>
      ) : !hasBlocks ? (
        <div className="grid grid-cols-2 gap-3 grid-flow-dense px-5 pb-10">
          {sections.filter(s => s.hasValue).map(section => (
            <PracticalCard key={section.key} section={section} />
          ))}
        </div>
      ) : (
        <>
          {/* Signal visuel fort pour indiquer qu'il y a 2 pages */}
          {hasFixed && (
            <div className="mx-5 mb-6 flex items-center justify-between rounded-[20px] bg-charcoal px-5 py-4 text-white shadow-lg ring-1 ring-charcoal/5">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="h-1.5 w-4 rounded-full bg-white"></span>
                  <span className="h-1.5 w-1.5 rounded-full bg-white/30"></span>
                </div>
                <span className="text-xs font-semibold tracking-wide">Naviguez entre les sections</span>
              </div>
              <MoveRight className="h-4 w-4 animate-pulse text-white/60" />
            </div>
          )}

          <LodgingPager titles={['Infos pratiques', 'À découvrir']}>
            {/* Page 1 */}
            <div className="grid grid-cols-2 gap-3 grid-flow-dense pb-10">
              {hasFixed ? (
                sections.filter(s => s.hasValue).map(section => (
                  <PracticalCard key={section.key} section={section} />
                ))
              ) : (
                <div className="col-span-2 rounded-[28px] border-2 border-dashed border-gray-100 bg-gray-50 p-8 text-center text-sm text-gray-500">
                  Aucune info pratique renseignée.
                </div>
              )}
            </div>

            {/* Page 2 */}
            <div className="grid grid-cols-2 gap-3 grid-flow-dense pb-10">
              {practicalBlocks.map((block, index) => (
                <PracticalBlockCard key={block.id} block={block} theme={blockThemes[index % blockThemes.length]} />
              ))}
            </div>
          </LodgingPager>
        </>
      )}
    </div>
  )
}

function PracticalBlockCard({ block, theme }: { block: PracticalBlock, theme: Theme }) {
  return (
    <section className={`col-span-2 rounded-[32px] border border-white/50 p-6 shadow-sm flex flex-col transition-all hover:shadow-md ${theme.bg}`}>
      <div className="flex items-center gap-4 mb-5">
        <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[20px] ${theme.iconBg} ${theme.iconText}`}>
          <CategoryIcon iconSlug={block.icon} className="h-7 w-7" />
        </span>
        <h2 className="font-semibold text-xl text-charcoal leading-tight tracking-tight">{block.title}</h2>
      </div>
      {block.photo_url && (
        <div className="relative mb-5 aspect-[16/9] w-full overflow-hidden rounded-2xl shadow-sm">
          <Image src={block.photo_url} alt={block.title} fill unoptimized sizes="(max-width: 430px) 100vw, 430px" className="object-cover" />
        </div>
      )}
      {block.body && (
        <div className="text-sm leading-relaxed text-charcoal/80">
          <MarkdownText source={block.body} />
        </div>
      )}
    </section>
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
  mapsCtaLabel?: string
  bentoSpan: string
  theme: Theme
}

type CustomizationRow = {
  lodging_address: string | null
  wifi_ssid: string | null
  wifi_password: string | null
  parking_info: string | null
  equipment_info: string | null
  checkout_instructions: string | null
  trash_info: string | null
  trash_location: string | null
  house_rules: string | null
  emergency_contacts: string | null
  useful_services: string | null
} | null

function buildSections(row: CustomizationRow): Section[] {
  const has = (v: string | null | undefined) => Boolean(v && v.trim().length > 0)
  const wifiCombined = row && (has(row.wifi_ssid) || has(row.wifi_password))
    ? `${row.wifi_ssid ?? '—'}|${row.wifi_password ?? '—'}`
    : null

  return [
    {
      key: 'address',
      title: 'Adresse',
      icon: <MapPin className="h-5 w-5" />,
      value: row?.lodging_address ?? null,
      hasValue: has(row?.lodging_address),
      format: 'address',
      bentoSpan: 'col-span-2',
      theme: themes.blue,
    },
    {
      key: 'wifi',
      title: 'Wi-Fi',
      icon: <Wifi className="h-5 w-5" />,
      value: wifiCombined,
      hasValue: Boolean(wifiCombined),
      format: 'wifi',
      bentoSpan: 'col-span-1',
      theme: themes.violet,
    },
    {
      key: 'trash',
      title: 'Poubelles',
      icon: <Trash2 className="h-5 w-5" />,
      value: row?.trash_info ?? null,
      hasValue: has(row?.trash_info) || has(row?.trash_location),
      format: 'markdown',
      mapsLocation: row?.trash_location ?? null,
      mapsCtaLabel: 'Ouvrir dans Maps',
      bentoSpan: 'col-span-1',
      theme: themes.emerald,
    },
    {
      key: 'parking',
      title: 'Parking',
      icon: <Car className="h-5 w-5" />,
      value: row?.parking_info ?? null,
      hasValue: has(row?.parking_info),
      format: 'markdown',
      bentoSpan: 'col-span-2',
      theme: themes.amber,
    },
    {
      key: 'equipment',
      title: 'Équipements',
      icon: <Settings className="h-5 w-5" />,
      value: row?.equipment_info ?? null,
      hasValue: has(row?.equipment_info),
      format: 'markdown',
      bentoSpan: 'col-span-2',
      theme: themes.slate,
    },
    {
      key: 'checkout',
      title: 'Départ',
      icon: <LogOut className="h-5 w-5" />,
      value: row?.checkout_instructions ?? null,
      hasValue: has(row?.checkout_instructions),
      format: 'markdown',
      bentoSpan: 'col-span-2',
      theme: themes.rose,
    },
    {
      key: 'rules',
      title: 'Règlement',
      icon: <Scroll className="h-5 w-5" />,
      value: row?.house_rules ?? null,
      hasValue: has(row?.house_rules),
      format: 'markdown',
      bentoSpan: 'col-span-2',
      theme: themes.orange,
    },
    {
      key: 'emergency',
      title: 'Urgences',
      icon: <PhoneCall className="h-5 w-5" />,
      value: row?.emergency_contacts ?? null,
      hasValue: has(row?.emergency_contacts),
      format: 'markdown',
      bentoSpan: 'col-span-1',
      theme: themes.rose,
    },
    {
      key: 'services',
      title: 'Services',
      icon: <Sparkles className="h-5 w-5" />,
      value: row?.useful_services ?? null,
      hasValue: has(row?.useful_services),
      format: 'markdown',
      bentoSpan: 'col-span-1',
      theme: themes.cyan,
    },
  ]
}

function PracticalCard({ section }: { section: Section }) {
  const { theme, bentoSpan } = section
  const titleClass = bentoSpan === 'col-span-1' ? 'text-base' : 'text-xl'

  return (
    <section className={`rounded-[32px] border border-white/50 p-5 shadow-sm flex flex-col transition-all hover:shadow-md ${bentoSpan} ${theme.bg}`}>
      <div className={`flex gap-3 mb-4 ${bentoSpan === 'col-span-1' ? 'flex-col items-start' : 'items-center'}`}>
        <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-[18px] ${theme.iconBg} ${theme.iconText}`}>
          {section.icon}
        </span>
        <h2 className={`font-semibold tracking-tight text-charcoal leading-tight ${titleClass}`}>
          {section.title}
        </h2>
      </div>
      
      <div className="text-[13px] leading-relaxed text-charcoal/80 flex-1 flex flex-col">
        {renderValue(section)}
      </div>

      {section.mapsLocation && section.mapsLocation.trim() !== '' && (
        <div className="pt-4 mt-auto">
          <a
            href={buildMapsUrl(section.mapsLocation)}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-transform hover:scale-[1.02] ${theme.btnBg} ${theme.btnText}`}
          >
            <MapPin className="h-3.5 w-3.5" />
            {section.mapsCtaLabel ?? 'Ouvrir dans Maps'}
          </a>
        </div>
      )}
    </section>
  )
}

function buildMapsUrl(value: string): string {
  const trimmed = value.trim()
  if (/^https?:\/\//i.test(trimmed) && /(google\.[a-z]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(trimmed)) {
    return trimmed
  }
  return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}`
}

function renderValue(section: Section) {
  if (!section.value) return null

  if (section.format === 'address') {
    const encoded = encodeURIComponent(section.value)
    return (
      <div className="flex flex-col h-full">
        <p className="flex-1 font-medium text-[15px]">{section.value}</p>
        <div className=" mt-auto">
          <a
            href={`https://www.google.com/maps?q=${encoded}`}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex w-full items-center justify-center gap-2 rounded-[16px] px-4 py-3.5 text-[11px] font-bold uppercase tracking-widest shadow-sm transition-transform hover:scale-[1.02] ${section.theme.btnBg} ${section.theme.btnText}`}
          >
            <MapPin className="h-4 w-4" />
            Ouvrir dans Maps
          </a>
        </div>
      </div>
    )
  }

  if (section.format === 'wifi') {
    const [ssid, password] = section.value.split('|')
    return (
      <dl className="space-y-4 font-mono text-[13px] mt-1">
        {ssid && ssid !== '—' && (
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] uppercase tracking-widest text-charcoal/50">Réseau</dt>
            <dd className={`font-semibold break-all text-sm ${section.theme.iconText}`}>{ssid}</dd>
          </div>
        )}
        {password && password !== '—' && (
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] uppercase tracking-widest text-charcoal/50">Mot de passe</dt>
            <dd className={`font-semibold break-all text-sm ${section.theme.iconText}`}>{password}</dd>
          </div>
        )}
      </dl>
    )
  }

  if (section.format === 'markdown') {
    return <MarkdownText source={section.value} />
  }

  return <p>{section.value}</p>
}