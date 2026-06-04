/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { AdminContactMessagesPanel } from '@/features/contact-messages/components/AdminContactMessagesPanel'

const message = {
  id: '33333333-3333-4333-8333-333333333333',
  created_at: '2026-06-04T10:30:00.000Z',
  lodging_name: 'Chalet MyStay',
  destination: 'owner' as const,
  status: 'new' as const,
  sender_name: 'Marie Dupont',
  sender_email: 'marie@example.test',
  sender_phone: '+33 6 12 34 56 78',
  subject: 'Question arrivée',
  message: 'Bonjour, pouvons-nous arriver un peu plus tôt demain ?',
  archived_at: null,
  reply_body: null,
  replied_at: null,
}

describe('024 admin contact messages panel', () => {
  it('AC-02-01/AC-02-02: renders rows and opens a details modal from the eye action', async () => {
    render(<AdminContactMessagesPanel messages={[message]} />)

    expect(screen.getByText('Chalet MyStay')).toBeInTheDocument()
    expect(screen.getByText('Propriétaire')).toBeInTheDocument()
    expect(screen.getByText('Question arrivée')).toBeInTheDocument()
    expect(screen.getByText('04/06/2026')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Voir le message' }))

    expect(screen.getByRole('dialog', { name: 'Message de Marie Dupont' })).toBeInTheDocument()
    expect(screen.getByText('Bonjour, pouvons-nous arriver un peu plus tôt demain ?')).toBeInTheDocument()
    expect(screen.getByLabelText('Réponse')).toBeInTheDocument()
  })
})
