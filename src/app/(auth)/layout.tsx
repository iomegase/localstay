import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-8">
      <div className="w-full max-w-lg">
        
        {/* En-tête du layout */}
        <div className="mb-16 text-center">
          <div className="mb-4 flex justify-center">
            {/* REMPLACEZ "/logo.svg" PAR LE CHEMIN DE VOTRE LOGO */}
            <img 
              src="/logo.png" 
              alt="Logo StayLocal" 
              className="h-10 w-auto object-contain" 
            />
          </div>
          
          {/* Titre conservé pour l'accessibilité (lecteurs d'écran) mais caché visuellement */}
          <h1 className="sr-only">StayLocal</h1>
          
          {/* <p className="mt-2 text-sm font-medium text-slate-500">
            Votre guide touristique local
          </p> */}
        </div>

        {/* Contenu (LoginPage, RegisterPage, etc.) */}
        {children}
        
      </div>
    </div>
  )
}