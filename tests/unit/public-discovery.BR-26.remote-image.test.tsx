/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import { RemotePoiImage } from '@/features/public-discovery/components/RemotePoiImage'

describe('041 BR-26 remote POI image fallback', () => {
  it('keeps a successful arbitrary HTTPS source and its privacy/loading attributes', () => {
    render(
      <RemotePoiImage
        src="https://media.unlisted.test/poi.jpg"
        alt="Le musée à Saint-Gervais"
        width={800}
        height={600}
        loading="lazy"
        className="object-cover"
      />,
    )

    expect(screen.getByRole('img')).toHaveAttribute('src', 'https://media.unlisted.test/poi.jpg')
    expect(screen.getByRole('img')).toHaveAttribute('alt', 'Le musée à Saint-Gervais')
    expect(screen.getByRole('img')).toHaveAttribute('width', '800')
    expect(screen.getByRole('img')).toHaveAttribute('height', '600')
    expect(screen.getByRole('img')).toHaveAttribute('loading', 'lazy')
    expect(screen.getByRole('img')).toHaveAttribute('referrerpolicy', 'no-referrer')
  })

  it('switches a failed remote source once to the local MyStay fallback without changing semantics', () => {
    const { rerender } = render(
      <RemotePoiImage
        src="http://media.unlisted.test/blocked.jpg"
        alt="Le musée à Saint-Gervais"
        width={1200}
        height={900}
        loading="eager"
        fetchPriority="high"
        className="object-cover"
      />,
    )
    const image = screen.getByRole('img')

    fireEvent.error(image)
    expect(image).toHaveAttribute('src', '/og-mystay.png')
    expect(image).toHaveAttribute('alt', 'Le musée à Saint-Gervais')
    expect(image).toHaveAttribute('loading', 'eager')
    expect(image).toHaveAttribute('fetchpriority', 'high')

    fireEvent.error(image)
    expect(image).toHaveAttribute('src', '/og-mystay.png')

    rerender(
      <RemotePoiImage
        src="https://media.unlisted.test/replacement.jpg"
        alt="Le musée à Saint-Gervais"
        width={1200}
        height={900}
        loading="eager"
        fetchPriority="high"
        className="object-cover"
      />,
    )
    expect(image).toHaveAttribute('src', 'https://media.unlisted.test/replacement.jpg')
  })
})
