import type { DescriptionSource } from '@/shared/lib/description-sources'

/** Spec 094 AC-04 / AC-06 : « Sources : » sous la description d'un POI, un lien par source. */
export function DescriptionSources({
  sources,
  label = 'Sources :',
  className,
  linkClassName = 'underline decoration-slate-300 underline-offset-2 hover:text-slate-700',
}: {
  sources: DescriptionSource[] | null | undefined
  label?: string
  className?: string
  linkClassName?: string
}) {
  if (!sources?.length) return null
  return (
    <p data-testid="poi-description-sources" className={className}>
      {label}{' '}
      {sources.map((source, index) => (
        <span key={source.url}>
          {index > 0 ? ' · ' : null}
          <a href={source.url} target="_blank" rel="nofollow noopener noreferrer" className={linkClassName}>
            {source.title}
          </a>
        </span>
      ))}
    </p>
  )
}
