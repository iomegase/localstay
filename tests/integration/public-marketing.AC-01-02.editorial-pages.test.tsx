/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'

jest.mock('next/navigation', () => ({ redirect: jest.fn() }))

import ConceptPage from '@/app/(public)/concept/page'
import ConnexionPage from '@/app/(public)/connexion/page'
import OwnerContactPage from '@/app/(public)/confier-mon-logement/page'
import SeminarsPage from '@/app/(public)/seminaires/page'
import { redirect } from 'next/navigation'

describe('031-public-marketing-site editorial routes', () => {
  it('renders the concept page from the approved mockup', () => {
    render(<ConceptPage />)
    expect(screen.getByRole('heading', { level: 1, name: /Une conciergerie humaine/i })).toBeInTheDocument()
  })

  it('renders the seminars page from the approved mockup', () => {
    render(<SeminarsPage />)
    expect(screen.getByRole('heading', { level: 1, name: /Réunir vos équipes/i })).toBeInTheDocument()
    expect(screen.getByTestId('seminar-hero')).toHaveClass(
      'min-[761px]:min-h-[590px]',
      'min-[761px]:px-[54px]',
      'min-[761px]:pb-[42px]',
      'min-[761px]:pt-[58px]',
    )
    expect(screen.getAllByTestId('seminar-service-card')).toHaveLength(4)
    expect(screen.getByTestId('seminar-place')).toHaveTextContent('Le bon cadre')
    expect(screen.getByTestId('seminar-process')).toHaveTextContent('Quatre étapes, aucun flou')
  })

  it('keeps the owner contact form as a mailto flow without server persistence', () => {
    render(<OwnerContactPage />)
    expect(screen.getByRole('form')).toHaveAttribute(
      'action',
      'mailto:bonjour@mystay.city?subject=Demande%20propri%C3%A9taire%20MyStay',
    )
  })

  it('redirects the mockup connexion alias to the existing Supabase login', () => {
    ConnexionPage()
    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })
})
