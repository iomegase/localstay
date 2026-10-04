'use client'

import Image from 'next/image'
import { useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'

/** Spec 059 AC-03-02 : guide installé désactivé, aucun contenu du séjour. */
export function GuideExpiredScreen() {
  const m = useGuideMessages()
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center gap-6 bg-white px-8 text-center text-slate-900">
      <Image
        src="/mystay-logo-approved/mystay-logo-approved.png"
        alt="MyStay"
        width={160}
        height={48}
        className="h-auto w-40"
        priority
      />
      <div>
        <p className="text-xl font-semibold tracking-[-0.025em]">{m.expired.title}</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{m.expired.body}</p>
      </div>
    </main>
  )
}
