/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import SubscriptionPage from '@/app/(dashboard)/dashboard/subscription/page'
import DashboardLayout from '@/app/(dashboard)/layout'

const mockFindFirst = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: { subscription: { findFirst: (...args: unknown[]) => mockFindFirst(...args) } } }))
jest.mock('@/features/dashboard-owner/lib/get-page-owner', () => ({ getPageOwner: jest.fn(async () => ({ id: 'owner-1', role: 'owner' })) }))
jest.mock('next/navigation', () => ({ usePathname: () => '/dashboard', useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }) }))

// Spec 078 — abonnement en veille.
describe('078 — abonnement en veille', () => {
  it('AC-01-01 : la page s’affiche sans abonnement en base, sans lire la base', async () => {
    mockFindFirst.mockResolvedValue(null)
    render(await SubscriptionPage())

    expect(screen.getByRole('heading', { name: "L'abonnement arrive bientôt" })).toBeInTheDocument()
    expect(mockFindFirst).not.toHaveBeenCalled()
  })

  it('AC-01-02 : l’entrée « Abonnement » n’est plus dans le menu', () => {
    render(<DashboardLayout><div>Contenu</div></DashboardLayout>)

    expect(screen.getAllByRole('link', { name: /Logements/ }).length).toBeGreaterThan(0)
    expect(screen.queryByRole('link', { name: /Abonnement/ })).not.toBeInTheDocument()
  })
})
