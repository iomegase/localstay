/** @jest-environment jsdom */

import { render, screen, within } from '@testing-library/react'

// Spec 097 : menu d'activités séminaire, vide dans ces tests.
jest.mock('@/features/seminar-activities/queries/public', () => ({ listPublicSeminarActivities: jest.fn().mockResolvedValue([]) }))
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
        name: 'Demander une estimation',
      }),
    ).toHaveClass('bg-pink-600')
    expect(screen.getAllByTestId('seminar-service-card')).toHaveLength(4)
    // AC-01-20 : cartes compactes, sans hauteur minimale ni titre poussé en bas.
    for (const card of screen.getAllByTestId('seminar-service-card')) {
      expect(card.className).not.toMatch(/min-h-\[/)
      expect(card.querySelector('h3')).not.toHaveClass('mt-auto')
      // AC-01-21 : icône et titre sur une même ligne, textes réduits.
      const heading = card.querySelector('h3')!
      expect(heading.parentElement).toHaveClass('flex', 'items-center')
      expect(heading.parentElement!.querySelector('svg')).not.toBeNull()
      expect(heading).toHaveClass('text-[13px]', 'min-[761px]:text-[15px]')
      expect(card.querySelector('p')).toHaveClass('text-[11px]')
    }
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
