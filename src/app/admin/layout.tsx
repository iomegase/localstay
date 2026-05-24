import type { ReactNode } from 'react'

export default function AdminPathLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-10">{children}</div>
    </div>
  )
}
