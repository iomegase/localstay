import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminPoiOptions } from '@/features/admin-pois/queries/admin-pois'
import { listFallbackImages, type FallbackImageListFilter } from '@/features/fallback-images/queries/library'
import { AdminFallbackImageLibrary } from '@/features/fallback-images/components/AdminFallbackImageLibrary'
import { FallbackImageListQuerySchema } from '@/features/fallback-images/lib/api'

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

// Spec 070 US-01 : médiathèque des images de remplacement.
export default async function AdminFallbackImagesPage({ searchParams }: PageProps) {
  await getPageAdmin()
  const params = await searchParams
  const parsed = FallbackImageListQuerySchema.safeParse(
    Object.fromEntries(Object.entries(params).flatMap(([key, value]) => (typeof value === 'string' ? [[key, value]] : []))),
  )
  const filter: FallbackImageListFilter = parsed.success ? parsed.data : {}
  const [images, options] = await Promise.all([listFallbackImages(filter), getAdminPoiOptions()])

  return (
    <div className="w-full space-y-6">
      <header className="rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Médiathèque</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">Images de remplacement</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
          Images affichées pour les lieux sans photo. Classez-les par sous-catégorie (ou par catégorie) :
          chaque lieu reçoit l’image la moins utilisée de sa ville, sans doublon tant qu’il y en a assez.
        </p>
      </header>
      <AdminFallbackImageLibrary
        images={images}
        categories={options.categories.map(category => ({
          id: category.id,
          name: category.name,
          subcategories: (category.subcategories ?? []).map(subcategory => ({ id: subcategory.id, name: subcategory.name })),
        }))}
        filter={filter}
      />
    </div>
  )
}
