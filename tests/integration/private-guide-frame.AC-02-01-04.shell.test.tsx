/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { PrivateGuideFrame } from '@/features/guide-app/components/PrivateGuideFrame'

jest.mock('next/navigation', () => ({ redirect: jest.fn() }))
jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => ({
    lodgingId: 'lodging-1',
    citySlug: 'saint-gervais-les-bains',
  })),
}))
jest.mock('@/features/guide-app/queries/private-guide-data', () => ({
  getPrivateGuideData: jest.fn(async () => ({
    lodging: { id: 'lodging-1', name: 'Le Chalet Hygge' },
    pois: [],
  })),
}))
jest.mock('@/features/analytics/lib/record-qr-scan', () => ({
  recordQrScanIfPresent: jest.fn(),
}))
jest.mock('@/features/guide-app/components/GuideApp', () => ({
  GuideApp: () => <div data-testid="shared-guide-app" />,
}))

import { PrivateGuidePage } from '@/features/guide-app/components/PrivateGuidePage'

describe('039-private-guide smartphone frame', () => {
  it('provides a reusable clipped phone viewport for contained guide views', () => {
    render(
      <PrivateGuideFrame>
        <div data-testid="frame-content" />
      </PrivateGuideFrame>,
    )

    expect(screen.getByTestId('private-guide-stage')).toHaveClass(
      'min-h-[100dvh]',
      'items-center',
      'justify-center',
      'bg-slate-200',
      'p-3',
    )
    expect(screen.getByTestId('private-guide-shell')).toHaveClass(
      'h-[min(820px,calc(100dvh-24px))]',
      'w-[min(430px,calc(100vw-24px))]',
      'rounded-[2.75rem]',
      'border-[5px]',
      'border-white',
      'overflow-hidden',
      'shadow-[0_35px_120px_rgba(15,23,42,0.38)]',
    )
    expect(screen.getByTestId('private-guide-viewport')).toHaveClass(
      'h-full',
      'min-h-0',
      'overflow-hidden',
    )
    expect(screen.getByTestId('frame-content')).toBeInTheDocument()
  })

  it('constrains every private guide inside a white rounded phone frame', async () => {
    render(await PrivateGuidePage())

    expect(screen.getByTestId('private-guide-stage')).toHaveClass(
      'min-h-[100dvh]',
      'items-center',
      'justify-center',
      'bg-slate-200',
      'p-3',
    )
    expect(screen.getByTestId('private-guide-shell')).toHaveClass(
      'h-[min(820px,calc(100dvh-24px))]',
      'w-[min(430px,calc(100vw-24px))]',
      'rounded-[2.75rem]',
      'border-[5px]',
      'border-white',
      'overflow-hidden',
    )
  })
})
