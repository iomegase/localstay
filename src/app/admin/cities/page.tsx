import Link from 'next/link'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getAdminCities } from '@/features/admin/queries/dashboard'
import { MapPin, ArrowRight } from 'lucide-react'

const STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  needs_enrichment: 'À enrichir',
}

const STATUS_STYLES = {
  active: 'bg-emerald-50 text-emerald-600 border-emerald-100',
  inactive: 'bg-slate-50 text-slate-500 border-slate-200',
  needs_enrichment: 'bg-amber-50 text-amber-600 border-amber-200',
}

export default async function AdminCitiesPage() {
  await getPageAdmin()
  const cities = await getAdminCities()

  return (
    <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="px-6 py-8 md:px-10">
        <div className="group">
          <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500">
            Villes
          </p>
          <h1 className="mt-1 text-3xl md:text-4xl font-bold tracking-tight text-slate-900 transition-colors">
            Villes référencées
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-500">
            Consultation uniquement : aucune création ni refresh Gemini dans 016.
          </p>
        </div>
      </header>

      <div className="w-full overflow-x-auto">
        <table className="w-full text-left whitespace-nowrap">
          <thead className="border-y border-slate-100 bg-slate-50">
            <tr>
              <th className="px-6 py-5 text-[13px] font-semibold tracking-wide text-slate-500 md:px-10">Ville & CP</th>
              <th className="px-6 py-5 text-center text-[13px] font-semibold tracking-wide text-slate-500">POI actifs</th>
              <th className="px-6 py-5 text-center text-[13px] font-semibold tracking-wide text-slate-500">Logements</th>
              <th className="px-6 py-5 text-center text-[13px] font-semibold tracking-wide text-slate-500">Scans 30j</th>
              <th className="px-6 py-5 text-center text-[13px] font-semibold tracking-wide text-slate-500">Statut</th>
              <th className="px-6 py-5 text-right text-[13px] font-semibold tracking-wide text-slate-500 md:px-10">Guide</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50 bg-white">
            {cities.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-48 bg-slate-50/50 text-center text-sm font-medium text-slate-500">
                  Aucune ville référencée pour le moment.
                </td>
              </tr>
            ) : (
              cities.map((city) => (
                <tr 
                  key={city.id} 
                  className="group transition-all duration-300 hover:bg-slate-50/50 hover:shadow-[0_2px_10px_rgb(0,0,0,0.02)]"
                >
                  <td className="px-6 py-5 md:px-10">
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 transition-all duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm">
                        <MapPin size={20} strokeWidth={2} />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[15px] font-bold text-slate-800">{city.name}</span>
                        <span className="mt-0.5 text-xs font-medium text-slate-400">{city.postal_code}</span>
                      </div>
                    </div>
                  </td>
                  
                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex min-w-[3rem] items-center justify-center rounded-xl bg-slate-50 px-3 py-1.5 text-[15px] font-bold text-slate-700 transition-colors duration-300 group-hover:bg-white group-hover:text-amber-600 group-hover:shadow-sm">
                      {city.active_poi_count}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex min-w-[3rem] items-center justify-center rounded-xl bg-slate-50 px-3 py-1.5 text-[15px] font-bold text-slate-700 transition-colors duration-300 group-hover:bg-white group-hover:text-emerald-600 group-hover:shadow-sm">
                      {city.active_lodging_count}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <span className="inline-flex min-w-[3rem] items-center justify-center rounded-xl bg-slate-50 px-3 py-1.5 text-[15px] font-bold text-slate-700 transition-colors duration-300 group-hover:bg-white group-hover:text-indigo-600 group-hover:shadow-sm">
                      {city.qr_scans_30d}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-center">
                    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition-all duration-300 group-hover:shadow-sm ${STATUS_STYLES[city.status_label as keyof typeof STATUS_STYLES] || 'border-slate-200 bg-slate-50 text-slate-600'}`}>
                      {STATUS_LABELS[city.status_label as keyof typeof STATUS_LABELS] || city.status_label}
                    </span>
                  </td>

                  <td className="px-6 py-5 text-right md:px-10">
                    <Link 
                      href={`/guide/${city.slug}`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-[13px] font-bold text-slate-700 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700"
                    >
                      Voir le guide
                      <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}