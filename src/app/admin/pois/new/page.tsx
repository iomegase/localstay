import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { AdminManualPoiForm } from '@/features/poi-acquisition/components/AdminManualPoiForm'
import { getManualPoiFormOptions } from '@/features/poi-acquisition/queries/manual-poi'

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminNewPoiPage({ searchParams }: PageProps = {}) {
  await getPageAdmin()
  const options = await getManualPoiFormOptions()
  const params = searchParams ? await searchParams : {}
  const initialCityId = typeof params.city_id === 'string' ? params.city_id : undefined

  return (
    <div className="w-full animate-in fade-in duration-500 space-y-6">
      
      {/* Header Section */}
      <header className="flex flex-col justify-between gap-6 rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
            Saisie manuelle
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
            Créer un POI
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Création super-admin avec géocodage Mapbox et détection de doublon avant publication.
          </p>
        </div>
      </header>

      {/* Form Section */}
      <div className="rounded-[25px] border border-gray-50 bg-white shadow-sm">
        <AdminManualPoiForm
          cities={options.cities}
          categories={options.categories}
          initialCityId={initialCityId}
        />
      </div>
    </div>
  )
}
