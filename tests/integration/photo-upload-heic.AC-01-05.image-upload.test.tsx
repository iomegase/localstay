/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { ImageUpload } from '@/shared/components/ImageUpload'

const mockPrepare = jest.fn()
jest.mock('@/shared/lib/prepare-image-upload', () => ({
  ...jest.requireActual('@/shared/lib/prepare-image-upload'),
  prepareImageForUpload: (...args: unknown[]) => mockPrepare(...args),
}))

// Spec 085 — envoi de photos depuis le Guide.
describe('085 — ImageUpload', () => {
  const heic = new File([new Uint8Array(3)], 'IMG_1234.HEIC', { type: 'image/heic' })
  const jpeg = new File([new Uint8Array(2)], 'IMG_1234.jpg', { type: 'image/jpeg' })

  beforeEach(() => {
    jest.clearAllMocks()
    mockPrepare.mockResolvedValue(jpeg)
  })

  it('AC-03 : le sélecteur accepte les HEIC', () => {
    const { container } = render(<ImageUpload endpoint="/api/x" onUploaded={jest.fn()} />)
    expect(container.querySelector('input[type="file"]')!.getAttribute('accept')).toContain('.heic')
  })

  it('AC-01 : la photo est préparée (HEIC → JPEG) puis envoyée', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, status: 201, json: async () => ({ url: 'https://cdn.test/p.webp' }) })) as unknown as typeof fetch
    const onUploaded = jest.fn()
    const { container } = render(<ImageUpload endpoint="/api/x" onUploaded={onUploaded} />)

    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [heic] } })

    await waitFor(() => expect(onUploaded).toHaveBeenCalledWith('https://cdn.test/p.webp'))
    expect(mockPrepare).toHaveBeenCalledWith(heic)
    const body = (global.fetch as jest.Mock).mock.calls[0][1].body as FormData
    expect((body.get('file') as File).name).toBe('IMG_1234.jpg')
  })

  it('AC-05 : photo refusée car trop lourde (413) → message clair', async () => {
    global.fetch = jest.fn(async () => ({ ok: false, status: 413, json: async () => { throw new Error('html') } })) as unknown as typeof fetch
    const { container } = render(<ImageUpload endpoint="/api/x" onUploaded={jest.fn()} />)

    fireEvent.change(container.querySelector('input[type="file"]')!, { target: { files: [heic] } })

    expect(await screen.findByText('Photo trop lourde. Réessayez avec une photo plus légère.')).toBeInTheDocument()
  })
})
