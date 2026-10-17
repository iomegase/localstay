import type { OpenPhotoCreditGroup } from '@/shared/lib/open-photo-credits'

/**
 * Spec 101 AC-02-05 : « Photos : Auteur (Licence) [1] [2] · … » — chaque numéro mène à la page du
 * fichier sur Wikimedia Commons, la licence à son texte.
 */
export function OpenPhotoCredits({
  credits,
  label,
  className,
  linkClassName,
}: {
  credits: OpenPhotoCreditGroup[]
  label: string
  className?: string
  linkClassName?: string
}) {
  if (credits.length === 0) return null
  return (
    <p data-testid="poi-open-photo-credits" className={className}>
      {label}{' '}
      {credits.map((credit, index) => (
        <span key={`${credit.author}-${credit.license}`}>
          {index > 0 ? ' · ' : null}
          {credit.author} (
          {credit.license_url ? (
            <a href={credit.license_url} target="_blank" rel="license nofollow noopener noreferrer" className={linkClassName}>{credit.license}</a>
          ) : credit.license}
          )
          {credit.sources.map((source, position) => (
            <a
              key={source}
              href={source}
              target="_blank"
              rel="nofollow noopener noreferrer"
              aria-label={`${credit.author} — photo ${position + 1} sur Wikimedia Commons`}
              className={linkClassName}
            >
              {' '}[{position + 1}]
            </a>
          ))}
        </span>
      ))}
    </p>
  )
}
