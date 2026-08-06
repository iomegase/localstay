/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'

jest.mock('@/features/contact-messages/components/ContactMessageForm', () => ({
  ContactMessageForm: ({ lodgingId }: { lodgingId: string | null }) => (
    <form data-testid="contact-form" data-lodging={lodgingId} />
  ),
}))

import { GuideContactView } from '@/features/guide-app/components/GuideContactView'

describe('GuideContactView', () => {
  it('reuses the public contact design and the shared form (in-app, no outgoing link)', () => {
    render(
      <GuideContactView
        contact={{ lodgingId: 'l1', lodgingName: 'Le Chalet Hygge', cityName: 'Saint-Gervais' }}
      />,
    )

    expect(screen.getByRole('heading', { name: /votre hôte/i })).toBeInTheDocument()
    expect(screen.getByText(/le chalet hygge/i)).toBeInTheDocument()
    expect(screen.getByText(/saint-gervais/i)).toBeInTheDocument()
    expect(screen.getByTestId('contact-form')).toHaveAttribute('data-lodging', 'l1')
    // Confinement : aucun lien sortant.
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
