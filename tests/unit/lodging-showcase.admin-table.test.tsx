/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { AdminLodgingProfilesTable } from '@/features/lodging-showcase/components/AdminLodgingProfilesTable'

const mockRefresh = jest.fn()

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh }),
}))

global.fetch = jest.fn()

const row = {
  id: '11111111-1111-4111-8111-111111111111',
  publication_status: 'review' as const,
  title: 'Chalet Hygge',
  short_description: 'Un chalet lumineux pour sejourner a Annecy dans l univers MyStay.',
  lodging: {
    id: 'lodging-1',
    name: 'Chalet Hygge',
    owner: {
      id: 'owner-1',
      email: 'owner@example.test',
    },
  },
  city: {
    id: 'city-1',
    name: 'Annecy',
    slug: 'annecy',
  },
  photos_count: 4,
  seo_warnings: ['seo_photo_count'],
  updated_at: '2026-06-12T10:00:00.000Z',
}

describe('028 lodging showcase admin table', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('AC-06-02: refreshes the admin page after a successful publish action', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ id: row.id, publication_status: 'published' }),
    })

    render(<AdminLodgingProfilesTable rows={[row]} />)

    await userEvent.click(screen.getByRole('button', { name: 'Publier' }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledWith(
      `/api/admin/lodgings/public-profiles/${row.id}/publish`,
      {
        method: 'POST',
        headers: undefined,
        body: undefined,
      },
    ))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
  })

  it('AC-06-03: shows the API error when request changes fails', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      json: async () => ({
        error: {
          message: 'Fiche logement introuvable',
        },
      }),
    })

    render(<AdminLodgingProfilesTable rows={[row]} />)

    await userEvent.click(screen.getByRole('button', { name: 'Corrections' }))

    await waitFor(() => expect(screen.getByText('Fiche logement introuvable')).toBeInTheDocument())
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
