/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { YouTubeEmbed } from '@/shared/components/YouTubeEmbed'

describe('YouTubeEmbed', () => {
  it('renders a click-to-load facade (thumbnail, no iframe) initially', () => {
    render(<YouTubeEmbed url="https://youtu.be/dQw4w9WgXcQ" title="Visite du logement" />)

    const button = screen.getByRole('button', { name: /visite du logement/i })
    expect(button).toBeInTheDocument()
    const thumb = document.querySelector('img')
    expect(thumb).toHaveAttribute('src', 'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg')
    expect(document.querySelector('iframe')).toBeNull()
  })

  it('loads the privacy-enhanced iframe with autoplay on click', async () => {
    const user = userEvent.setup()
    render(<YouTubeEmbed url="https://youtu.be/dQw4w9WgXcQ" title="Visite" />)

    await user.click(screen.getByRole('button', { name: /visite/i }))

    const iframe = document.querySelector('iframe')
    expect(iframe).not.toBeNull()
    expect(iframe).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1',
    )
  })

  it('renders nothing for a non-YouTube url', () => {
    const { container } = render(<YouTubeEmbed url="https://vimeo.com/123" title="X" />)
    expect(container).toBeEmptyDOMElement()
  })
})
