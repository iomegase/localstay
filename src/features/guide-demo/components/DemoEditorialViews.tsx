'use client'

import { ArrowLeft, Bath, BedDouble, MapPin, Maximize, Users } from 'lucide-react'
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
  return (
    <section className="min-h-full bg-white px-4 pb-32 pt-6">
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-pink-600">
        Sélection MyStay
      </p>
      <h1
        data-demo-view-heading="true"
        tabIndex={-1}
        className="mt-2 font-serif text-4xl italic tracking-[-0.04em] text-[#121212]"
      >
        Nos logements
      </h1>
      <p className="mt-2 text-sm leading-6 text-slate-600">
        Découvrez les logements actuellement publiés par MyStay.
      </p>

      {lodgings.length === 0 ? (
        <p className="mt-8 rounded-3xl bg-slate-50 p-5 text-sm text-slate-600">
          Aucun logement public n’est disponible pour le moment.
        </p>
      ) : (
        <div className="mt-6 grid gap-4">
          {lodgings.map(lodging => (
            <button
              key={lodging.id}
              type="button"
              data-testid="demo-lodging-card"
              aria-label={`Voir ${lodging.title}`}
              onClick={() => onOpenLodging(lodging)}
              className="overflow-hidden rounded-[24px] border border-slate-100 bg-white text-left shadow-[0_6px_22px_rgba(15,23,42,0.08)]"
            >
              <span className="block aspect-[16/9] overflow-hidden bg-slate-100">
                <DemoContentImage alt={lodging.photos[0]?.alt ?? lodging.title} src={lodging.coverPhotoUrl} />
              </span>
              <span className="block p-4">
                <span className="block text-xs font-semibold uppercase tracking-wide text-pink-600">
                  {lodging.propertyType} · {lodging.cityName}
                </span>
                <span className="mt-1 block text-xl font-semibold tracking-[-0.03em] text-slate-900">
                  {lodging.title}
                </span>
                <span className="mt-2 block text-sm leading-6 text-slate-600">
                  {lodging.shortDescription}
                </span>
                <span className="mt-4 inline-block rounded-full bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white">
                  Voir {lodging.title}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </section>
  )
}

export function DemoLodgingDetailView({
  lodging,
  onBack,
}: DemoLodgingDetailViewProps) {
  return (
    <article className="min-h-full bg-white px-4 pb-32 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 rounded-full px-2 py-2 text-sm font-semibold text-slate-700"
      >
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Retour aux logements
      </button>
      <div className="mt-2 aspect-[16/9] overflow-hidden rounded-[28px] bg-slate-100">
        <DemoContentImage alt={lodging.photos[0]?.alt ?? lodging.title} src={lodging.coverPhotoUrl} />
      </div>
      <p className="mt-5 text-xs font-bold uppercase tracking-[0.14em] text-pink-600">
        {lodging.propertyType} · {lodging.cityName}
      </p>
      <h1
        data-demo-view-heading="true"
        tabIndex={-1}
        className="mt-2 font-serif text-4xl italic tracking-[-0.04em] text-[#121212]"
      >
        {lodging.title}
      </h1>
      <p className="mt-3 text-sm leading-6 text-slate-600">{lodging.description}</p>

      <dl className="mt-6 grid grid-cols-2 gap-3 text-sm">
        <DemoFact icon={Users} label="Voyageurs" value={String(lodging.maxGuests)} />
        {lodging.bedroomCount !== null ? (
          <DemoFact icon={BedDouble} label="Chambres" value={String(lodging.bedroomCount)} />
        ) : null}
        {lodging.bathroomCount !== null ? (
          <DemoFact icon={Bath} label="Salles de bain" value={String(lodging.bathroomCount)} />
        ) : null}
        {lodging.surfaceM2 !== null ? (
          <DemoFact icon={Maximize} label="Surface" value={`${lodging.surfaceM2} m²`} />
        ) : null}
      </dl>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-900">Localisation</h2>
        <p className="mt-2 flex items-start gap-2 text-sm leading-6 text-slate-600">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-pink-600" aria-hidden="true" />
          {lodging.publicAreaLabel}
        </p>
      </section>

      <section className="mt-6">
        <h2 className="text-xl font-semibold text-slate-900">Galerie</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          {lodging.photos.map(photo => (
            <div key={photo.url} className="aspect-square overflow-hidden rounded-2xl bg-slate-100">
              <DemoContentImage alt={photo.alt} src={photo.url} />
            </div>
          ))}
        </div>
      </section>

      <Amenities title="Équipements inclus" values={lodging.amenitiesIncluded} />
      <Amenities title="Sur demande" values={lodging.amenitiesOnRequest} emptyLabel="Aucun équipement supplémentaire dans cette démonstration." />
    </article>
  )
}

function DemoFact({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Users
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <dt className="flex items-center gap-1.5 text-xs text-slate-500">
        <Icon className="h-4 w-4 text-pink-600" aria-hidden="true" />
        {label}
      </dt>
      <dd className="mt-1 text-base font-semibold text-slate-900">{value}</dd>
    </div>
  )
}

function Amenities({
  emptyLabel,
  title,
  values,
}: {
  emptyLabel?: string
  title: string
  values: readonly string[]
}) {
  return (
    <section className="mt-6">
      <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
      {values.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">{emptyLabel ?? 'Aucun équipement.'}</p>
      ) : (
        <ul className="mt-3 flex flex-wrap gap-2">
          {values.map(value => (
            <li key={value} className="rounded-full bg-pink-50 px-3 py-1.5 text-sm text-pink-800">
              {value}
            </li>
          ))}
        </ul>
      )}
    </section>
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
        className="mt-2 font-serif text-4xl italic tracking-[-0.04em] text-[#121212]"
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
        className="mt-2 font-serif text-4xl italic tracking-[-0.04em] text-[#121212]"
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
        className="mt-2 font-serif text-4xl italic tracking-[-0.04em] text-[#121212]"
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
