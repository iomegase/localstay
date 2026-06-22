import { redirect } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Wifi, Car, Settings, LogOut, Trash2, Scroll, PhoneCall, Sparkles } from 'lucide-react'
import { prisma } from '@/shared/lib/prisma'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'

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

  const practicalBlocks = await prisma.lodgingPracticalBlock.findMany({
    where: { lodging_id: lodgingContext.lodgingId, deleted_at: null },
    orderBy: { sort_order: 'asc' },
    select: { id: true, title: true, body: true, icon: true, photo_url: true, sort_order: true },
  })

  const sections = buildSections(customization)
  const hasContent = sections.some(section => section.hasValue) || practicalBlocks.length > 0

  return (
    <div className="px-5 pt-4">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Le logement</p>
        <h1 className="mt-1 font-serif italic text-3xl text-charcoal">{lodgingContext.lodgingName}</h1>
        <p className="mt-1 text-sm text-gray-500">{lodgingContext.cityName}</p>
      </div>

      {!hasContent ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-6 text-center text-sm text-gray-500">
          Votre hôte n&apos;a pas encore renseigné d&apos;informations pratiques.
          <div className="mt-4">
            <Link
              href={`/guide/${lodgingContext.citySlug}`}
              className="inline-block rounded-full bg-charcoal px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
            >
              Voir le guide
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-4 pb-8">
          {sections.filter(s => s.hasValue).map(section => (
            <PracticalCard key={section.key} section={section} />
          ))}
          {practicalBlocks.map(block => (
            <section key={block.id} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-charcoal/5 text-charcoal">
                  <CategoryIcon iconSlug={block.icon} className="h-5 w-5" />
                </span>
                <div className="flex-1 pt-1">
                  <h2 className="font-serif italic text-lg text-charcoal">{block.title}</h2>
                  {block.photo_url && (
                    <div className="relative mt-3 aspect-[16/10] overflow-hidden rounded-xl">
                      <Image src={block.photo_url} alt={block.title} fill unoptimized sizes="(max-width: 430px) 100vw, 430px" className="object-cover" />
                    </div>
                  )}
                  {block.body && (
                    <div className="mt-2 text-sm leading-relaxed text-charcoal/70">
                      <MarkdownText source={block.body} />
                    </div>
                  )}
                </div>
              </div>
            </section>
          ))}
        </div>
      )}
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
  mapsCtaLabel?: string
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
      title: 'Adresse du logement',
      icon: <MapPin className="h-5 w-5" />,
      value: row?.lodging_address ?? null,
      hasValue: has(row?.lodging_address),
      format: 'address',
    },
    {
      key: 'wifi',
      title: 'Wi-Fi',
      icon: <Wifi className="h-5 w-5" />,
      value: wifiCombined,
      hasValue: Boolean(wifiCombined),
      format: 'wifi',
    },
    {
      key: 'parking',
      title: 'Parking',
      icon: <Car className="h-5 w-5" />,
      value: row?.parking_info ?? null,
      hasValue: has(row?.parking_info),
      format: 'markdown',
    },
    {
      key: 'equipment',
      title: 'Fonctionnement des équipements',
      icon: <Settings className="h-5 w-5" />,
      value: row?.equipment_info ?? null,
      hasValue: has(row?.equipment_info),
      format: 'markdown',
    },
    {
      key: 'checkout',
      title: 'Consignes de départ',
      icon: <LogOut className="h-5 w-5" />,
      value: row?.checkout_instructions ?? null,
      hasValue: has(row?.checkout_instructions),
      format: 'markdown',
    },
    {
      key: 'trash',
      title: 'Poubelles',
      icon: <Trash2 className="h-5 w-5" />,
      value: row?.trash_info ?? null,
      hasValue: has(row?.trash_info) || has(row?.trash_location),
      format: 'markdown',
      mapsLocation: row?.trash_location ?? null,
      mapsCtaLabel: 'Ouvrir le point de tri dans Maps',
    },
    {
      key: 'rules',
      title: 'Règlement intérieur',
      icon: <Scroll className="h-5 w-5" />,
      value: row?.house_rules ?? null,
      hasValue: has(row?.house_rules),
      format: 'markdown',
    },
    {
      key: 'emergency',
      title: 'Urgences',
      icon: <PhoneCall className="h-5 w-5" />,
      value: row?.emergency_contacts ?? null,
      hasValue: has(row?.emergency_contacts),
      format: 'markdown',
    },
    {
      key: 'services',
      title: 'Services utiles',
      icon: <Sparkles className="h-5 w-5" />,
      value: row?.useful_services ?? null,
      hasValue: has(row?.useful_services),
      format: 'markdown',
    },
  ]
}

function PracticalCard({ section }: { section: Section }) {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-charcoal/5 text-charcoal">
          {section.icon}
        </span>
        <div className="flex-1 pt-1">
          <h2 className="font-serif italic text-lg text-charcoal">{section.title}</h2>
          <div className="mt-2 text-sm leading-relaxed text-charcoal/70">
            {renderValue(section)}
            {section.mapsLocation && section.mapsLocation.trim() !== '' && (
              <a
                href={buildMapsUrl(section.mapsLocation)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-charcoal px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white shadow-sm transition-transform hover:-translate-y-0.5"
              >
                <MapPin className="h-3.5 w-3.5" />
                {section.mapsCtaLabel ?? 'Ouvrir dans Maps'}
              </a>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

function buildMapsUrl(value: string): string {
  const trimmed = value.trim()
  // Si c'est déjà une URL Maps (court ou long), on la prend telle quelle
  if (/^https?:\/\//i.test(trimmed) && /(google\.[a-z]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps)/i.test(trimmed)) {
    return trimmed
  }
  // Sinon on construit une recherche Google Maps depuis le texte (adresse)
  return `https://www.google.com/maps?q=${encodeURIComponent(trimmed)}`
}

function renderValue(section: Section) {
  if (!section.value) return null

  if (section.format === 'address') {
    const encoded = encodeURIComponent(section.value)
    return (
      <div className="space-y-2">
        <p>{section.value}</p>
        <a
          href={`https://www.google.com/maps?q=${encoded}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold hover:text-charcoal"
        >
          Ouvrir dans Maps
        </a>
      </div>
    )
  }

  if (section.format === 'wifi') {
    const [ssid, password] = section.value.split('|')
    return (
      <dl className="space-y-2 font-mono text-[13px]">
        {ssid && ssid !== '—' && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-charcoal/40 text-[10px] uppercase tracking-widest">Réseau</dt>
            <dd className="text-charcoal font-semibold">{ssid}</dd>
          </div>
        )}
        {password && password !== '—' && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-charcoal/40 text-[10px] uppercase tracking-widest">Mot de passe</dt>
            <dd className="text-charcoal font-semibold">{password}</dd>
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
