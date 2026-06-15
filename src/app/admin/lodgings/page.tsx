import { Home } from 'lucide-react'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { AdminLodgingProfilesTable } from '@/features/lodging-showcase/components/AdminLodgingProfilesTable'
import { listAdminLodgingProfiles } from '@/features/lodging-showcase/queries/admin-public-profiles'
import { LodgingPublicationStatusSchema } from '@/features/lodging-showcase/schemas'

interface Props {
  searchParams?: Promise<{
    publication_status?: string
    city_id?: string
    owner_id?: string
  }>
}

export default async function AdminLodgingsPage({ searchParams }: Props) {
  await getPageAdmin()
  const params = (await searchParams) ?? {}
  const parsedStatus = params.publication_status
    ? LodgingPublicationStatusSchema.safeParse(params.publication_status)
    : null

  const rows = await listAdminLodgingProfiles({
    publication_status: parsedStatus?.success ? parsedStatus.data : undefined,
    city_id: params.city_id,
    owner_id: params.owner_id,
  })

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <div className="flex items-center gap-2 text-indigo-500">
          <Home className="h-4 w-4" />
          <p className="text-[10px] font-bold uppercase tracking-[0.25em]">Super-admin</p>
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Moderation logements</h1>
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-slate-500">
            Relisez les fiches publiques, surveillez la qualite SEO et pilotez les statuts de publication MyStay.
          </p>
        </div>
      </header>

      <AdminLodgingProfilesTable rows={rows} />
    </div>
  )
}
