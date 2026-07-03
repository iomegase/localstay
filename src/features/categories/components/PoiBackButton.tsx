'use client'

import { ArrowLeft } from 'lucide-react'

/**
 * Bouton « fermer » de la fiche POI : revient à la page précédente
 * (recommandations, favoris, carte…). Repli sur l'accueil séjour si l'historique
 * est vide (accès direct par lien). Utilise l'historique du navigateur pour éviter
 * de renvoyer vers le listing de catégorie, bloqué pour le guest en séjour.
 */
export function PoiBackButton() {
  function handleClose() {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back()
    } else {
      window.location.assign('/')
    }
  }

  return (
    <button
      type="button"
      onClick={handleClose}
      aria-label="Fermer"
      className="w-10 h-10 mt-4 rounded-full bg-white/70 backdrop-blur flex items-center justify-center text-charcoal shadow-md active:scale-95 transition-transform hover:bg-white"
    >
      <ArrowLeft className="w-4 h-4" />
    </button>
  )
}
