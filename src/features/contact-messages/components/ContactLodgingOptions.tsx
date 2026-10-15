'use client'

import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'

const ContactLodgingOptionsContext = createContext<string[]>([])

/** Liste des logements publiés pour la modale contact (spec 053 AC-02-06). */
export function ContactLodgingOptionsProvider({ value, children }: { value: string[]; children: ReactNode }) {
  return <ContactLodgingOptionsContext.Provider value={value}>{children}</ContactLodgingOptionsContext.Provider>
}

export function useContactLodgingOptions(): string[] {
  return useContext(ContactLodgingOptionsContext)
}
