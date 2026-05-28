import type { ReactNode } from 'react'
import { LogoutButton } from '@/shared/components/LogoutButton'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <span className="text-sm font-semibold text-gray-700">Admin</span>
          <LogoutButton variant="header" />
        </div>
      </header>
      <div className="max-w-2xl mx-auto py-12 px-6">{children}</div>
    </div>
  )
}
