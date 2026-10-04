'use client'

import { useState, type ReactNode } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Download, LocateFixed, Phone, Siren } from 'lucide-react'
import { FRENCH_EMERGENCY_NUMBERS } from '@/features/guide-app/lib/emergency-numbers'
import type { GuideLodging } from '@/features/guide-app/types'
import { formatFrenchPhone, frenchPhoneHref } from '@/shared/lib/french-phone'
import { GUIDE_CARD, GuideInfoCard } from '../GuideCard'
import { Switch } from '@/shared/components/ui/switch'
import { useUserLocation } from '@/features/geolocation/hooks/useUserLocation'

/**
 * Onglet Aide (spec 054 AC-01-05) : conciergerie et urgences (BR-05).
 * En démo (spec 045 AC-01-08), aucun lien `tel:` ni lien externe.
 * Installation : le guide privé fournit sa carte (spec 059) ; sinon, dont la démo,
 * modal informatif (059 BR-06). La démo n'importe ainsi jamais le runtime PWA.
 */
export function GuideHelpView({
  lodging,
  demo = false,
  installCard,
}: {
  lodging: GuideLodging
  demo?: boolean
  installCard?: ReactNode
}) {
  const gps = useUserLocation()
  const emergency = FRENCH_EMERGENCY_NUMBERS[0]
  const conciergePhone = lodging.usefulNumbers.find(item => /conciergerie/i.test(item.label))?.number
    ?? '+33607859058'

  return (
    <div className="min-h-full bg-white px-5 pb-[120px] pt-6">
      <h1 className="text-[30px] font-semibold tracking-[-0.03em] text-[#111111]">Réglages et infos</h1>


      <section aria-label="Réglages du guide" className="mt-6 grid gap-3">
        <div className={`${GUIDE_CARD} flex items-center gap-3`}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-800">
            <LocateFixed className="h-6 w-6" strokeWidth={1} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <label htmlFor="guide-gps-switch" className="block text-[15px] font-semibold tracking-[-0.025em]">Activer votre GPS</label>
            <p id="guide-gps-description" className="mt-1 text-xs text-slate-500" aria-live="polite">
              {gps.status === 'loading' ? 'Recherche de votre position…' : gps.status === 'ready' ? 'Votre position est activée' : gps.status === 'denied' ? 'Accès refusé. Autorisez la localisation dans votre navigateur.' : gps.status === 'unavailable' ? 'Géolocalisation indisponible sur cet appareil.' : 'Pour vous repérer autour de vous'}
            </p>
          </div>
          <Switch
            id="guide-gps-switch"
            aria-describedby="guide-gps-description"
            checked={gps.status === 'ready'}
            disabled={gps.status === 'loading'}
            onCheckedChange={enabled => enabled ? gps.requestLocation() : gps.clearLocation()}
            className="data-[state=checked]:bg-slate-900 data-[state=unchecked]:bg-slate-200"
          />
        </div>
        {installCard ?? <InformationalInstallCard />}
      </section>

      <section className="mt-6">
        <h2 className="inline-flex rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-slate-900">Infos pratiques</h2>
        <div id="guide-practical-panel" className="mt-3 grid gap-2.5">
          <GuideInfoCard
            testId="guide-practical-emergency"
            href={demo ? undefined : frenchPhoneHref(emergency.number)}
            icon={Siren}
            tone="emergency"
            title={emergency.label}
            trailing={emergency.number}
          />
          <GuideInfoCard
            testId="guide-practical-concierge"
            href={demo ? undefined : frenchPhoneHref(conciergePhone)}
            icon={Phone}
            tone="phone"
            title="Conciergerie"
            trailing={formatFrenchPhone(conciergePhone)}
          />
        </div>
      </section>

    </div>
  )
}

/** Spec 054 AC-01-08 / 059 BR-06 : modal informatif, aucune installation. */
function InformationalInstallCard() {
  const [installOpen, setInstallOpen] = useState(false)

  return (
    <Dialog.Root open={installOpen} onOpenChange={setInstallOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className={`${GUIDE_CARD} flex min-h-[76px] w-full items-center gap-3 text-left transition-shadow hover:shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500`}>
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-800">
            <Download className="h-6 w-6" strokeWidth={1} aria-hidden="true" />
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.025em]">Installer le guide</span>
        </button>
      </Dialog.Trigger>
      <Dialog.Overlay className="absolute inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm" />
      <Dialog.Content className="absolute inset-x-5 top-1/2 z-[111] -translate-y-1/2 rounded-[26px] bg-white p-6 text-slate-900 shadow-xl focus:outline-none">
        <Dialog.Title className="text-xl font-semibold tracking-[-0.025em]">Installer le guide</Dialog.Title>
        <Dialog.Description className="mt-3 text-sm leading-relaxed text-slate-600">
          Votre position reste sur votre appareil. L’installation est à venir, avec une désactivation prévue après 7 jours.
        </Dialog.Description>
        <Dialog.Close asChild>
          <button type="button" className="mt-5 min-h-11 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500">J’ai compris</button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  )
}
