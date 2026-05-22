import type { ReactNode } from 'react'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="fr">
      <body className="bg-gray-50 min-h-screen">
        <div className="max-w-2xl mx-auto py-12 px-6">{children}</div>
      </body>
    </html>
  )
}
