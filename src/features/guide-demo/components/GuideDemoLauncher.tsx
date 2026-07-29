'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { Smartphone } from 'lucide-react'
import { marketingDarkButtonClass } from '@/features/marketing/components/MarketingShell'

const GuideDemoModal = dynamic(
  () =>
    import('./GuideDemoModal').then(module => module.GuideDemoModal),
  { ssr: false },
)

export function GuideDemoLauncher() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const hasOpenedRef = useRef(false)

  useEffect(() => {
    if (!isOpen && hasOpenedRef.current) {
      triggerRef.current?.focus()
    }
  }, [isOpen])

  function openDemo() {
    hasOpenedRef.current = true
    setIsLoaded(true)
    setIsOpen(true)
  }

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={openDemo}
        className={`${marketingDarkButtonClass} mt-7 xl:mt-[19px] xl:min-h-[42px] xl:gap-[14px] xl:px-[17px] xl:text-[11px]`}
      >
        <Smartphone className="h-4 w-4" aria-hidden="true" />
        Voir le guide d’exemple
      </button>
      {isLoaded && (
        <GuideDemoModal open={isOpen} onOpenChange={setIsOpen} />
      )}
    </>
  )
}
