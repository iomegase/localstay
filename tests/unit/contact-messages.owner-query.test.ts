const mockFindManyContactMessages = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    contactMessage: {
      findMany: (...args: unknown[]) => mockFindManyContactMessages(...args),
    },
  },
}))

import { listOwnerContactMessages } from '@/features/contact-messages/queries/contact-messages'

describe('024 owner contact message query', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindManyContactMessages.mockResolvedValue([])
  })

  it('AC-04-02/BR-11: filters messages to the connected owner and owner destination', async () => {
    await listOwnerContactMessages('owner-1')

    expect(mockFindManyContactMessages).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          owner_id: 'owner-1',
          destination: 'owner',
          deleted_at: null,
        },
      }),
    )
  })
})
