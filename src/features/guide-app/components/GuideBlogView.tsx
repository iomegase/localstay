import { GuideBlogCard } from './GuideBlogCard'
import type { GuideBlogPost } from '@/features/guide-app/types'
import { useGuideMessages } from '@/features/guide-i18n/components/GuideI18nContext'

/**
 * Vue « Journal » rendue DANS l'app (guest confiné). Reprend le langage visuel des
 * cartes du journal public, mais SANS lien sortant vers le site public.
 */
export function GuideBlogView({
  posts,
  onOpen,
}: {
  posts: GuideBlogPost[]
  onOpen: (post: GuideBlogPost) => void
}) {
  const m = useGuideMessages()
  return (
    <div className="px-3 pb-24 pt-5">
      <h1 className="px-2 text-[30px] font-semibold leading-none tracking-[-0.045em] text-slate-900">
        {m.blog.title}
      </h1>

      {posts.length > 0 ? (
        <div className="mt-6 space-y-6">
          {posts.map(post => (
            <GuideBlogCard key={post.id} post={post} onOpen={onOpen} />
          ))}
        </div>
      ) : (
        <p className="mt-10 px-2 text-sm leading-6 text-slate-500">
          {m.blog.empty}
        </p>
      )}
    </div>
  )
}
