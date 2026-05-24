import { redirect } from 'next/navigation'
import { getPageMerchant } from '@/features/merchant/lib/get-page-merchant'

export default async function MerchantIndexPage() {
  const { redirect_to } = await getPageMerchant()
  redirect(redirect_to)
}
