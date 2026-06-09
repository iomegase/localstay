import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { AdminEventsLauncher } from '@/features/events-acquisition/components/AdminEventsLauncher'
import { listEvents } from '@/features/events-acquisition/queries/events'

export default async function AdminEventsPage() {
  await getPageAdmin()
  const events = await listEvents()

  return (
    <div className="w-full space-y-6">
      <header>
        <h1 className="text-xl font-semibold">Sorties culturelles & manifestations</h1>
        <p className="text-sm text-gray-500">
          Récupérez les manifestations d'une commune de Haute-Savoie. Le cron quotidien
          rafraîchit automatiquement les communes déjà présentes.
        </p>
      </header>

      <AdminEventsLauncher />

      <div className="overflow-x-auto rounded-xl border border-gray-200/60">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-500">
            <tr>
              <th className="px-3 py-2">Titre</th>
              <th className="px-3 py-2">Commune</th>
              <th className="px-3 py-2">Début</th>
              <th className="px-3 py-2">Fin</th>
              <th className="px-3 py-2">Types</th>
            </tr>
          </thead>
          <tbody>
            {events.map((e) => (
              <tr key={e.id} className="border-t border-gray-100">
                <td className="px-3 py-2">{e.title}</td>
                <td className="px-3 py-2">{e.commune_name}</td>
                <td className="px-3 py-2">{e.start_date.toISOString().slice(0, 10)}</td>
                <td className="px-3 py-2">{e.end_date.toISOString().slice(0, 10)}</td>
                <td className="px-3 py-2">{e.event_types.join(', ')}</td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-gray-400">
                  Aucun événement. Lancez une récupération ci-dessus.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
