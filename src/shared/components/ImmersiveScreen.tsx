'use client'

import { useEffect } from 'react'

/**
 * Spec 054 AC-07-06 : masque l'en-tête et la barre de l'ancien gabarit pendant que l'écran est
 * affiché (même mécanisme que la navigation en randonnée, classe `immersive-screen`).
 */
export function ImmersiveScreen() {
  useEffect(() => {
    document.body.classList.add('immersive-screen')
    return () => { document.body.classList.remove('immersive-screen') }
  }, [])
  return null
}
