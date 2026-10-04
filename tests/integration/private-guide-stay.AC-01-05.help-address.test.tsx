/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { GuideHelpView } from '@/features/guide-app/components/stay/GuideHelpView'
import { buildStayLodging } from '../support/guide-stay-lodging'

it.each([false, true])('AC-01-05: help omits the address section (demo=%s)', demo => {
  render(<GuideHelpView lodging={buildStayLodging()} demo={demo} />)
  expect(screen.getByRole('heading', { name: 'Infos pratiques' })).toBeInTheDocument()
  expect(screen.getByTestId('guide-practical-emergency')).toBeInTheDocument()
  expect(screen.getByTestId('guide-practical-concierge')).toBeInTheDocument()
  expect(screen.queryByRole('heading', { name: 'Adresse' })).not.toBeInTheDocument()
  expect(screen.queryByTestId('arrival-address')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: "Copier l'adresse" })).not.toBeInTheDocument()
  expect(screen.queryByRole('link', { name: 'Ouvrir dans Maps' })).not.toBeInTheDocument()
})

it('AC-01-05: demo help shows contacts without external links', () => {
  render(<GuideHelpView lodging={buildStayLodging()} demo />)
  expect(screen.getByTestId('guide-practical-emergency')).toBeInTheDocument()
  expect(screen.getByTestId('guide-practical-concierge')).toBeInTheDocument()
  expect(screen.queryByRole('link')).not.toBeInTheDocument()
})
