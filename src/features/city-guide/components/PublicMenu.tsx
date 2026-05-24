'use client'

import { useState } from 'react'
import Link from 'next/link'

export function PublicMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col justify-between p-8">
          <div className="mt-20 space-y-8">
            <p className="text-[10px] uppercase tracking-[0.4em] text-gray-400 font-bold">
              Navigation
            </p>
            <nav className="space-y-6">
              <Link href="#" className="block text-4xl font-serif italic">Le Logement</Link>
              <Link href="#" className="block text-4xl font-serif italic">Services Privés</Link>
              <Link href="#" className="block text-4xl font-serif italic">Mes Favoris</Link>
              <Link href="#" className="block text-4xl font-serif italic">Nous Contacter</Link>
            </nav>
          </div>
          <div className="border-t border-gray-100 pt-8">
            <p className="text-sm text-gray-400">StayLocal Concierge v1.0</p>
          </div>
        </div>
      )}

      <button
        type="button"
        aria-label={isOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        aria-expanded={isOpen}
        onClick={() => setIsOpen(open => !open)}
        className="relative z-[80] w-10 h-10 flex flex-col justify-center items-end gap-1.5"
      >
        <span
          className={`h-[1.5px] bg-charcoal transition-all duration-300 ${
            isOpen ? 'w-6 translate-y-[3px] rotate-45' : 'w-6'
          }`}
        />
        <span
          className={`h-[1.5px] bg-charcoal transition-all duration-300 ${
            isOpen ? 'w-6 -translate-y-[3px] -rotate-45' : 'w-4'
          }`}
        />
      </button>
    </>
  )
}
