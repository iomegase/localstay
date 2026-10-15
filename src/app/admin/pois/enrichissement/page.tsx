import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { listDescriptionEnrichmentItems } from '@/features/admin-pois/queries/description-enrichment'
import { DescriptionEnrichmentQueue } from '@/features/admin-pois/components/DescriptionEnrichmentQueue'

export const dynamic = 'force-dynamic'

/** Spec 098 : enrichir en lot, avec relecture, les descriptions courtes des POI publiés. */
export default async function DescriptionEnrichmentPage() {
  await getPageAdmin()
  const items = await listDescriptionEnrichmentItems()

  return (
    <div className="w-full space-y-6">
      <header className="rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
        <Link href="/admin/pois" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-400 hover:text-gray-700">
          <ArrowLeft className="h-3 w-3" aria-hidden="true" />Backoffice POI
        </Link>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">Enrichir les descriptions</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
          Fiches publiées dont la description fait moins de 120 mots. Les propositions s’appuient sur le site officiel
          et, s’il est trop mince, sur une recherche web. Rien n’est publié sans votre relecture.
        </p>
      </header>
      <section className="rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
        <DescriptionEnrichmentQueue items={items} />
      </section>
    </div>
  )
}
