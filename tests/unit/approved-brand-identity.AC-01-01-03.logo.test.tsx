/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { MyStayLogo } from '@/shared/components/brand/MyStayLogo'

function decodedSource() {
  return decodeURIComponent(
    screen.getByAltText('MyStay').getAttribute('src') ?? '',
  )
}

describe('MyStayLogo approved variants', () => {
  it('uses the approved horizontal color logo on light backgrounds', () => {
    render(<MyStayLogo form="horizontal" tone="standard" />)

    expect(decodedSource()).toContain(
      '/mystay-logo-approved/mystay-logo-approved@4x.png',
    )
  })

  it('uses the approved horizontal reversed logo on dark backgrounds', () => {
    render(<MyStayLogo form="horizontal" tone="reversed" />)

    expect(decodedSource()).toContain(
      '/mystay-logo-approved/mystay-logo-approved-reversed@4x.png',
    )
  })

  it.each(['standard', 'reversed'] as const)(
    'uses the approved monogram for the %s compact variant',
    tone => {
      render(<MyStayLogo form="mark" tone={tone} />)

      expect(decodedSource()).toContain(
        '/mystay-logo-approved/mystay-mark-approved@4x.png',
      )
    },
  )

  it('forwards layout classes and the accessible label', () => {
    render(
      <MyStayLogo
        form="horizontal"
        tone="standard"
        className="h-10 w-auto"
        alt="Logo officiel MyStay"
      />,
    )

    expect(screen.getByAltText('Logo officiel MyStay')).toHaveClass(
      'h-10',
      'w-auto',
    )
  })
})
