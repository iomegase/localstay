import { checkPhotoUrl } from '@/features/poi-photos/services/check-photo-url'

function res(status: number, contentType: string | null): Response {
  return {
    status,
    headers: { get: (h: string) => (h.toLowerCase() === 'content-type' ? contentType : null) },
  } as unknown as Response
}

describe('checkPhotoUrl', () => {
  const realFetch = global.fetch
  afterEach(() => {
    global.fetch = realFetch
  })

  it('returns alive when HEAD is a 200 image', async () => {
    global.fetch = jest.fn().mockResolvedValue(res(200, 'image/jpeg')) as unknown as typeof fetch
    await expect(checkPhotoUrl('https://x/a.jpg')).resolves.toBe('alive')
  })

  it('returns dead when HEAD is a 404', async () => {
    global.fetch = jest.fn().mockResolvedValue(res(404, null)) as unknown as typeof fetch
    await expect(checkPhotoUrl('https://x/a.jpg')).resolves.toBe('dead')
  })

  it('falls back to GET when HEAD is unsupported (405)', async () => {
    const fetchMock = jest
      .fn()
      .mockResolvedValueOnce(res(405, null))
      .mockResolvedValueOnce(res(200, 'image/png'))
    global.fetch = fetchMock as unknown as typeof fetch
    await expect(checkPhotoUrl('https://x/a.jpg')).resolves.toBe('alive')
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  it('returns dead on a network error / timeout', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('ENOTFOUND')) as unknown as typeof fetch
    await expect(checkPhotoUrl('https://x/a.jpg')).resolves.toBe('dead')
  })
})
