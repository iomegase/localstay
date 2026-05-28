import { FavoritesList } from '@/features/public-menu/components/FavoritesList'

export default function MesFavorisPage() {
  return (
    <div className="px-5 pt-4">
      <div className="mb-6">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">Mes favoris</p>
        <h1 className="mt-1 font-serif italic text-3xl text-charcoal">Vos lieux sauvegardés</h1>
        <p className="mt-1 text-sm text-gray-500">
          Stockés localement sur votre appareil. Ils disparaissent si vous videz les cookies.
        </p>
      </div>
      <FavoritesList />
    </div>
  )
}
