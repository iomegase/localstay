import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import type { EventType } from '@/features/events-acquisition/types'
import { getCityAgenda } from '@/features/events-public/queries/agenda'
import { EventCard } from '@/features/events-public/components/EventCard'
import { EventTypeFilter } from '@/features/events-public/components/EventTypeFilter'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'
import { requireActiveLodgingContext } from '@/features/public-menu/lib/private-stay-guard'

interface Props {
  params: Promise<{ 'city-slug': string }>
  searchParams?: Promise<{ type?: string; lodging?: string }>
}

const VALID_TYPES: EventType[] = ['cultural', 'sport', 'market', 'festival', 'social', 'other']

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'city-slug': slug } = await params
  return privatePageMetadata(`Agenda des sorties — ${slug}`)
}

export default async function AgendaPage({ params, searchParams }: Props) {
  const { 'city-slug': slug } = await params
  await requireActiveLodgingContext(slug)
  const sp = (await searchParams) ?? {}
  const type = VALID_TYPES.includes(sp.type as EventType) ? (sp.type as EventType) : undefined
  const lodging = sp.lodging

  const agenda = await getCityAgenda(slug, { type })
  if (!agenda) {
    notFound()
    return null
  }

  return (
    <>
      <div className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-pink-600">Le guide</p>
        <h1 className="text-2xl font-light uppercase text-charcoal">Sorties &amp; manifestations</h1>
      </div>

      <EventTypeFilter facets={agenda.facets} />

      {agenda.items.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-4 px-8 py-16 text-center">
          <p className="text-sm leading-relaxed text-gray-500">Aucune sortie à venir pour le moment.</p>
          <Link
            href={`/guide/${slug}`}
            className="text-xs font-bold uppercase tracking-widest text-pink-600 underline underline-offset-4"
          >
            Retour au guide
          </Link>
        </div>
      ) : (
        <section className="mt-4 flex flex-col gap-3 px-4 pb-10">
          {agenda.items.map((event) => (
            <EventCard key={event.id} event={event} citySlug={slug} lodgingId={lodging} />
          ))}
        </section>
      )}
    </>
  )
}
