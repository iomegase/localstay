import { redirect } from 'next/navigation'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'
import { RecommendationsView } from './_components/RecommendationsView'

export default async function NosRecommendationsPage() {
  const lodgingContext = await getActiveLodgingContext()
  if (!lodgingContext) redirect('/')

  return await RecommendationsView({ lodgingContext })
}
