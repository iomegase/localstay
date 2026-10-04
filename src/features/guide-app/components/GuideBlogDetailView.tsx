import { ArrowLeft } from 'lucide-react'
import { GuideBlogArticle } from './GuideBlogArticle'
import type { GuideBlogDetail } from '@/features/guide-app/types'
import { useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'

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
  const m = useGuideMessages()
  return (
    <div className="px-4 pb-24 pt-4">
      <button
        type="button"
        onClick={onBack}
        className="inline-flex min-h-11 items-center gap-2 rounded-full px-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500"
      >
        <ArrowLeft className="h-4 w-4" />
        {m.blog.back}
      </button>

      {!detail ? (
        <p className="mt-10 text-center text-sm text-slate-400">{m.common.loading}</p>
      ) : (
        <GuideBlogArticle detail={detail} />
      )}
    </div>
  )
}
