import { ArrowLeft, MapPin } from 'lucide-react'
import { BlogMarkdown } from '@/features/blog/components/BlogMarkdown'
import type { GuideBlogDetail } from '@/features/guide-app/types'

/**
 * Vue lecteur d'un article, DANS l'app (guest confiné). Le contenu est chargé à
 * la demande via l'API interne ; `detail` à null = chargement. Bouton retour vers
 * la liste — aucune sortie vers le site public.
 */
export function GuideBlogDetailView({
  detail,
  onBack,
}: {
  detail: GuideBlogDetail | null
  onBack: () => void
}) {
  return (
    <div className="px-4 pb-24 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" />
        Blog
      </button>

      {!detail ? (
        <p className="mt-10 text-center text-sm text-slate-400">Chargement…</p>
      ) : (
        <article className="mt-4">
          {detail.coverUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- image distante (parité guide)
            <img
              src={detail.coverUrl}
              alt=""
              className="aspect-[16/9] w-full rounded-[24px] object-cover"
            />
          )}
          {detail.categoryLabel && (
            <span className="mt-5 block text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
              {detail.categoryLabel}
            </span>
          )}
          <h1 className="mt-3 text-2xl font-bold leading-tight tracking-[-0.035em] text-slate-900">
            {detail.title}
          </h1>
          {detail.cityName && (
            <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-slate-400">
              <MapPin className="h-3.5 w-3.5" />
              {detail.cityName}
            </p>
          )}
          <div className="mt-6">
            <BlogMarkdown source={detail.contentMarkdown} />
          </div>
        </article>
      )}
    </div>
  )
}
