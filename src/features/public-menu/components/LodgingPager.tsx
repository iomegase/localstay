'use client'

import { Children, useEffect, useRef, useState, type ReactNode } from 'react'

interface LodgingPagerProps {
  titles: [string, string]
  children: ReactNode
}

export function LodgingPager({ titles, children }: LodgingPagerProps) {
  const panels = Children.toArray(children)
  const [active, setActive] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)
  const panelRefs = useRef<Array<HTMLDivElement | null>>([])

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return
          const index = panelRefs.current.findIndex(panel => panel === entry.target)
          if (index !== -1) setActive(index)
        })
      },
      { root: scrollerRef.current, threshold: 0.5 },
    )
    panelRefs.current.forEach(panel => panel && observer.observe(panel))
    return () => observer.disconnect()
  }, [])

  function goTo(index: number) {
    panelRefs.current[index]?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' })
  }

  return (
    <div className="rounded-[32px] bg-white pt-4">
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
        ref={scrollerRef}
        role="group"
        aria-roledescription="carrousel"
        className="flex snap-x snap-mandatory overflow-x-auto scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {panels.map((panel, index) => (
          <div
            key={index}
            ref={node => {
              panelRefs.current[index] = node
            }}
            className="min-h-[50vh] w-full shrink-0 snap-start overflow-y-auto px-4"
          >
            {panel}
          </div>
        ))}
      </div>
    </div>
  )
}
