'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import type { ReactNode } from 'react'

/**
 * Cadre commun des modales de contact publiques : même rendu que la modale
 * « Aide & contact » (spec 053), contenu fourni par chaque formulaire.
 */
export function ContactDialogFrame({
  open,
  onOpenChange,
  trigger,
  eyebrow,
  title,
  description,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  trigger: ReactNode
  eyebrow: string
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Trigger asChild>{trigger}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[140] bg-slate-950/30 backdrop-blur-lg" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[141] max-h-[calc(100dvh-24px)] w-[min(640px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] bg-white p-6 text-left text-slate-800 shadow-[0_35px_120px_rgba(15,23,42,0.35)] outline-none sm:p-9"
        >
          <Dialog.Close
            aria-label="Fermer"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Dialog.Close>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-pink-600">
            {eyebrow}
          </span>
          <Dialog.Title className="mt-3 text-2xl font-bold tracking-[-0.04em] text-slate-900 sm:text-[30px]">
            {title}
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
            {description}
          </Dialog.Description>
          {children}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
