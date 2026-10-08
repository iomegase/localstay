'use client'

import { ExternalLink, X } from 'lucide-react'
import type { DescriptionSource } from '@/shared/lib/description-sources'

/** Spec 094 : sources d'une description dans l'admin (lecture, ou retrait si `onRemove`). */
export function DescriptionSourcesList({
  sources,
  onRemove,
}: {
  sources: DescriptionSource[]
  onRemove?: (url: string) => void
}) {
  if (sources.length === 0) {
    return <p className="text-xs text-gray-400">Aucune source enregistrée pour cette description.</p>
  }
  return (
    <div data-testid="description-sources" className="space-y-1.5">
      <p className="text-xs font-semibold text-gray-500">Sources de la description</p>
      <ul className="flex flex-wrap gap-2">
        {sources.map(source => (
          <li key={source.url} className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-gray-200 bg-white py-1 pl-3 pr-2 text-xs text-gray-700">
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="inline-flex min-w-0 items-center gap-1 hover:underline">
              <span className="truncate">{source.title}</span>
              <ExternalLink className="h-3 w-3 shrink-0 text-gray-400" aria-hidden="true" />
            </a>
            {onRemove && (
              <button
                type="button"
                onClick={() => onRemove(source.url)}
                aria-label={`Retirer la source ${source.title}`}
                className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-gray-400 hover:bg-rose-50 hover:text-rose-600"
              >
                <X className="h-3 w-3" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
