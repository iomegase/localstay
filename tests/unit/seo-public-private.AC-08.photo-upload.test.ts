/** @jest-environment jsdom */
import { uploadPhotos } from '@/features/lodging-showcase/lib/upload-photos'

it('AC-08-04 builds upload alt from room and lodging instead of a UUID filename', async () => {
  const photo = {
    id: 'b76af918-ab21-40c3-8b59-708f61572444', url: 'https://example.com/photo.jpg',
    alt: 'Chambre 2 — Chalet Hygge', room_type: 'bedroom', room_label: 'Chambre 2',
    sort_order: 0, is_cover: true,
  }
  const originalFetch = global.fetch
  const fetchMock = jest.fn().mockResolvedValue({ ok: true, json: async () => photo })
  global.fetch = fetchMock
  try {
    const uploaded = jest.fn()
    const failures = await uploadPhotos({
      apiBase: '/api/admin/lodgings/lodging-1',
      files: [new File(['image'], '45bd1b02-d2a0-42f2-ad5b-d93a2e753b9d.jpg', { type: 'image/jpeg' })],
      alt: '', title: 'Chalet Hygge',
      category: { value: 'bedroom::Chambre 2', label: 'Chambre 2', roomType: 'bedroom', roomLabel: 'Chambre 2' },
      onUploaded: uploaded, onProgress: jest.fn(),
    })
    expect(failures).toEqual([])
    const request = fetchMock.mock.calls[0][1] as { body: FormData }
    expect(request.body.get('alt')).toBe('Chambre 2 — Chalet Hygge')
    expect(uploaded).toHaveBeenCalledWith(photo)
  } finally {
    global.fetch = originalFetch
  }
})
