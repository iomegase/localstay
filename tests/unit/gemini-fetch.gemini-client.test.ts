const mockGenerateContent = jest.fn()

jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn(() => ({
    getGenerativeModel: jest.fn(() => ({
      generateContent: mockGenerateContent,
    })),
  })),
}))

import { callGemini } from '@/features/gemini-fetch/services/gemini-client'

describe('callGemini', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    process.env.GEMINI_API_KEY = 'test-key'
  })

  it('accepts null values inside per-day hours returned by Gemini', async () => {
    mockGenerateContent.mockResolvedValueOnce({
      response: {
        text: () => JSON.stringify({
          pois: [
            {
              name: 'Brasserie Test',
              address: '1 rue Test',
              phone: null,
              website: null,
              description: 'Une adresse locale.',
              subcategory: null,
              hours: {
                mon: '09:00-19:00',
                sun: null,
              },
              tags: [],
            },
          ],
        }),
      },
    })

    await expect(callGemini('prompt')).resolves.toEqual([
      expect.objectContaining({
        name: 'Brasserie Test',
        hours: {
          mon: '09:00-19:00',
          sun: null,
        },
      }),
    ])
  })
})
