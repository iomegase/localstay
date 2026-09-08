/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { AdminLandingPages } from '@/features/local-seo/components/AdminLandingPages'

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }))

describe('047 landing pages admin UI', () => {
  it('lists catalog cities and exposes the review form', () => {
    render(<AdminLandingPages initialPages={[
      { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains', published: true, reviews: [] },
      { slug: 'saint-nicolas-de-veroce', name: 'Saint-Nicolas-de-Véroce', published: true, reviews: [] },
      { slug: 'megeve', name: 'Megève', published: false, reviews: [] },
      { slug: 'combloux', name: 'Combloux', published: false, reviews: [] },
    ]} />)
    expect(screen.getByRole('heading', { name: 'Landing pages' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Saint-Nicolas-de-Véroce/ })).toBeInTheDocument()
    expect(screen.getByLabelText('Auteur')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Publier l’avis' })).toBeInTheDocument()
  })
})
