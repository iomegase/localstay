import { PrivateGuidePage } from '@/features/guide-app/components/PrivateGuidePage'

export default async function PrivateFavoritesPage() {
  return PrivateGuidePage({ initialView: 'favorites' })
}
