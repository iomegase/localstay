import Image from 'next/image'

/** Spec 059 AC-03-02 : guide installé désactivé, aucun contenu du séjour. */
export function GuideExpiredScreen() {
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
        <p className="text-xl font-semibold tracking-[-0.025em]">Votre séjour est terminé.</p>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">Pour un nouveau séjour, scannez le QR code du logement.</p>
      </div>
    </main>
  )
}
