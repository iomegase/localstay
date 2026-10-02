/** @jest-environment jsdom */

import { act, fireEvent, render, screen } from '@testing-library/react'
import { ImageUpload } from '@/shared/components/ImageUpload'

const file = (name: string) => new File(['x'], name, { type: 'image/png' })

describe('054 AC-05-03 — multiple image upload', () => {
  const originalFetch = globalThis.fetch
  afterEach(() => { globalThis.fetch = originalFetch })

  it('uploads several files in order, up to the allowed count', async () => {
    let call = 0
    globalThis.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ url: `/u${++call}.webp` }) })) as unknown as typeof fetch
    const onUploadedMany = jest.fn()
    const { container } = render(
      <ImageUpload endpoint="/api/x" maxFiles={3} onUploaded={jest.fn()} onUploadedMany={onUploadedMany} label="Ajouter des photos" />,
    )
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toHaveAttribute('multiple')

    await act(async () => {
      fireEvent.change(input, { target: { files: [file('a.png'), file('b.png'), file('c.png'), file('d.png')] } })
    })

    expect(globalThis.fetch).toHaveBeenCalledTimes(3)
    expect(onUploadedMany).toHaveBeenCalledWith(['/u1.webp', '/u2.webp', '/u3.webp'])
    expect(screen.getByText('Seules les 3 premières images ont été ajoutées.')).toBeInTheDocument()
  })

  it('keeps single upload by default', () => {
    const { container } = render(<ImageUpload endpoint="/api/x" onUploaded={jest.fn()} />)
    expect(container.querySelector('input[type="file"]')).not.toHaveAttribute('multiple')
  })
})
