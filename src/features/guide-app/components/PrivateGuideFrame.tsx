import type { ReactNode } from 'react'

type PrivateGuideFrameProps = {
  children: ReactNode
}

export function PrivateGuideFrame({ children }: PrivateGuideFrameProps) {
  return (
    <div
      data-testid="private-guide-stage"
      className="flex min-h-[100dvh] w-full items-center justify-center bg-slate-200 p-3"
    >
      <div
        data-testid="private-guide-shell"
        className="h-[min(820px,calc(100dvh-24px))] w-[min(430px,calc(100vw-24px))] overflow-hidden rounded-[2.75rem] border-[5px] border-white bg-white shadow-[0_35px_120px_rgba(15,23,42,0.38)]"
      >
        <div
          data-testid="private-guide-viewport"
          className="h-full min-h-0 overflow-hidden"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
