'use client'

import { Children, useState, type ReactNode } from 'react'

interface LodgingPagerProps {
  titles: string[]
  children: ReactNode
}

export function LodgingPager({ titles, children }: LodgingPagerProps) {
  const panels = Children.toArray(children)
  const [active, setActive] = useState(0)
  const activePanel = panels[active] ?? panels[0] ?? null

  function goTo(index: number) {
    setActive(index)
  }

  return (
    <div className="rounded-[32px] bg-white pt-4 pb-6">
      <div className="mb-3 flex items-center justify-between px-5">
        <h2 className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-400">{titles[active]}</h2>
        <div className="flex items-center gap-2">
          {titles.map((title, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Aller à ${title}`}
              aria-current={index === active}
              onClick={() => goTo(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === active ? 'w-5 bg-charcoal' : 'w-2 bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>

      <div
        role="group"
        aria-roledescription="carrousel"
        className="px-4"
      >
        <div key={active} data-testid="lodging-pager-panel" className="w-full">
          {activePanel}
        </div>
      </div>
    </div>
  )
}
