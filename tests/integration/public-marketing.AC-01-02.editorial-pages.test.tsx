/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react'

jest.mock('next/navigation', () => ({ redirect: jest.fn(), permanentRedirect: jest.fn(), usePathname: () => '/seminaires' }))
jest.mock('@/features/local-seo/queries/landing-pages', () => ({
  listPublishedLocalLandingSummaries: jest.fn(async () => []),
}))

import ConceptPage from '@/app/(public)/concept/page'
import ConnexionPage from '@/app/(public)/connexion/page'
import OwnerContactPage from '@/app/(public)/confier-mon-logement/page'
import SeminarsPage from '@/app/(public)/seminaires/page'
import { redirect, permanentRedirect } from 'next/navigation'

describe('031-public-marketing-site editorial routes', () => {
  it('permanently redirects the retired concept page to home', () => {
    ConceptPage()
    expect(permanentRedirect).toHaveBeenCalledWith('/')
  })

  it('renders the seminars page from the approved mockup', async () => {
    render(await SeminarsPage())
    expect(screen.getByRole('heading', { level: 1, name: /Votre séminaire face au Mont-Blanc/i })).toBeInTheDocument()
    expect(screen.getByTestId('seminar-hero')).toHaveClass(
      'min-[761px]:min-h-[590px]',
      'min-[761px]:px-[54px]',
      'min-[761px]:pb-[42px]',
      'min-[761px]:pt-[58px]',
    )
    expect(screen.getByTestId('seminar-hero').querySelector('img')).not.toBeInTheDocument()
    expect(screen.getByTestId('seminar-hero')).toHaveClass('text-slate-900')
    expect(screen.getByText('Séminaires d’entreprise · Pays du Mont-Blanc')).toHaveClass('text-slate-500')
    expect(screen.getByTestId('seminar-hero-facts')).toHaveClass('text-slate-600')
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('text-slate-900')
    expect(
      within(screen.getByTestId('seminar-hero')).getByRole('button', {
        name: 'Recevoir une proposition',
      }),
    ).toHaveClass('bg-pink-600')
    expect(screen.getAllByTestId('seminar-service-card')).toHaveLength(4)
    expect(screen.getByTestId('seminar-place')).toHaveTextContent('Le bon cadre')
    expect(screen.getByTestId('seminar-process')).toHaveTextContent('quatre étapes claires')
  })

  it('uses the persistent owner contact flow without mailto', async () => {
    render(await OwnerContactPage())
    expect(screen.getByRole('form')).not.toHaveAttribute('action')
    expect(screen.getByRole('button', { name: 'Envoyer ma demande' })).toBeInTheDocument()
  })

  it('redirects the mockup connexion alias to the existing Supabase login', () => {
    ConnexionPage()
    expect(redirect).toHaveBeenCalledWith('/auth/login')
  })
})

jest.mock('@/features/lodging-showcase/queries/seminar-lodgings', () => ({ listSeminarLodgings: jest.fn().mockResolvedValue([]) }))
