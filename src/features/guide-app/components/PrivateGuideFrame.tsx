import type { ReactNode } from 'react'

type PrivateGuideFrameProps = {
  children: ReactNode
}

// Sur téléphone (< 480px) le guide occupe tout l'écran (edge-to-edge, safe-areas
// respectées). À partir de 480px on simule un joli cadre de téléphone centré.
export function PrivateGuideFrame({ children }: PrivateGuideFrameProps) {
  return (
    <div
      data-testid="private-guide-stage"
      className="flex min-h-[100dvh] w-full min-[480px]:items-center min-[480px]:justify-center min-[480px]:bg-slate-200 min-[480px]:p-3"
    >
      <div
        data-testid="private-guide-shell"
        className="h-[100dvh] w-full overflow-hidden bg-white min-[480px]:h-[min(820px,calc(100dvh-24px))] min-[480px]:w-[min(430px,calc(100vw-24px))] min-[480px]:rounded-[2.75rem] min-[480px]:border-[5px] min-[480px]:border-white min-[480px]:shadow-[0_35px_120px_rgba(15,23,42,0.38)]"
      >
        <div
          data-testid="private-guide-viewport"
          className="h-full min-h-0 overflow-hidden pt-[env(safe-area-inset-top)] min-[480px]:pt-0"
        >
          {children}
        </div>
      </div>
    </div>
  )
}
