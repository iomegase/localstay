/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { OpenPhotoCredits } from '@/shared/components/OpenPhotoCredits'
import { groupOpenPhotoCredits } from '@/shared/lib/open-photo-credits'

const credit = (n: number, author = 'Rémih', license = 'CC BY-SA 4.0') => ({
  photo_url: `https://upload.wikimedia.org/${n}.jpg`,
  author,
  license,
  license_url: 'https://creativecommons.org/licenses/by-sa/4.0',
  source_url: `https://commons.wikimedia.org/wiki/File:${n}.jpg`,
})

// Spec 101 AC-02-04/05 — crédits des photos Wikimedia Commons sur les fiches.
describe('101 AC-02-05 — crédits photos', () => {
  it('regroupe par auteur et licence, ne crédite que les photos affichées', () => {
    const groups = groupOpenPhotoCredits(
      [credit(1), credit(2), credit(3, 'chisloup', 'CC BY 3.0'), credit(4), { broken: true }],
      ['https://upload.wikimedia.org/1.jpg', 'https://upload.wikimedia.org/2.jpg', 'https://upload.wikimedia.org/3.jpg'],
    )
    expect(groups).toEqual([
      { author: 'Rémih', license: 'CC BY-SA 4.0', license_url: 'https://creativecommons.org/licenses/by-sa/4.0', sources: ['https://commons.wikimedia.org/wiki/File:1.jpg', 'https://commons.wikimedia.org/wiki/File:2.jpg'] },
      { author: 'chisloup', license: 'CC BY 3.0', license_url: 'https://creativecommons.org/licenses/by-sa/4.0', sources: ['https://commons.wikimedia.org/wiki/File:3.jpg'] },
    ])
  })

  it('affiche « Photos : Auteur (Licence) [1] [2] » avec les liens', () => {
    render(<OpenPhotoCredits label="Photos :" credits={groupOpenPhotoCredits([credit(1), credit(2)], ['https://upload.wikimedia.org/1.jpg', 'https://upload.wikimedia.org/2.jpg'])} />)

    expect(screen.getByTestId('poi-open-photo-credits')).toHaveTextContent('Photos : Rémih (CC BY-SA 4.0) [1] [2]')
    expect(screen.getByRole('link', { name: 'CC BY-SA 4.0' })).toHaveAttribute('href', 'https://creativecommons.org/licenses/by-sa/4.0')
    expect(screen.getByRole('link', { name: 'Rémih — photo 2 sur Wikimedia Commons' })).toHaveAttribute('href', 'https://commons.wikimedia.org/wiki/File:2.jpg')
  })

  it('rien sans crédit', () => {
    const { container } = render(<OpenPhotoCredits label="Photos :" credits={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
