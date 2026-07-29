/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { MarketingShell } from '@/features/marketing/components/MarketingShell'

describe('031-public-marketing-site editorial surface', () => {
  it('groups the header, main and footer inside the rounded desktop SiteFrame', () => {
    render(
      <MarketingShell>
        <p>Contenu éditorial</p>
      </MarketingShell>,
    )

    const stage = screen.getByTestId('marketing-stage')
    const surface = screen.getByTestId('marketing-surface')

    expect(stage).toHaveClass(
      'md:bg-[#f4f4f3]',
      'md:px-5',
      'md:py-6',
      'xl:px-6',
      'xl:py-5',
    )
    expect(surface).toHaveClass(
      'overflow-hidden',
      'md:max-w-[1184px]',
      'md:rounded-[42px]',
      'xl:rounded-[34px]',
      'md:shadow-[0_30px_90px_rgba(0,0,0,0.28)]',
    )
    expect(Array.from(surface.children).map(child => child.tagName)).toEqual([
      'HEADER',
      'MAIN',
      'FOOTER',
    ])

    const headerInner = screen.getByRole('banner').firstElementChild
    expect(headerInner).toHaveClass('xl:h-[62px]', 'xl:max-w-[944px]')
    expect(screen.getAllByAltText('MyStay')[0]).toHaveClass('xl:w-[118px]')
  })
})
