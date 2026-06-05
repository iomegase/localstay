/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import DashboardLayout from '@/app/(dashboard)/layout'
import OwnerMessagesPage from '@/app/(dashboard)/dashboard/messages/page'

jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard/messages',
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}))

jest.mock('@/features/dashboard-owner/lib/get-page-owner', () => ({
  getPageOwner: jest.fn(async () => ({ id: 'owner-1', role: 'owner' })),
}))

jest.mock('@/features/contact-messages/queries/contact-messages', () => ({
  listOwnerContactMessages: jest.fn(async () => [
    {
      id: 'message-1',
      created_at: '2026-06-05T09:00:00.000Z',
      lodging_name: 'Chalet MyStay',
      sender_name: 'Marie Dupont',
      sender_email: 'marie@example.test',
      sender_phone: '+33 6 12 34 56 78',
      subject: 'Question arrivée',
      message: 'Bonjour, pouvons-nous arriver plus tôt ?',
      status: 'new',
    },
  ]),
}))

jest.mock('@/shared/components/LogoutButton', () => ({
  LogoutButton: () => <button type="button">Déconnexion</button>,
}))

describe('024 contact messages owner dashboard', () => {
  it('AC-04-01: renders owner contact messages on /dashboard/messages', async () => {
    render(await OwnerMessagesPage())

    expect(screen.getByText('Messages voyageurs')).toBeInTheDocument()
    expect(screen.getByText('Chalet MyStay')).toBeInTheDocument()
    expect(screen.getByText('Marie Dupont')).toBeInTheDocument()
    expect(screen.getByText('Question arrivée')).toBeInTheDocument()
    expect(screen.getByText('Bonjour, pouvons-nous arriver plus tôt ?')).toBeInTheDocument()
    expect(screen.getByText('marie@example.test')).toBeInTheDocument()
  })

  it('AC-04-03: exposes a Messages tab in the owner aside menu', () => {
    render(<DashboardLayout><div>Contenu</div></DashboardLayout>)

    expect(screen.getAllByRole('link', { name: /Messages/i })[0]).toHaveAttribute(
      'href',
      '/dashboard/messages',
    )
  })
})
