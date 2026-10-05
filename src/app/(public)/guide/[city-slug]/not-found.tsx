import Link from 'next/link'

/**
 * 404 unique du guide privé (ville, catégorie, fiche, agenda…), qui remplace
 * depuis le 2026-10-05 les deux 404 historiques des specs 001 et 002.
 */
export default function GuideNotFound() {
  return (
    <div className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Élément décoratif en arrière-plan (Cercle subtil) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-pink-600/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-md w-full text-center space-y-8">
        
        {/* Icône ou Illustration discrète */}
        <div className="flex justify-center">
          <div className="relative">
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              className="w-16 h-16 text-pink-600/40 stroke-[1px]" 
              stroke="currentColor"
            >
              <path d="M12 21s-8-4.5-8-11.8A8 8 0 0112 2a8 8 0 018 7.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span className="absolute -bottom-2 -right-2 text-4xl font-serif italic text-charcoal opacity-20">
              404
            </span>
          </div>
        </div>

        {/* Texte Principal */}
        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-light italic font-serif text-charcoal tracking-tight">
            Cette page du guide est introuvable.
          </h1>
          
          <div className="flex justify-center">
            <div className="h-[1px] w-12 bg-pink-600/50" />
          </div>

          <p className="text-base text-gray-500 font-light max-w-[280px] mx-auto leading-relaxed">
            Le lien est peut-être incomplet, ou cette adresse n&apos;est plus proposée dans le guide.
          </p>
        </div>

        {/* Bouton Call to Action */}
        <div className="pt-4">
          <Link
            href="/sejour"
            className="group relative inline-flex flex-col items-center gap-2 transition-all duration-300"
          >
            <span className="text-xs font-bold uppercase tracking-[0.3em] text-pink-600 group-hover:text-charcoal transition-colors">
              Retour au guide
            </span>
            {/* Ligne animée sous le lien */}
            <span className="h-[1px] w-full bg-pink-600/30 overflow-hidden">
              <span className="block h-full w-full bg-pink-600 -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
            </span>
          </Link>
        </div>
      </div>

      {/* Détail minimaliste en bas de page */}
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
         <p className="text-[10px] uppercase tracking-widest text-gray-300 whitespace-nowrap">
           L&apos;art du voyage — Est. 2024
         </p>
      </div>
    </div>
  )
}