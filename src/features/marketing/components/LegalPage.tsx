import Link from 'next/link'
import type { ReactNode } from 'react'
import { MarketingEyebrow, MarketingShell, marketingContainerClass } from './MarketingShell'

export type LegalSection = { id: string; title: string; content: ReactNode }

const documents = [
  { href: '/mentions-legales', label: 'Mentions légales' },
  { href: '/confidentialite', label: 'Confidentialité' },
  { href: '/cgu', label: 'CGU' },
] as const

/** Spec 031 US-06 — documents publics, aucune donnée de séjour. */
export function LegalPage({ title, intro, sections, pathname }: {
  title: string
  intro: string
  sections: LegalSection[]
  pathname: string
}) {
  return (
    <MarketingShell>
      <article className={`${marketingContainerClass} py-12 sm:py-20`}>
        <header className="max-w-[720px]">
          <MarketingEyebrow>En toute clarté</MarketingEyebrow>
          <h1 className="text-4xl font-bold tracking-[-0.055em] text-slate-800 sm:text-6xl">{title}</h1>
          <p className="mt-6 text-base leading-7 text-slate-500">{intro}</p>
          <p className="mt-5 text-xs text-slate-500">Mis à jour le <time dateTime="2026-10-05">5 octobre 2026</time></p>
        </header>
        <div className="mt-12 grid items-start gap-10 lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-14">
          <nav aria-label="Sommaire" className="rounded-2xl bg-slate-50 p-5 lg:sticky lg:top-8">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-pink-600">Sur cette page</p>
            <ol className="space-y-1">
              {sections.map((section, index) => (
                <li key={section.id}><a href={`#${section.id}`} className="flex min-h-9 gap-2 py-1 text-xs leading-5 text-slate-600 transition-colors hover:text-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-pink-600"><span className="text-slate-400">{String(index + 1).padStart(2, '0')}</span>{section.title}</a></li>
              ))}
            </ol>
          </nav>
          <div className="min-w-0 max-w-[680px] divide-y divide-slate-200">
            {sections.map((section, index) => (
              <section key={section.id} id={section.id} aria-labelledby={`${section.id}-title`} className="scroll-mt-8 pb-8 pt-8 first:pt-0">
                <h2 id={`${section.id}-title`} className="mb-4 flex items-baseline gap-3 text-xl font-bold tracking-[-0.035em] text-slate-800"><span aria-hidden="true" className="text-xs font-semibold text-pink-600">{String(index + 1).padStart(2, '0')}</span>{section.title}</h2>
                <div className="break-words text-sm leading-7 text-slate-600 [&_p+p]:mt-4 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-5 [&_a]:text-pink-700 [&_a]:underline [&_a]:underline-offset-4 [&_strong]:font-semibold [&_strong]:text-slate-800">{section.content}</div>
              </section>
            ))}
          </div>
        </div>
        <nav aria-label="Documents légaux" className="mt-10 flex flex-wrap gap-3 border-t border-slate-200 pt-7">
          {documents.map(document => <Link key={document.href} href={document.href} aria-current={document.href === pathname ? 'page' : undefined} className="inline-flex min-h-11 items-center rounded-full border border-slate-200 px-5 text-xs font-semibold text-slate-600 transition-colors hover:border-pink-600 hover:text-pink-600 aria-[current=page]:border-slate-800 aria-[current=page]:bg-slate-800 aria-[current=page]:text-white">{document.label}</Link>)}
        </nav>
      </article>
    </MarketingShell>
  )
}
