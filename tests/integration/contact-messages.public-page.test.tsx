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

    expect(screen.getByText('Chalet MyStay · Saint-Gervais-les-Bains')).toBeInTheDocument()
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
})
