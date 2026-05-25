import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getTrailAcquisitionOptions } from '@/features/trails-acquisition/queries/options'
import { AdminManualTrailForm } from '@/features/trails-acquisition/components/AdminManualTrailForm'

export default async function AdminNewTrailPage() {
  await getPageAdmin()
  const options = await getTrailAcquisitionOptions()

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">Saisie manuelle</p>
        <h1 className="mt-2 text-3xl font-semibold text-white">Créer une randonnée</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">
          La saisie crée un candidat en revue. La publication publique reste une action Super-admin séparée.
        </p>
      </div>
      <AdminManualTrailForm cities={options.cities} />
    </div>
  )
}
