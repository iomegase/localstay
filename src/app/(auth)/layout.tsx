import type { ReactNode } from 'react'
import { MyStayLogo } from '@/shared/components/brand/MyStayLogo'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4 sm:p-8">
      <div className="w-full max-w-lg">
        
        {/* En-tête du layout */}
        <div className="mb-16 text-center">
          <div className="mb-4 flex justify-center">
            <MyStayLogo
              alt="Logo MyStay"
              className="h-10 w-auto object-contain"
              priority
              sizes="160px"
            />
          </div>
          
          {/* Titre conservé pour l'accessibilité (lecteurs d'écran) mais caché visuellement */}
          <h1 className="sr-only">MyStay</h1>
          
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
