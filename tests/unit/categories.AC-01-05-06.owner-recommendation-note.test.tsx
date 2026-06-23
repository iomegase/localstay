/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { OwnerRecommendationNote } from '@/features/categories/components/OwnerRecommendationNote'

describe('OwnerRecommendationNote', () => {
  it('renders the contextual note as plain text', () => {
    render(<OwnerRecommendationNote note="<strong>Notre choix</strong>" />)

    expect(screen.getByRole('region', { name: 'Le mot de votre hôte' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Le mot de votre hôte' })).toBeInTheDocument()
    expect(screen.getByText('<strong>Notre choix</strong>')).toBeInTheDocument()
    expect(document.querySelector('strong')).toBeNull()
  })

  it('renders nothing without a note', () => {
    const { container } = render(<OwnerRecommendationNote note={null} />)

    expect(container).toBeEmptyDOMElement()
  })
})
