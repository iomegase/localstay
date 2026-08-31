/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { HeroShareButton } from '@/features/categories/components/HeroShareButton'

describe('HeroShareButton — private POI guide AC-02-04', () => {
  const poiPath = '/guide/saint-gervais-les-bains/restaurants/le-bistrot'

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('opens the native share sheet with the private POI title and absolute URL', async () => {
    const share = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: share,
    })

    render(<HeroShareButton poiName="Le Bistrot" poiUrl={poiPath} />)
    fireEvent.click(screen.getByRole('button', { name: 'Partager' }))

    await waitFor(() => {
      expect(share).toHaveBeenCalledWith({
        title: 'Le Bistrot',
        url: `http://localhost${poiPath}`,
      })
    })
  })

  it('copies the private POI URL when native sharing is unavailable', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: undefined,
    })
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText },
    })

    render(<HeroShareButton poiName="Le Bistrot" poiUrl={poiPath} />)
    fireEvent.click(screen.getByRole('button', { name: 'Partager' }))

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(`http://localhost${poiPath}`)
    })
  })
})
