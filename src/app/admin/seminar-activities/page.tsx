import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { listSeminarActivitiesForAdmin, listSeminarSurfaceOptions } from '@/features/seminar-activities/queries/admin'
import { AdminSeminarActivities } from '@/features/seminar-activities/components/AdminSeminarActivities'

// Spec 097 US-01 à US-05 : catalogue des activités séminaire.
export default async function AdminSeminarActivitiesPage() {
  await getPageAdmin()
  const [activities, surfaces] = await Promise.all([listSeminarActivitiesForAdmin(), listSeminarSurfaceOptions()])

  return (
    <div className="w-full space-y-6">
      <header className="rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Séminaires</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">Activités séminaire</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
          Le menu d’activités affiché en vitrine sur la page Séminaires et les landings séminaire. Une carte
          n’apparaît que si elle est publiée, illustrée et attribuée à la page. Les prix (HT, TVA 20 %) et les
          prestataires servent à préparer les devis : ils ne sont jamais publiés.
        </p>
      </header>
      <AdminSeminarActivities activities={activities} surfaces={surfaces} />
    </div>
  )
}
