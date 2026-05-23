import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-ivory">
      <header className="border-b border-charcoal/8 bg-white px-6 py-4 flex items-center justify-between">
        <span className="font-serif italic text-xl text-charcoal">StayLocal</span>
        <form action="/api/auth/logout" method="POST">
          <button
            type="submit"
            className="text-sm text-charcoal/60 hover:text-charcoal transition-colors"
          >
            Se déconnecter
          </button>
        </form>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
    </div>
  )
}
