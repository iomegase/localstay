import type { Metadata } from 'next'
import * as authLayoutModule from '@/app/auth/layout'

describe('042 SEO auth metadata — AC-01-05', () => {
  it('applies the private robots policy from the shared auth layout', () => {
    const authLayout = authLayoutModule as typeof authLayoutModule & {
      metadata?: Metadata
    }

    expect(authLayout.metadata).toEqual({
      title: 'Authentification',
      robots: {
        index: false,
        follow: false,
        noarchive: true,
      },
    })
  })
})
