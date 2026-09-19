type MarketingHighlight = {
  title: string
  copy: string
}

export function MarketingHighlightCards({
  items,
  className = 'mt-12',
}: {
  items: readonly MarketingHighlight[]
  className?: string
}) {
  return (
    <div className={`${className} grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3`}>
      {items.map((item, index) => (
        <article
          key={item.title}
          data-testid="marketing-highlight-card"
          className={`
            group
            relative
            min-h-[178px]
            min-w-0
            overflow-hidden
            rounded-[22px]
            bg-[#f8f7f5]
            px-4
            py-5
            transition-all
            duration-300
            hover:-translate-y-[3px]
            hover:bg-white
            hover:shadow-[0_14px_32px_rgba(15,23,42,0.07)]
            sm:px-5
            ${index === items.length - 1 && items.length % 2 !== 0
              ? 'col-span-2 md:col-span-1'
              : ''}
          `}
        >
          <span
            aria-hidden="true"
            className="absolute left-4 top-0 h-[3px] w-10 rounded-b-full bg-pink-600 sm:left-5"
          />

          <div className="relative z-10 min-w-0">
            <h3 className="text-[14px] font-bold leading-[1.2] tracking-[-0.025em] text-slate-900 sm:text-[15px]">
              {item.title}
            </h3>

            <p className="mt-4 text-[12px] leading-[1.55] text-slate-500 sm:mt-5 sm:text-[12.5px] sm:leading-[1.6]">
              {item.copy}
            </p>
          </div>
        </article>
      ))}
    </div>
  )
}
