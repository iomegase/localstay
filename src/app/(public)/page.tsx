import { CitySearchInput } from '@/features/city-guide/components/CitySearchInput'

export default function HomePage() {
  return (
    <div className="flex flex-col items-center px-4 pt-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-light italic font-serif text-charcoal">
          Bienvenue
        </h1>
        <p className="text-xs text-gray-400 tracking-wide mt-1">
          Recommandation exclusive de votre hôte
        </p>
      </div>
      <CitySearchInput />
    </div>
  )
}
