import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { listEquipmentTemplatesForAdmin } from '@/features/equipment-library/queries/library'
import { AdminEquipmentLibrary } from '@/features/equipment-library/components/AdminEquipmentLibrary'

// Spec 095 US-03 : bibliothèque des équipements proposés aux logements.
export default async function AdminEquipmentLibraryPage() {
  await getPageAdmin()
  const templates = await listEquipmentTemplatesForAdmin()

  return (
    <div className="w-full space-y-6">
      <header className="rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Guide des logements</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">Bibliothèque d’équipements</h1>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-gray-500">
          Équipements enregistrés par les propriétaires. Relisez-les (retirez codes, noms, téléphones), validez-les :
          ils seront proposés à tous les logements, qui en reçoivent une copie modifiable.
        </p>
      </header>
      <AdminEquipmentLibrary templates={templates} />
    </div>
  )
}
