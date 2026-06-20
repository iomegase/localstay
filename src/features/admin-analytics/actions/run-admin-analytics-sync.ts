'use server'

import { revalidatePath } from 'next/cache'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { runAdminAnalyticsSync } from '@/features/admin-analytics/services/sync'
import type { AnalyticsSourceKind } from '@/features/admin-analytics/types'

export async function runAdminAnalyticsSyncAction(source: AnalyticsSourceKind) {
  await getPageAdmin()
  await runAdminAnalyticsSync({ source })
  revalidatePath('/admin/analytics')
}
