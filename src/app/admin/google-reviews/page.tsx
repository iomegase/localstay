import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { AdminGoogleReviews } from '@/features/google-reviews/components/AdminGoogleReviews'
import { getAdminGoogleReviews } from '@/features/google-reviews/queries/admin'

export const dynamic = 'force-dynamic'

export default async function AdminGoogleReviewsPage() {
  await getPageAdmin()
  return <AdminGoogleReviews initialData={await getAdminGoogleReviews()} />
}
