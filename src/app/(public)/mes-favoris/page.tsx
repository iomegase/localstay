import { FavoritesList } from '@/features/public-menu/components/FavoritesList'

export default function MesFavorisPage() {
  return (
    <div className="pt-4">
      <div className="mb-6">
       
        <h1 className="mt-1 p-5 uppercase text-3xl text-charcoal">Vos favoris</h1>
        <p className="mt-1 p-5 tracking-wide italic text-[10px] max-w-xl text-gray-500">
          Stockés localement sur votre appareil. Ils disparaissent si vous videz les cookies.
        </p>
      </div>
      <FavoritesList />
    </div>
  )
}
