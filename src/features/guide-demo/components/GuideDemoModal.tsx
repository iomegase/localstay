'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { DemoGuideApp } from './DemoGuideApp'

export function GuideDemoModal({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  useEffect(() => {
    if (!open) return

    const hadScrollLock = document.body.classList.contains('overflow-hidden')
    document.body.classList.add('overflow-hidden')
    return () => {
      if (!hadScrollLock) document.body.classList.remove('overflow-hidden')
    }
  }, [open])

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay asChild>
          <motion.div
            className="fixed inset-0 z-[100] bg-slate-950/30 backdrop-blur-lg data-[state=closed]:animate-out data-[state=closed]:fade-out-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          />
        </Dialog.Overlay>
        <div className="pointer-events-none fixed inset-0 z-[101] flex items-center justify-center p-3">
          <Dialog.Content asChild>
            <motion.div
              role="dialog"
              aria-modal="true"
              className="pointer-events-auto relative h-[min(720px,calc(100dvh-32px))] w-[min(360px,calc(100vw-24px))] overflow-hidden rounded-[2.5rem] border-[5px] border-white bg-white shadow-[0_35px_120px_rgba(15,23,42,0.55)] outline-none data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-bottom-4"
              initial={{ opacity: 0, y: 28 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 18 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            >
              <Dialog.Title className="sr-only">
                Guide MyStay de démonstration
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Démonstration publique et interactive du guide de séjour MyStay.
              </Dialog.Description>
              {open ? <DemoGuideApp /> : null}
            </motion.div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
