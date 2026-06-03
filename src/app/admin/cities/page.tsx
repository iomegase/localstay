import Link from 'next/link'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminCities } from '@/features/admin/queries/dashboard'
import { AdminCityCreateButton } from '@/features/admin/components/AdminCityCreateButton'
import { MapPin, ArrowRight } from 'lucide-react'
import { CityQrCodeModalButton } from '@/features/admin/components/CityQrCodeModalButton'

const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  needs_enrichment: 'À enrichir',
}

// Mise à jour des styles pour correspondre au design minimaliste et "Premium"
const STATUS_STYLES = {
  active: 'bg-emerald-50/80 text-emerald-600 border-emerald-100/50',
  inactive: 'bg-gray-100/80 text-gray-500 border-gray-200/50',
  needs_enrichment: 'bg-amber-50 text-amber-600 border-amber-100/50',
}

export default async function AdminCitiesPage() {
  await getPageAdmin()
  const cities = await getAdminCities()

  return (
    <div className="w-full animate-in fade-in duration-500">
      
      {/* Header façon Carte Blanche (comme sur le dashboard) */}
      <header className="mb-8 flex flex-col gap-6 md:flex-row md:items-center justify-between rounded-[25px] border border-gray-50 bg-white p-8 shadow-sm">
        <div className="max-w-xl">
          <p className="text-xs font-semibold tracking-widest text-gray-400 uppercase">
            Villes
          </p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight text-neutral-900">
            Villes référencées
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Géocodage automatique via Mapbox à la création. Slug normalisé depuis le nom.
          </p>
        </div>
        <AdminCityCreateButton />
      </header>

      {/* Conteneur de la table avec les bords très arrondis */}
      <div className="w-full overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            
            <thead className="bg-white border-b border-gray-100">
              <tr>
                <th className="px-8 py-5 text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Ville & CP</th>
                <th className="px-6 py-5 text-center text-[11px] font-semibold tracking-widest text-gray-400 uppercase">POI actifs</th>
                <th className="px-6 py-5 text-center text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Logements</th>
                <th className="px-6 py-5 text-center text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Scans 30j</th>
                <th className="px-6 py-5 text-center text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Statut</th>
                <th className="px-8 py-5 text-right text-[11px] font-semibold tracking-widest text-gray-400 uppercase">Action</th>
              </tr>
            </thead>
            
            <tbody className="divide-y divide-gray-50/80 bg-white">
              {cities.length === 0 ? (
                <tr>
                  <td colSpan={6} className="h-48 text-center text-sm font-medium text-gray-400 bg-gray-50/30">
                    Aucune ville référencée pour le moment.
                  </td>
                </tr>
              ) : (
                cities.map((city) => (
                  <tr 
                    key={city.id} 
                    className="group transition-colors duration-200 hover:bg-gray-50/50"
                  >
                    {/* Colonne Ville & Icone */}
                    <td className="px-8 py-4">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#F4F7FE] text-[#0B1437] transition-transform duration-300 group-hover:scale-110">
                          <MapPin size={20} strokeWidth={2.5} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-neutral-900">{city.name}</span>
                          <span className="mt-0.5 text-xs font-semibold text-gray-400">{city.postal_code}</span>
                        </div>
                      </div>
                    </td>
                    
                    {/* Statistiques (Design épuré sans fond gris lourd) */}
                    <td className="px-6 py-4 text-center">
                      <span className="text-[15px] font-bold text-neutral-900">
                        {city.active_poi_count}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-[15px] font-bold text-neutral-900">
                        {city.active_lodging_count}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-center">
                      <span className="text-[15px] font-bold text-neutral-900">
                        {city.qr_scans_30d}
                      </span>
                    </td>

                    {/* Statut Badge */}
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex items-center rounded-lg border px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_STYLES[city.status_label as keyof typeof STATUS_STYLES] || 'border-gray-200 bg-gray-50 text-gray-600'}`}>
                        {STATUS_LABELS[city.status_label as keyof typeof STATUS_LABELS] || city.status_label}
                      </span>
                    </td>

                    {/* Action Bouton */}
                    <td className="px-8 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <CityQrCodeModalButton citySlug={city.slug} cityName={city.name} />
                        <Link
                          href={`/guide/${city.slug}`}
                          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4F7FE] px-5 py-2.5 text-[13px] font-bold text-[#0B1437] transition-all duration-300 hover:bg-[#0B1437] hover:text-white hover:shadow-md"
                        >
                          Voir le guide
                          <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}