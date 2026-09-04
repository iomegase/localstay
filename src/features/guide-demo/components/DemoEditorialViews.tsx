'use client'

import {
  ArrowLeft,
  BedDouble,
  MapPin,
  Scan,
  ShowerHead,
  SlidersHorizontal,
  Users,
} from 'lucide-react'
import { LodgingEssentials } from '@/features/lodging-showcase/components/LodgingEssentials'
import { LodgingFeatureSections } from '@/features/lodging-showcase/components/LodgingFeatureSections'
import { LodgingMarketingGallery } from '@/features/lodging-showcase/components/LodgingMarketingGallery'
import { LodgingRoomsGrid } from '@/features/lodging-showcase/components/LodgingRoomsGrid'
import {
  marketingContainerClass,
  marketingPrimaryButtonClass,
} from '@/features/marketing/components/marketing-styles'
import type {
  DemoBlogPost,
  DemoContact,
  DemoLodgingCard,
} from '@/features/guide-demo/types'

type DemoLodgingsViewProps = {
  lodgings: readonly DemoLodgingCard[]
  onOpenLodging: (lodging: DemoLodgingCard) => void
}

type DemoLodgingDetailViewProps = {
  lodging: DemoLodgingCard
  onBack: () => void
}

type DemoBlogViewProps = {
  posts: readonly DemoBlogPost[]
  onOpenPost: (post: DemoBlogPost) => void
}

type DemoBlogDetailViewProps = {
  post: DemoBlogPost
  onBack: () => void
}

type DemoContactViewProps = {
  contact: DemoContact
}

function DemoContentImage({ alt, src }: { alt: string; src: string }) {
  const fallback = '/marketing/demo-lodging-1.webp'

  return (
    // The fixture-only sources are allowed by the demo media policy; the fallback is local.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={event => {
        if (event.currentTarget.src !== new URL(fallback, window.location.origin).href) {
          event.currentTarget.src = fallback
        }
      }}
      className="h-full w-full object-cover"
    />
  )
}

