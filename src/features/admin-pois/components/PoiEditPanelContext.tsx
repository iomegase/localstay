'use client'

import { createContext, useContext } from 'react'

type PoiEditPanelState = {
  /** Modification hors champ de saisie (photos réordonnées, retirées…). */
  markDirty: () => void
  /** Enregistrement réussi : plus de modification en attente. */
  markSaved: () => void
}

const noop = () => {}

// Spec 068 AC-02-02 : sans panneau (pleine page), ces appels sont sans effet.
export const PoiEditPanelContext = createContext<PoiEditPanelState>({ markDirty: noop, markSaved: noop })

export function usePoiEditPanel(): PoiEditPanelState {
  return useContext(PoiEditPanelContext)
}
