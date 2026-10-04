'use client'

import { useState } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { Check, Download, Share, SquarePlus } from 'lucide-react'
import { GUIDE_CARD } from '@/features/guide-app/components/GuideCard'
import { useGuideInstall } from '../hooks/useGuideInstall'
import type { IosBrowser } from '../lib/install-platform'
import { useGuideI18n } from '@/features/guide-i18n/components/GuideI18nContext'
import type { GuideMessages } from '@/features/guide-i18n/messages'


const ICON_TILE = 'grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-100 text-slate-800'
const FOCUS_RING = 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-500'

// Amendement A1 : l'étape « Partager » dépend du navigateur iOS.
const IOS_SHARE_KEY: Record<IosBrowser, keyof GuideMessages['install']['share']> = {
  brave: 'brave',
  chrome: 'chrome',
  edge: 'edge',
  firefox: 'firefox',
  'safari-or-unknown': 'safariOrUnknown',
}

function iosSteps(browser: IosBrowser, m: GuideMessages) {
  return [
    { icon: Share, label: m.install.share[IOS_SHARE_KEY[browser]] },
    { icon: SquarePlus, label: m.install.addToHomeScreen },
    { icon: Check, label: m.install.add },
  ]
}

/** Carte « Installer le guide » de l'écran Réglages et infos (spec 059 US-01). */
export function GuideInstallCard({ lodgingId }: { lodgingId: string }) {
  const { platform, iosBrowser, endsAt, promptInstall } = useGuideInstall(lodgingId)
  const { intlLocale, messages: m } = useGuideI18n()
  const [open, setOpen] = useState(false)

  if (platform === 'installed') {
    return (
      <div className={`${GUIDE_CARD} flex min-h-[76px] items-center gap-3`}>
        <span className={ICON_TILE}>
          <Check className="h-6 w-6" strokeWidth={1} aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[15px] font-semibold tracking-[-0.025em]">{m.install.installed}</p>
          {endsAt && (
            <p className="mt-1 text-xs text-slate-500">{m.install.availableUntil(new Intl.DateTimeFormat(intlLocale, { day: 'numeric', month: 'long' }).format(endsAt))}</p>
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
      <span className="text-[15px] font-semibold tracking-[-0.025em]">{m.install.title}</span>
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
        <Dialog.Title className="text-xl font-semibold tracking-[-0.025em]">{m.install.title}</Dialog.Title>
        {platform === 'ios' ? (
          <>
            <Dialog.Description className="sr-only">{m.install.stepsDescription}</Dialog.Description>
            <ol className="mt-4 grid gap-3">
              {iosSteps(iosBrowser, m).map(({ icon: Icon, label }, index) => (
                <li key={label} className="flex items-center gap-3 text-sm text-slate-700">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-100 text-slate-800">
                    <Icon className="h-5 w-5" strokeWidth={1} aria-hidden="true" />
                  </span>
                  <span><span className="font-semibold text-slate-900">{index + 1}.</span> {label}</span>
                </li>
              ))}
            </ol>
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {m.install.iosFootnote}
            </p>
          </>
        ) : platform === 'android-menu' ? (
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-slate-600">
            {m.install.androidMenu}
          </Dialog.Description>
        ) : (
          <Dialog.Description className="mt-3 text-sm leading-relaxed text-slate-600">
            {m.install.unsupported}
          </Dialog.Description>
        )}
        <Dialog.Close asChild>
          <button type="button" className={`mt-5 min-h-11 w-full rounded-full bg-slate-900 px-4 py-3 text-sm font-semibold text-white ${FOCUS_RING}`}>{m.common.understood}</button>
        </Dialog.Close>
      </Dialog.Content>
    </Dialog.Root>
  )
}
