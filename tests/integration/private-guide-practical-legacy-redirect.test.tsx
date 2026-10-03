/** @jest-environment jsdom */

const mockRedirect = jest.fn((destination: string) => {
  throw new Error(`REDIRECT:${destination}`)
})

jest.mock('next/navigation', () => ({
  redirect: (destination: string) => mockRedirect(destination),
}))

import PrivatePracticalInfoPage from '@/app/(public)/sejour/logement/informations-pratiques/page'

it('redirects the retired practical page to the house guide', () => {
  expect(() => PrivatePracticalInfoPage()).toThrow('REDIRECT:/sejour/logement/consignes')
  expect(mockRedirect).toHaveBeenCalledWith('/sejour/logement/consignes')
})
