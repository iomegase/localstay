/** @jest-environment node */

import { fetchYouTubeOrientation } from '@/shared/lib/youtube-orientation'

const fetchMock = jest.fn()

function jsonResponse(body: unknown, ok = true) {
  return { ok, json: async () => body } as Response
}

describe('044 BR-09 / AC-01-07 — YouTube orientation via oEmbed', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    global.fetch = fetchMock as unknown as typeof fetch
  })

  it('queries oEmbed with the /shorts/ form of the video URL', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ width: 200, height: 113 }))
    await fetchYouTubeOrientation('YVxMT9wAPRA')
    expect(fetchMock).toHaveBeenCalledWith(
      'https://www.youtube.com/oembed?url=https%3A%2F%2Fwww.youtube.com%2Fshorts%2FYVxMT9wAPRA&format=json',
      expect.objectContaining({ next: { revalidate: 86_400 } }),
    )
  })

  it('returns landscape for a 16:9 video', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ width: 200, height: 113 }))
    await expect(fetchYouTubeOrientation('YVxMT9wAPRA')).resolves.toBe('landscape')
  })

  it('returns portrait for a Short', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ width: 113, height: 200 }))
    await expect(fetchYouTubeOrientation('-B8ME5a_5HQ')).resolves.toBe('portrait')
  })

  it.each([
    ['an HTTP error', () => fetchMock.mockResolvedValue(jsonResponse({}, false))],
    ['an invalid payload', () => fetchMock.mockResolvedValue(jsonResponse({ width: 'x' }))],
    ['a network failure', () => fetchMock.mockRejectedValue(new Error('timeout'))],
  ])('falls back to portrait on %s', async (_label, arrange) => {
    arrange()
    await expect(fetchYouTubeOrientation('YVxMT9wAPRA')).resolves.toBe('portrait')
  })
})
