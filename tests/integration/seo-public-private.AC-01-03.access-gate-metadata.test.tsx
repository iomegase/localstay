/** @jest-environment node */

import { metadata } from '@/app/acces-reserve/page'

const expectedRobots = {
  index: false,
  follow: false,
  noarchive: true,
}

describe('042 SEO private metadata — AC-01-03', () => {
  it('keeps the access gate non-indexable without a canonical duplicate', () => {
    expect(metadata.robots).toEqual(expectedRobots)
    expect(metadata.alternates).toBeUndefined()
    expect(metadata.title).toBe('Accès par lien')
  })
})
