import { redirect } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  ArrowUpRight,
  Car,
  Clock3,
  Info,
  LogOut,
  MapPin,
  PhoneCall,
  ScrollText,
  Settings,
  Sparkles,
  Trash2,
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
import { LodgingSectionNav } from './_components/LodgingSectionNav'
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

const CARD = 'rounded-[24px] border border-slate-200/80 bg-white shadow-[0_10px_30px_rgba(23,35,56,0.07)]'
const BODY = 'text-[14px] leading-7 text-slate-600 [&_h1,&_h2,&_h3,&_h4,&_strong]:text-slate-900 [&_a]:text-blue-600'

export default async function LeLogementPage() {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) redirect('/')

  const [customization, practicalBlocks] = await Promise.all([
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
      <div className="bg-[#f7f9fc] px-5 py-10">
        <div className={`${CARD} flex flex-col items-center p-10 text-center`}>
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

  return (
    <div className="-mt-6 bg-[#f7f9fc] px-4 pb-10 pt-4 text-slate-900">
      <div className="space-y-3">
        {customization?.cover_photo_url && (
          <div className="relative aspect-[16/10] overflow-hidden rounded-[26px] shadow-[0_18px_42px_rgba(23,35,56,0.14)]">
            <Image
              src={customization.cover_photo_url}
              alt={lodgingContext.lodgingName}
              fill
              priority
              unoptimized
              sizes="(max-width: 430px) 100vw, 430px"
              className="object-cover"
            />
          </div>
        )}

        <div className={`${CARD} bg-gradient-to-br from-blue-50 via-white to-white p-6`}>
          <span className="inline-flex rounded-full bg-blue-100 px-4 py-2 text-xs font-bold text-blue-700">Votre guide de séjour</span>
          <h1 className="mt-5 text-[48px] font-light leading-none tracking-[-0.06em] text-[#172338]">{lodgingContext.lodgingName}</h1>
          <p className="mt-4 flex items-center gap-2 text-sm font-semibold text-slate-500">
            <MapPin className="h-5 w-5 text-blue-600" strokeWidth={1.8} />
            {lodgingContext.cityName}
          </p>
          <div className="my-5 h-px bg-slate-200" />
          {mapUrl && (
            <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-6 inline-flex min-h-12 items-center gap-3 rounded-2xl bg-blue-600 px-5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(37,99,235,0.28)]">
              <ArrowUpRight className="h-5 w-5" />
              Voir l’itinéraire
            </a>
          )}
        </div>
      </div>

      <div className="mt-4 grid gap-3">
        <FactCard testId="arrival-fact" icon={<Clock3 className="h-5 w-5" />} label="Arrivée" value="À partir de 16 h" color="blue" />
        <FactCard testId="departure-fact" icon={<LogOut className="h-5 w-5" />} label="Départ" value="10 h" color="amber" />
      </div>

      <LodgingSectionNav />

      <GuideSection id="bienvenue" number="01" eyebrow="Bienvenue" title="Votre séjour commence ici">
        <div className="grid gap-2">
          <SectionShortcut href="#infos-pratiques" label="Préparer mon arrivée" detail="Adresse, parking et connexion" color="amber" />
          <SectionShortcut href="#bon-a-savoir" label="Découvrir le logement" detail="Équipements et conseils" color="green" />
          <SectionShortcut href="#depart" label="Anticiper mon départ" detail="Consignes et tri" color="pink" />
        </div>
      </GuideSection>

      <GuideSection id="infos-pratiques" number="02" eyebrow="Infos pratiques" title="Tout ce qu’il faut, au bon moment">
        <div className="grid gap-3">
          {customization?.lodging_address && (
            <InfoCard icon={<MapPin className="h-5 w-5" />} title="Adresse" color="blue">
              <p>{customization.lodging_address}</p>
              {mapUrl && <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex items-center gap-2 font-bold text-blue-600">Ouvrir dans Maps <ArrowUpRight className="h-4 w-4" /></a>}
            </InfoCard>
          )}
          {customization?.presentation_video_url && (
            <InfoCard icon={<Video className="h-5 w-5" />} title="Vidéo du logement" color="pink">
              <YouTubeEmbed url={customization.presentation_video_url} title="Vidéo du logement" className="mt-4 rounded-[18px]" />
            </InfoCard>
          )}
          {(has(customization?.parking_info) || has(customization?.parking_photo_url) || has(customization?.parking_video_url)) && (
            <InfoCard icon={<Car className="h-5 w-5" />} title="Parking" color="amber">
              {customization?.parking_info && <MarkdownText source={customization.parking_info} />}
              {customization?.parking_photo_url && <MediaImage src={customization.parking_photo_url} alt="Parking" />}
              {customization?.parking_video_url && <YouTubeEmbed url={customization.parking_video_url} title="Parking" className="mt-4 rounded-[18px]" />}
            </InfoCard>
          )}
          {hasWifi && (
            <InfoCard icon={<Wifi className="h-5 w-5" />} title="Réseau Wi-Fi" color="green">
              <WifiCredentials ssid={customization?.wifi_ssid ?? null} password={customization?.wifi_password ?? null} />
            </InfoCard>
          )}
          {customization?.house_rules && <MarkdownInfoCard icon={<ScrollText className="h-5 w-5" />} title="Règlement" value={customization.house_rules} color="blue" />}
          {customization?.useful_services && <MarkdownInfoCard icon={<Sparkles className="h-5 w-5" />} title="Services" value={customization.useful_services} color="amber" />}
          {customization?.emergency_contacts && (
            <InfoCard icon={<PhoneCall className="h-5 w-5" />} title="Urgences" color="pink" dark>
              <div data-testid="lodging-emergency-number" className="text-[56px] font-extrabold leading-none text-white">{customization.emergency_contacts}</div>
            </InfoCard>
          )}
        </div>
      </GuideSection>

      <GuideSection id="bon-a-savoir" number="03" eyebrow="Bon à savoir" title="Les détails qui font la différence">
        <div className="grid gap-3">
          {customization?.equipment_info && <MarkdownInfoCard icon={<Settings className="h-5 w-5" />} title="Équipements" value={customization.equipment_info} color="green" />}
          {practicalBlocks.map(block => <PracticalBlockCard key={block.id} block={block} />)}
        </div>
      </GuideSection>

      <GuideSection id="depart" number="04" eyebrow="Départ" title="Quelques gestes avant de partir">
        <div className="grid gap-3">
          {customization?.checkout_instructions && (
            <InfoCard icon={<LogOut className="h-5 w-5" />} title="Départ" color="blue">
              {checklistItems.length > 0
                ? <DepartureChecklist items={checklistItems} />
                : <MarkdownText source={customization.checkout_instructions} />}
            </InfoCard>
          )}
          {(trashBins.length > 0 || customization?.trash_location) && (
            <InfoCard icon={<Trash2 className="h-5 w-5" />} title="Poubelles" color="green">
              <div className="space-y-4">
                {trashBins.map(bin => {
                  const preset = getTrashBin(bin.type)
                  return (
                    <div key={bin.type} className="flex items-start gap-3">
                      <Trash2 className={`h-8 w-8 shrink-0 ${preset?.colorClass ?? 'text-slate-500'}`} />
                      <div><p className="font-bold text-slate-800">{preset?.label}</p><p className="text-xs text-slate-500">{preset?.hint}</p></div>
                    </div>
                  )
                })}
              </div>
              {trashMapUrl && <a href={trashMapUrl} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 font-bold text-white">Voir le point de tri <MapPin className="h-4 w-4" /></a>}
            </InfoCard>
          )}
        </div>
      </GuideSection>
    </div>
  )
}

function GuideSection({ id, number, eyebrow, title, children }: { id: string; number: string; eyebrow: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-36 py-12">
      <div className="mb-6 flex items-start gap-3">
        <span className="grid h-8 min-w-10 place-items-center rounded-full bg-blue-100 text-[11px] font-extrabold text-blue-700">{number}</span>
        <div><p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-blue-600">{eyebrow}</p><h2 className="mt-1 text-[30px] font-light leading-[1.05] tracking-[-0.04em] text-[#172338]">{title}</h2></div>
      </div>
      {children}
    </section>
  )
}

function FactCard({ icon, label, value, color, testId }: { icon: React.ReactNode; label: string; value: string; color: Accent; testId?: string }) {
  return <div data-testid={testId} className={`${CARD} grid min-h-[76px] grid-cols-[44px_1fr_auto] items-center gap-3 px-4`}><IconTile color={color}>{icon}</IconTile><strong className="text-sm">{label}</strong><span className="text-right text-sm font-bold text-slate-500">{value}</span></div>
}

function SectionShortcut({ href, label, detail, color }: { href: string; label: string; detail: string; color: Accent }) {
  return <a href={href} className={`${CARD} grid min-h-[78px] grid-cols-[44px_1fr_auto] items-center gap-3 px-4`}><IconTile color={color}><Info className="h-5 w-5" /></IconTile><span><strong className="block text-sm">{label}</strong><small className="text-xs text-slate-500">{detail}</small></span><ArrowRight className="h-4 w-4 text-slate-400" /></a>
}

type Accent = 'blue' | 'amber' | 'green' | 'pink'
const ACCENTS: Record<Accent, string> = { blue: 'bg-blue-100 text-blue-700', amber: 'bg-amber-100 text-amber-700', green: 'bg-emerald-100 text-emerald-700', pink: 'bg-rose-100 text-rose-600' }

function IconTile({ color, children }: { color: Accent; children: React.ReactNode }) {
  return <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${ACCENTS[color]}`}>{children}</span>
}

function InfoCard({ icon, title, color, dark = false, children }: { icon: React.ReactNode; title: string; color: Accent; dark?: boolean; children: React.ReactNode }) {
  return <article className={`${CARD} p-5 ${dark ? 'border-rose-500 bg-gradient-to-br from-rose-500 to-orange-400 text-white' : ''}`}><div className="flex items-center gap-3"><IconTile color={color}>{icon}</IconTile><h3 className={`text-lg font-semibold ${dark ? 'text-white' : 'text-slate-900'}`}>{title}</h3></div><div className={`mt-5 ${dark ? 'text-white' : BODY}`}>{children}</div></article>
}

function MarkdownInfoCard({ icon, title, value, color }: { icon: React.ReactNode; title: string; value: string; color: Accent }) {
  return <InfoCard icon={icon} title={title} color={color}><MarkdownText source={value} /></InfoCard>
}

function PracticalBlockCard({ block }: { block: PracticalBlock }) {
  return <article className={`${CARD} overflow-hidden p-5`}><div className="flex items-center gap-3"><IconTile color="pink"><CategoryIcon iconSlug={block.icon} className="h-5 w-5" /></IconTile><h3 className="text-lg font-semibold">{block.title}</h3></div>{block.photo_url && <MediaImage src={block.photo_url} alt={block.title} />}{block.video_url && <YouTubeEmbed url={block.video_url} title={block.title} className="mt-4 rounded-[18px]" />}{block.body && <div className={`mt-5 ${BODY}`}><MarkdownText source={block.body} /></div>}</article>
}

function MediaImage({ src, alt }: { src: string; alt: string }) {
  return <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-[18px]"><Image src={src} alt={alt} fill unoptimized sizes="(max-width: 430px) 100vw, 430px" className="object-cover" /></div>
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
