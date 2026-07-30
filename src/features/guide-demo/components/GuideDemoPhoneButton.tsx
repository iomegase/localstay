'use client'

import dynamic from 'next/dynamic'
import { useEffect, useRef, useState } from 'react'
import { Smartphone } from 'lucide-react'

const GuideDemoModal = dynamic(
  () => import('./GuideDemoModal').then(module => module.GuideDemoModal),
  { ssr: false },
)

export function GuideDemoPhoneButton({ className }: { className?: string }) {
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
        aria-label="Voir le guide d’exemple"
        title="Voir le guide d’exemple"
        className={className}
      >
        <Smartphone
          aria-hidden="true"
          className="h-[18px] w-[18px] xl:h-[17px] xl:w-[17px]"
          strokeWidth={1.8}
        />
      </button>
      {isLoaded && <GuideDemoModal open={isOpen} onOpenChange={setIsOpen} />}
    </>
  )
}
