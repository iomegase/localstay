/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { YouTubeUrlField } from '@/features/guide-customization/components/YouTubeUrlField'

function Harness() {
  const [value, setValue] = useState<string | null>(null)
  return <YouTubeUrlField label="Vidéo" value={value} onChange={setValue} />
}

describe('YouTubeUrlField', () => {
  it('shows an error for a non-YouTube url and no thumbnail', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('textbox'), 'https://vimeo.com/123')

    expect(screen.getByText(/lien youtube invalide/i)).toBeInTheDocument()
    expect(document.querySelector('img')).toBeNull()
  })

  it('shows a thumbnail preview and no error for a valid YouTube url', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByRole('textbox'), 'https://youtu.be/dQw4w9WgXcQ')

    expect(screen.queryByText(/lien youtube invalide/i)).toBeNull()
    expect(document.querySelector('img')).toHaveAttribute(
      'src',
      'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
    )
  })
})
