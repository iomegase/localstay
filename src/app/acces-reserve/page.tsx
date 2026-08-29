import Link from 'next/link'
import { QrCode } from 'lucide-react'
import type { Metadata } from 'next'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'

export const metadata: Metadata = privatePageMetadata('Accès par lien — MyStay')

export default function AccesReservePage() {
  return (
    <main className="flex min-h-[100dvh] flex-col items-center justify-center bg-white px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-charcoal text-white">
        <QrCode className="h-8 w-8" />
      </div>

      <h1 className="mt-8 text-2xl font-semibold text-charcoal">Accès sur invitation</h1>

      <p className="mt-4 max-w-sm text-sm leading-relaxed text-charcoal/60">
        Ce guide est réservé aux voyageurs de votre hôte. Scannez le QR code ou
        ouvrez le lien fourni dans votre logement pour accéder à vos
        recommandations.
      </p>

      <p className="mt-10 text-[11px] font-bold uppercase tracking-[0.35em] text-charcoal/30">
        MyStay
      </p>

      <Link
        href="/auth/login"
        className="mt-4 text-xs text-charcoal/40 underline-offset-4 hover:underline"
      >
        Vous êtes hôte ? Connexion
      </Link>
    </main>
  )
}
