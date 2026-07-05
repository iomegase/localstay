import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Sparkles } from 'lucide-react'
import { getPageOwner } from '@/features/dashboard-owner/lib/get-page-owner'
import { LodgingShowcaseForm } from '@/features/lodging-showcase/components/LodgingShowcaseForm'
import { getOwnedLodgingShowcasePageData } from '@/features/lodging-showcase/queries/owner-public-profile'

interface Props {
  params: Promise<{ id: string }>
}

export default async function LodgingShowcasePage({ params }: Props) {
  const owner = await getPageOwner()
  const { id } = await params
  const data = await getOwnedLodgingShowcasePageData(owner.id, id)

  if (!data) {
    notFound()
    return null
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Link
        href="/dashboard/lodgings"
        className="inline-flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-charcoal"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux logements
      </Link>

      <header className="flex flex-col justify-between gap-6 rounded-2xl border border-gray-100 bg-white p-8 shadow-sm md:flex-row md:items-center">
        <div className="space-y-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-pink-600">Vitrine publique</p>
          <div>
            <h1 className="text-3xl font-light text-charcoal">{data.lodging.name}</h1>
            <p className="mt-2 text-sm text-gray-500">
              Construisez une fiche MyStay indexable pour {data.lodging.city.name}, avec une presentation premium et un lien de reservation externe.
            </p>
          </div>
        </div>

        <Link
          href={`/guide/${data.lodging.city.slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-gray-200 px-5 text-sm text-charcoal"
        >
          <ExternalLink className="h-4 w-4" />
          Ouvrir le guide
        </Link>
      </header>

      <div className="rounded-2xl border border-pink-600/20 bg-pink-600/5 p-4 text-sm leading-6 text-charcoal">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-pink-600" />
          <p>
            Cette fiche publique reste distincte de <code>/le-logement</code> : ici, l&apos;objectif est l&apos;acquisition SEO et la mise en valeur publique du logement.
          </p>
        </div>
      </div>

      <LodgingShowcaseForm lodgingId={data.lodging.id} initialProfile={data.profile} />
    </div>
  )
}
