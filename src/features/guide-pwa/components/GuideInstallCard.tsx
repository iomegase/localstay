'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, Download, Share, SquarePlus } from 'lucide-react'
import { GUIDE_CARD } from '@/features/guide-app/components/GuideCard'
import { useGuideInstall } from '../hooks/useGuideInstall'
import type { IosBrowser } from '../lib/install-platform'

const END_DATE = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'long' })

const ICON_TILE = 'grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-800'
const FOCUS_RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500'

// Amendement A1 : l'étape « Partager » dépend du navigateur iOS.
const IOS_SHARE_STEP: Record<IosBrowser, string> = {
  brave: 'Touchez le menu « ⋯ », puis « Partager »',
  chrome: 'Touchez « Partager » dans la barre d’adresse',
  edge: 'Touchez le menu « ⋯ », puis « Partager »',
  firefox: 'Touchez le menu « ☰ », puis « Partager »',
  'safari-or-unknown': 'Touchez « Partager » (dans Safari : barre du bas ; dans Brave : menu « ⋯ »)',
}

function iosSteps(browser: IosBrowser) {
  return [
    { icon: Share, label: IOS_SHARE_STEP[browser] },
    { icon: SquarePlus, label: 'Choisissez « Sur l’écran d’accueil »' },
    { icon: Check, label: 'Touchez « Ajouter »' },
  ]
}

/** Carte « Installer le guide » de l'écran Réglages et infos (spec 059 US-01). */
export function GuideInstallCard({ lodgingId }: { lodgingId: string }) {
  const { platform, iosBrowser, endsAt, promptInstall } = useGuideInstall(lodgingId)
  const [open, setOpen] = useState(false)

  if (platform === 'installed') {
    return (
      <div className={`${GUIDE_CARD} flex min-h-[76px] items-center gap-3`}>
        <span className={ICON_TILE}>
          <Check className="h-6 w-6" strokeWidth={1} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold tracking-[-0.025em]">Guide installé</p>
          {endsAt && (
            <p className="mt-1 text-xs text-slate-500">Disponible jusqu’au {END_DATE.format(endsAt)}</p>
          )}
        </div>
      </div>
    )
  }

  const trigger = (onClick?: () => void) => (
    <button type="button" onClick={onClick} className={`${GUIDE_CARD} flex min-h-[76px] w-full items-center gap-3 text-left transition-shadow hover:shadow-sm ${FOCUS_RING}`}>
      <span className={ICON_TILE}>
        <Download className="h-6 w-6" strokeWidth={1} aria-hidden="true" />
      </span>
      <span className="text-[15px] font-semibold tracking-[-0.025em]">Installer le guide</span>
    </button>
  )

  if (platform === 'native') {
    return trigger(() => void promptInstall())
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>{trigger()}</Dialog.Trigger>
      <Dialog.Overlay className="absolute inset-0 z-[110] bg-slate-900/40 backdrop-blur-sm" />
      <Dialog.Content className="absolute inset-x-5 top-1/2 z-[111] -translate-y-1/2 rounded-[26px] bg-white p-6 text-slate-900 shadow-xl focus:outline-none">
        <Dialog.Title className="text-xl font-semibold tracking-[-0.025em]">Installer le guide</Dialog.Title>
        {platform === 'ios' ? (
          <>
            <Dialog.Description className="sr-only">Étapes pour ajouter le guide à l’écran d’accueil</Dialog.Description>
            <ol className="mt-4 grid gap-3">
              {iosSteps(iosBrowser).map(({ icon: Icon, label }, index) => (
                <li key={label} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-800">
                    <Icon className="h-5 w-5" strokeWidth={1} aria-hidden="true" />
                  </span>
                  <span><span className="font-semibold text-slate-900">{index + 1}.</span> {label}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              Fonctionne avec Safari, Brave, Chrome, Edge et Firefox. Le guide reste disponible 7 jours, même sans réseau.
            </p>
          </>
        ) : platform === 'android-menu' ? (
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-slate-600">
            Ouvrez le menu « ⋮ » de votre navigateur, puis « Installer » ou « Ajouter à l’écran d’accueil ».
          </Dialog.Description>
        ) : (
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-slate-600">
            Ouvrez le guide dans Safari (iPhone) ou Chrome (Android) pour l’installer.
          </Dialog.Description>
        )}
        <Dialog.Close asChild>
          <button type="button" className={`mt-5 min-h-11 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white ${FOCUS_RING}`}>J’ai compris</button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  )
}
