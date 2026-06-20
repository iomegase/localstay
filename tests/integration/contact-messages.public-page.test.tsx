/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ContactPage from '@/app/(public)/contact/page'
import { prisma } from '@/shared/lib/prisma'

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => ({
    lodgingId: '11111111-1111-4111-8111-111111111111',
    lodgingName: 'Chalet MyStay',
    citySlug: 'saint-gervais',
    cityName: 'Saint-Gervais-les-Bains',
    ownerName: 'Alice Martin',
  })),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: {
      findFirst: jest.fn(),
    },
  },
}))

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) => (
    <a href={href} className={className}>{children}</a>
  ),
}))

jest.mock('@/shared/components/MarkdownText', () => ({
  MarkdownText: ({ source, className }: { source: string; className?: string }) => (
    <div className={className}>{source}</div>
  ),
}))

jest.mock('@/features/public-menu/components/LeaveStayButton', () => ({
  LeaveStayButton: () => <button type="button">Quitter le séjour</button>,
}))

describe('024 contact messages public page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(prisma.lodging.findFirst as jest.Mock).mockResolvedValue({
      owner: { first_name: 'Alice', last_name: 'Martin', email: 'alice@example.test' },
      customization: { emergency_contacts: 'Pompiers : 18' },
    })
  })

  it('AC-01-01: renders the lodging contact form with destination choices', async () => {
    render(await ContactPage())

    expect(
      screen.getAllByText((_, node) => node?.textContent?.replace(/\s+/g, ' ').trim() === 'Chalet MyStay | Saint-Gervais-les-Bains'),
    ).toHaveLength(2)
    expect(screen.getByLabelText('Nom')).toBeInTheDocument()
    expect(screen.getByLabelText('Email')).toBeInTheDocument()
    expect(screen.getByLabelText('Téléphone')).toBeInTheDocument()
    expect(screen.getByLabelText('Destination')).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Propriétaire' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Conciergerie' })).toBeInTheDocument()
    expect(screen.getByLabelText('Sujet')).toBeInTheDocument()
    expect(screen.getByLabelText('Message')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeInTheDocument()
  })

  it('AC-04-04: annotates owner and MyStay email CTAs for analytics tracking', async () => {
    render(await ContactPage())

    const ownerLink = screen.getByText('alice@example.test').closest('a')
    const mystayLink = screen.getByRole('link', { name: 'hello@mystay.fr' })

    expect(ownerLink).toHaveAttribute('data-analytics-event', 'owner_email_click')
    expect(ownerLink).toHaveAttribute('data-analytics-city-slug', 'saint-gervais')
    expect(ownerLink).toHaveAttribute('data-analytics-lodging-id', '11111111-1111-4111-8111-111111111111')

    expect(mystayLink).toHaveAttribute('data-analytics-event', 'mystay_email_click')
    expect(mystayLink).toHaveAttribute('data-analytics-city-slug', 'saint-gervais')
    expect(mystayLink).toHaveAttribute('data-analytics-lodging-id', '11111111-1111-4111-8111-111111111111')
  })
})
