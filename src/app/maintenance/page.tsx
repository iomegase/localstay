import type { Metadata } from 'next'
import { MyStayLogo } from '@/shared/components/brand/MyStayLogo'
import { getMaintenanceState } from '@/features/maintenance/queries/maintenance'
import { maintenanceMessage } from '@/features/maintenance/lib/maintenance'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Maintenance — MyStay',
  robots: { index: false, follow: false },
}

// Spec 087 AC-02-03 : logo MyStay puis message, centrés au milieu de l'écran.
export default async function MaintenancePage() {
  const message = await getMaintenanceState()
    .then(state => state.message)
    .catch(() => maintenanceMessage(null))

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-8 bg-white px-6 text-center">
      <MyStayLogo className="h-12 w-auto sm:h-14" priority />
      <p data-testid="maintenance-message" className="max-w-md whitespace-pre-line text-base leading-relaxed text-slate-600 sm:text-lg">
        {message}
      </p>
    </main>
  )
}
