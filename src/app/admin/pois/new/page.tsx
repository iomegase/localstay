import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { getManualPoiFormOptions } from '@/features/poi-acquisition/queries/manual-poi'

export default async function AdminNewPoiPage() {
  await getPageAdmin()
  const options = await getManualPoiFormOptions()

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
        <div className="p-6 md:p-8">
          <form className="grid gap-6 md:grid-cols-2">
            
            {/* Input : Nom */}
            <div className="space-y-2">
              <label htmlFor="name" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                Nom
              </label>
              <input 
                id="name" 
                name="name" 
                placeholder="Ex: Le Refuge des Aiglons"
                className="w-full h-[52px] rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-medium text-neutral-900 placeholder-gray-400 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]" 
              />
            </div>

            {/* Input : Adresse */}
            <div className="space-y-2">
              <label htmlFor="address" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                Adresse
              </label>
              <input 
                id="address" 
                name="address" 
                placeholder="Ex: 12 Rue du Mont Blanc"
                className="w-full h-[52px] rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-medium text-neutral-900 placeholder-gray-400 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]" 
              />
            </div>

            {/* Select : Ville */}
            <div className="space-y-2">
              <label htmlFor="city_id" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                Ville
              </label>
              <div className="relative">
                <select 
                  id="city_id" 
                  name="city_id" 
                  className="w-full h-[52px] appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
                >
                  {options.cities.map(city => (
                    <option key={city.id} value={city.id}>{city.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>

            {/* Select : Catégorie */}
            <div className="space-y-2">
              <label htmlFor="category_id" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                Catégorie
              </label>
              <div className="relative">
                <select 
                  id="category_id" 
                  name="category_id" 
                  className="w-full h-[52px] appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
                >
                  {options.categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>

            {/* Textarea : Description */}
            <div className="space-y-2 md:col-span-2">
              <label htmlFor="description" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                Description
              </label>
              <textarea 
                id="description" 
                name="description" 
                placeholder="Description détaillée du lieu..."
                className="w-full min-h-[140px] rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-sm font-medium text-neutral-900 placeholder-gray-400 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437] resize-y" 
              />
            </div>

            {/* Submit Button */}
            <div className="pt-4 md:col-span-2 flex justify-end">
              <button 
                type="button" 
                className="h-[52px] w-full rounded-xl bg-[#0B1437] px-8 text-[13px] font-bold text-white transition-all hover:bg-gray-900 hover:shadow-md md:w-auto"
              >
                Créer après validation
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  )
}

function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  )
}