'use client'

import * as Dialog from '@radix-ui/react-dialog'
import Link from 'next/link'
import { ArrowRight, Menu, X } from 'lucide-react'
import { GuideDemoPhoneButton } from '@/features/guide-demo/components/GuideDemoPhoneButton'
import { MyStayLogo } from '@/shared/components/brand/MyStayLogo'
import { marketingNavigation } from './marketing-navigation'

export function MarketingMobileMenu() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <button
          type="button"
          aria-label="Ouvrir le menu"
          className="ml-auto flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-800 shadow-sm transition-colors hover:border-pink-200 hover:text-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 lg:hidden"
        >
          <Menu aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[120] bg-slate-950/15 backdrop-blur-md data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed inset-2 z-[121] flex flex-col overflow-y-auto overscroll-contain rounded-[30px] border border-white/90 bg-white/[0.86] px-6 pb-7 pt-5 text-slate-800 shadow-[0_30px_100px_rgba(15,23,42,0.28)] outline-none backdrop-blur-2xl data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-right-8 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-right-8 sm:inset-y-5 sm:left-auto sm:right-5 sm:w-[min(430px,calc(100vw-40px))] sm:rounded-[36px] sm:px-9 sm:pb-9 sm:pt-7">
          <Dialog.Title className="sr-only">Menu MyStay</Dialog.Title>
          <Dialog.Description className="sr-only">
            Navigation principale du site MyStay
          </Dialog.Description>

          <div className="flex items-center justify-between">
            <Dialog.Close asChild>
              <Link
                href="/"
                aria-label="MyStay — Accueil"
                className="inline-flex items-center"
              >
                <MyStayLogo
                  alt="MyStay"
                  className="h-auto w-[142px] object-contain"
                  priority
                  sizes="142px"
                />
              </Link>
            </Dialog.Close>
            <Dialog.Close asChild>
              <button
                type="button"
                aria-label="Fermer le menu"
                className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 bg-white/80 text-slate-800 transition-colors hover:border-pink-200 hover:text-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
              >
                <X aria-hidden="true" className="h-6 w-6" strokeWidth={1.8} />
              </button>
            </Dialog.Close>
          </div>

          <nav
            aria-label="Navigation mobile"
            className="flex min-h-0 flex-1 flex-col pt-[clamp(48px,10vh,88px)]"
          >
            <div className="grid gap-1">
              {marketingNavigation.map(item => (
                <Dialog.Close asChild key={item.href}>
                  <Link
                    href={item.href}
                    className="group -mx-2 flex items-center justify-between rounded-2xl px-2 py-2.5 text-[clamp(25px,7vw,34px)] font-medium leading-tight tracking-[-0.045em] transition-colors hover:bg-white/70 hover:text-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-600"
                  >
                    <span>{item.label}</span>
                    <ArrowRight
                      aria-hidden="true"
                      className="h-5 w-5 translate-x-1 text-pink-600 opacity-0 transition-all group-hover:translate-x-0 group-hover:opacity-100"
                    />
                  </Link>
                </Dialog.Close>
              ))}
            </div>

            <div className="mt-auto grid gap-3 pt-8">
              <GuideDemoPhoneButton
                label="Guide démo"
                className="inline-flex min-h-12 w-full items-center justify-center gap-3 rounded-full border border-slate-200 bg-white/70 px-5 text-sm font-bold text-slate-800 transition-colors hover:border-pink-200 hover:bg-white hover:text-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
              />
              <Dialog.Close asChild>
                <Link
                  href="/confier-mon-logement"
                  className="inline-flex min-h-14 items-center justify-center rounded-full bg-slate-800 px-6 text-sm font-bold text-white shadow-[0_16px_36px_rgba(15,23,42,0.18)] transition-colors hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
                >
                  Confier mon logement
                </Link>
              </Dialog.Close>
            </div>
          </nav>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
