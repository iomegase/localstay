import {
  MarketingEyebrow,
  marketingContainerClass,
} from './MarketingShell'

type MarketingFaqItem = {
  question: string
  answer: string
}

export function MarketingFaqSection({
  items,
  title = 'Comprendre simplement notre fonctionnement.',
}: {
  items: readonly MarketingFaqItem[]
  title?: string
}) {
  return (
    <section
      data-testid="marketing-faq-section"
      className={`${marketingContainerClass} pb-20 pt-10 sm:pb-28 xl:py-[92px]`}
    >
      <div className="grid gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-20">
        <div>
          <MarketingEyebrow>Questions fréquentes</MarketingEyebrow>

          <h2 className="max-w-[430px] text-3xl font-bold leading-[1.15] tracking-[-0.05em] sm:text-[44px] xl:text-[40px]">
            {title}
          </h2>
        </div>

        <div className="flex flex-col gap-3">
          {items.map(item => (
            <details
              key={item.question}
              name="mystay-faq"
              className="group overflow-hidden rounded-[20px] bg-[#f8f7f5] transition-all duration-300 open:bg-white open:shadow-[0_14px_36px_rgba(15,23,42,0.06)]"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 px-5 py-5 text-[15px] font-bold leading-[1.4] tracking-[-0.025em] text-slate-900 outline-none sm:px-6 sm:py-6 [&::-webkit-details-marker]:hidden">
                <span className="max-w-[560px]">{item.question}</span>

                <span
                  aria-hidden="true"
                  data-testid="marketing-faq-toggle"
                  className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_4px_14px_rgba(15,23,42,0.05)] transition-all duration-300 group-open:bg-pink-600"
                >
                  <span
                    data-testid="marketing-faq-plus"
                    className="relative block size-4 transition-transform duration-300 before:absolute before:left-1/2 before:top-1/2 before:h-[1.5px] before:w-4 before:-translate-x-1/2 before:-translate-y-1/2 before:rounded-full before:bg-slate-500 before:content-[''] after:absolute after:left-1/2 after:top-1/2 after:h-4 after:w-[1.5px] after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full after:bg-slate-500 after:content-[''] group-open:rotate-45 group-open:before:bg-white group-open:after:bg-white"
                  />
                </span>
              </summary>

              <div className="px-5 pb-6 pr-16 sm:px-6 sm:pb-7 sm:pr-20">
                <p className="max-w-[600px] text-[13px] leading-7 text-slate-500">
                  {item.answer}
                </p>
              </div>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