export function DemoLodgingsView({
  lodgings,
  onOpenLodging,
}: DemoLodgingsViewProps) {
  const resultLabel = `${lodgings.length} ${lodgings.length > 1 ? 'logements' : 'logement'}`

  return (
    <section className="min-h-full bg-white px-4 pb-32 pt-14">
      <div className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.2em] text-slate-500">
        <span aria-hidden="true" className="h-0.5 w-5 shrink-0 bg-pink-600" />
        Les logements confiés à MyStay
      </div>
      <h1
        data-demo-view-heading="true"
        tabIndex={-1}
        className="mt-10 max-w-[360px] text-[38px] font-bold leading-[1.02] tracking-[-0.055em] text-slate-900"
      >
        Des lieux suivis avec attention.
      </h1>
      <p className="mt-12 max-w-[360px] text-[15px] leading-7 text-slate-500">
        Chaque logement est accompagné par notre conciergerie et dispose de son propre guide d’arrivée MyStay.
      </p>

      {lodgings.length === 0 ? (
        <p className="mt-16 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
          Aucun logement public n’est disponible pour le moment.
        </p>
      ) : (
        <>
          <div className="mt-16 flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2.5 rounded-full bg-slate-900 py-3 pl-5 pr-6 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)]">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filtrer
            </span>
            <span className="text-xs font-bold text-slate-500">{resultLabel}</span>
          </div>

          <div className="mt-9 grid gap-7">
            {lodgings.map(lodging => (
              <button
                key={lodging.id}
                type="button"
                data-testid="demo-lodging-card"
                aria-label={`Voir ${lodging.title}`}
                onClick={() => onOpenLodging(lodging)}
                className="group overflow-hidden rounded-[26px] bg-white text-left shadow-[0_18px_48px_rgba(15,23,42,0.10)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-600"
              >
                <span className="block aspect-[4/3] overflow-hidden bg-slate-100">
                  <DemoContentImage alt={lodging.photos[0]?.alt ?? lodging.title} src={lodging.coverPhotoUrl} />
                </span>
                <span className="block px-6 pb-5 pt-6">
                  <span className="block text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
                    {lodging.publicAreaLabel || lodging.cityName}
                  </span>
                  <span className="mt-2 block text-xl font-bold tracking-[-0.035em] text-slate-800">
                    {lodging.title}
                  </span>
                  <span className="mt-3 block text-xs leading-5 text-slate-500">
                    {lodging.shortDescription}
                  </span>
                  <span className="mt-5 grid grid-cols-2 border-t border-slate-200 text-slate-800">
                    <DemoPropertyStat
                      icon={Scan}
                      label="Surface"
                      value={lodging.surfaceM2 === null ? '—' : `${lodging.surfaceM2} m²`}
                    />
                    <DemoPropertyStat icon={Users} label="Voyageurs" value={String(lodging.maxGuests)} borderLeft />
                    <DemoPropertyStat
                      icon={BedDouble}
                      label="Chambres"
                      value={lodging.bedroomCount === null ? '—' : String(lodging.bedroomCount)}
                      borderTop
                    />
                    <DemoPropertyStat
                      icon={ShowerHead}
                      label="Salles de bain"
                      value={lodging.bathroomCount === null ? '—' : String(lodging.bathroomCount)}
                      borderLeft
                      borderTop
                    />
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function DemoPropertyStat({
  borderLeft = false,
  borderTop = false,
  icon: Icon,
  label,
  value,
}: {
  borderLeft?: boolean
  borderTop?: boolean
  icon: typeof Scan
  label: string
  value: string
}) {
  return (
    <span
      className={`flex min-h-[74px] items-center gap-3 py-3 ${borderLeft ? 'border-l border-slate-200 pl-4' : 'pr-3'} ${borderTop ? 'border-t border-slate-200' : ''}`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50">
        <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
      </span>
      <span>
        <span className="block text-[8px] text-slate-500">{label}</span>
        <span className="block text-xs font-bold">{value}</span>
      </span>
    </span>
  )
}

export function DemoLodgingDetailView({
  lodging,
  onBack,
}: DemoLodgingDetailViewProps) {
  const descriptionParagraphs = lodging.description
    .split(/\n\s*\n/)
    .map(paragraph => paragraph.trim())
    .filter(Boolean)
  const amenities = [...lodging.amenitiesIncluded, ...lodging.amenitiesOnRequest]
  const photos = lodging.photos.map((photo, index) => ({
    id: `${lodging.id}-photo-${index}`,
    url: photo.url,
    alt: photo.alt,
    room_type: photo.roomType ?? null,
    room_label: photo.roomLabel ?? null,
    sort_order: index,
    is_cover: index === 0,
  }))

  return (
    <article className="min-h-full overflow-hidden bg-white pb-32 font-sans text-slate-800">
      <header className={`${marketingContainerClass} pb-8 pt-9`}>
        <button
          type="button"
          onClick={onBack}
          className="group flex w-fit items-center text-[10px] font-bold uppercase tracking-wide text-slate-500 transition-colors hover:text-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-600"
        >
          <ArrowLeft className="mr-1.5 h-4 w-4 transition-transform group-hover:-translate-x-1" aria-hidden="true" strokeWidth={2} />
          Tous les logements
        </button>

        <div className="mt-8">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
            {lodging.publicAreaLabel || lodging.cityName}
          </p>
          <h1
            data-demo-view-heading="true"
            tabIndex={-1}
            className="mt-3 text-[42px] font-semibold leading-[0.98] tracking-[-0.055em] text-slate-800"
          >
            {lodging.title}
          </h1>
          <p className="mt-4 flex items-center text-[14px] font-medium text-slate-500">
            <MapPin className="mr-2 h-4 w-4 shrink-0 text-pink-600" aria-hidden="true" strokeWidth={2} />
            {lodging.propertyType} à {lodging.cityName}
          </p>
        </div>
      </header>

      <LodgingMarketingGallery title={lodging.title} photos={photos} compact />

      <LodgingEssentials
        title={lodging.title}
        maxGuests={lodging.maxGuests}
        bedroomCount={lodging.bedroomCount}
        bathroomCount={lodging.bathroomCount}
        surfaceM2={lodging.surfaceM2}
        amenities={amenities}
        compact
      />

      <section
        data-testid="lodging-story"
        className={`${marketingContainerClass} grid gap-12 py-16`}
      >
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
            Le logement
          </span>
          <h2 className="mt-4 text-[16px] font-semibold leading-[1.7] tracking-[-0.01em] text-slate-800">
            {lodging.shortDescription}
          </h2>
          <div className="mt-7 space-y-5">
            {descriptionParagraphs.map((paragraph, index) => (
              <p key={`${lodging.id}-description-${index}`} className="whitespace-pre-line text-justify text-[13px] leading-[1.85] text-slate-500">
                {paragraph}
              </p>
            ))}
          </div>
        </div>

        <aside data-testid="lodging-stay-card" className="rounded-[26px] bg-[#f8f7f5] p-7">
          <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
            Votre séjour
          </span>
          <h3 className="mt-3 text-[26px] font-semibold tracking-[-0.04em] text-slate-800">
            {lodging.title}
          </h3>
          <p className="mt-6 text-[13px] leading-relaxed text-slate-500">
            {lodging.propertyType} · {lodging.maxGuests} {lodging.maxGuests > 1 ? 'voyageurs' : 'voyageur'}
          </p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-500">
            {lodging.publicAreaLabel || lodging.cityName}
          </p>
          <button
            type="button"
            disabled
            aria-disabled="true"
            className={`${marketingPrimaryButtonClass} mt-7 w-full cursor-default`}
          >
            Contacter
          </button>
        </aside>
      </section>

      <LodgingFeatureSections
        includedAmenities={[...lodging.amenitiesIncluded]}
        onRequestAmenities={[...lodging.amenitiesOnRequest]}
        compact
      />

      <div className={`${marketingContainerClass} pb-16`}>
        <LodgingRoomsGrid photos={photos} compact />
      </div>
    </article>
  )
}

export function DemoBlogView({ posts, onOpenPost }: DemoBlogViewProps) {
  return (
    <section className="min-h-full bg-white px-4 pb-32 pt-6">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-pink-600">
        Le journal MyStay
      </p>
      <h1
        data-demo-view-heading="true"
        tabIndex={-1}
        className="mt-2 text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-900"
      >
        Blog
      </h1>
      {posts.length === 0 ? (
        <p className="mt-8 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
          Aucun article public n’est disponible pour le moment.
        </p>
      ) : (
        <div className="mt-6 grid gap-4">
          {posts.map(post => (
            <button
              key={post.id}
              type="button"
              data-testid="demo-blog-card"
              aria-label={`Lire ${post.title}`}
              onClick={() => onOpenPost(post)}
              className="overflow-hidden rounded-[24px] border border-slate-100 text-left shadow-[0_6px_22px_rgba(15,23,42,0.08)]"
            >
              <span className="block aspect-[16/9] overflow-hidden bg-slate-100">
                <DemoContentImage alt={`Illustration de ${post.title}`} src={post.coverUrl} />
              </span>
              <span className="block p-4">
                <span className="block text-xs font-semibold uppercase tracking-wide text-pink-600">
                  {post.categoryLabel} · {post.cityName}
                </span>
                <span className="mt-1 block text-xl font-semibold tracking-[-0.03em] text-slate-900">{post.title}</span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">{post.excerpt}</span>
                <span className="mt-4 inline-block rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                  Lire {post.title}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export function DemoBlogDetailView({ post, onBack }: DemoBlogDetailViewProps) {
  const blocks = post.contentMarkdown.split(/\n{2,}/).filter(Boolean)

  return (
    <article className="min-h-full bg-white px-4 pb-32 pt-4">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-slate-700">
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour au blog
      </button>
      <div className="mt-2 aspect-[16/9] overflow-hidden rounded-[28px] bg-slate-100">
        <DemoContentImage alt={`Illustration de ${post.title}`} src={post.coverUrl} />
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-pink-600">{post.categoryLabel} · {post.cityName}</p>
      <h1
        data-demo-view-heading="true"
        tabIndex={-1}
        className="mt-2 text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-900"
      >
        {post.title}
      </h1>
      <div className="mt-6 space-y-4 text-sm leading-7 text-slate-700">
        {blocks.map(block =>
          block.startsWith('## ') ? (
            <h2 key={block} className="text-xl font-semibold text-slate-900">{block.slice(3)}</h2>
          ) : (
            <p key={block}>{block}</p>
          ),
        )}
      </div>
    </article>
  )
}

export function DemoContactView({ contact }: DemoContactViewProps) {
  return (
    <section className="min-h-full bg-white px-4 pb-32 pt-6">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-pink-600">Contact fictif</p>
      <h1
        data-demo-view-heading="true"
        tabIndex={-1}
        className="mt-2 text-4xl font-bold leading-[1.08] tracking-[-0.04em] text-slate-900"
      >
        Votre hôte
      </h1>
      <div className="mt-6 rounded-[28px] bg-slate-50 p-6">
        <p className="text-xl font-semibold text-slate-900">{contact.hostName}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Hôte de <span>{contact.lodgingName}</span>, à <span>{contact.cityName}</span>.
        </p>
        <p className="mt-4 text-sm leading-6 text-slate-600">{contact.responseLabel}</p>
        <button type="button" disabled aria-disabled="true" className="mt-6 w-full cursor-not-allowed rounded-full bg-slate-300 px-4 py-3 text-sm font-semibold text-slate-600">
          Envoyer un message
        </button>
      </div>
    </section>
  )
}
