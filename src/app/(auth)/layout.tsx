import type { ReactNode } from 'react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory flex items-center justify-center px-4">
      <div className="w-full max-w-[430px]">
        <div className="text-center mb-8">
          <h1 className="font-serif italic text-3xl text-charcoal">StayLocal</h1>
          <p className="text-sm text-charcoal/50 mt-1">Votre guide touristique local</p>
        </div>
        {children}
      </div>
    </div>
  )
}
