import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, ExternalLink, Home, MapPin } from 'lucide-react'
import { getPageOwner } from '@/features/dashboard-owner/lib/get-page-owner'
import { LodgingShowcaseForm } from '@/features/lodging-showcase/components/LodgingShowcaseForm'
import { publicLodgingPath } from '@/features/lodging-showcase/lib/public-paths'
import { getOwnedLodgingShowcasePageData } from '@/features/lodging-showcase/queries/owner-public-profile'
import { getLodgingPrivateAddress } from '@/features/guide-customization/queries/customization'

interface Props {
  params: Promise<{ id: string }>
}

// Spec 079 : page « Logement » (fiche publique du logement), organisée comme la page Guide.
export default async function LodgingShowcasePage({ params }: Props) {
  const owner = await getPageOwner()
  const { id } = await params
  const data = await getOwnedLodgingShowcasePageData(owner.id, id)

  if (!data) {
    notFound()
    return null
  }

  const privateAddress = await getLodgingPrivateAddress(data.lodging.id)
  const publicPath = data.profile.publication_status === 'published' && data.profile.slug
    ? publicLodgingPath(data.profile.slug)
    : null

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <Link
        href="/dashboard/lodgings"
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-gray-400 transition-colors hover:text-[#0B1437]"
      >
        <ArrowLeft size={12} />
        Mes logements
      </Link>

      <header className="flex flex-col justify-between gap-6 rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm sm:p-8 md:flex-row md:items-center">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Logement</p>
          <h1 className="mt-2 flex items-center gap-3 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">
            <Home size={26} strokeWidth={2.2} className="text-[#0B1437]" aria-hidden="true" />
            {data.lodging.name}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm leading-relaxed text-gray-500">
            <span className="inline-flex items-center gap-1.5 rounded-lg bg-[#F4F7FE] px-2.5 py-1 text-[11px] font-semibold text-[#0B1437]">
              <MapPin size={11} />
              {data.lodging.city.name}
            </span>
            La fiche publique de votre logement sur MyStay, référencée sur Google.
          </p>
        </div>

        {publicPath ? (
          <Link
            href={publicPath}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-[13px] font-bold text-[#0B1437] shadow-sm transition-all hover:border-[#0B1437]/30 hover:bg-gray-50"
          >
            <ExternalLink size={14} aria-hidden="true" />
            Voir la fiche publique
          </Link>
        ) : null}
      </header>

      <LodgingShowcaseForm
        lodgingId={data.lodging.id}
        initialProfile={data.profile}
        cityName={data.lodging.city.name}
        privateAddress={{ value: privateAddress, editHref: `/dashboard/lodgings/${data.lodging.id}/customize#logement` }}
      />
    </div>
  )
}
