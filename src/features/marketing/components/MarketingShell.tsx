import type { ReactNode } from 'react'
import { MarketingFooter } from './MarketingFooter'
import { MarketingHeader } from './MarketingHeader'

export {
  marketingContainerClass,
  marketingDarkButtonClass,
  marketingPrimaryButtonClass,
} from './marketing-styles'

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div
      data-testid="marketing-stage"
      className="min-h-[100dvh] overflow-x-clip bg-white text-slate-800 md:bg-[#f4f4f3] md:px-5 md:py-6 xl:px-6 xl:py-5"
    >
      <div
        data-testid="marketing-surface"
        className="mx-auto min-h-[100dvh] w-full overflow-hidden bg-white md:min-h-0 md:max-w-[1184px] md:rounded-[42px] md:pt-[17px] md:shadow-[0_30px_90px_rgba(0,0,0,0.28)] xl:rounded-[34px]"
      >
        <MarketingHeader />
        <main>{children}</main>
        <MarketingFooter />
      </div>
    </div>
  )
}

export function MarketingEyebrow({
  children,
  light = false,
}: {
  children: ReactNode
  light?: boolean
}) {
  return (
    <span
      className={`mb-4 flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.22em] ${
        light ? 'text-slate-200' : 'text-slate-500'
      }`}
    >
      <span aria-hidden="true" className="h-0.5 w-4 bg-pink-600" />
      {children}
    </span>
  )
}
