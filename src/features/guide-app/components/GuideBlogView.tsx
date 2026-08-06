import { MapPin, Newspaper } from 'lucide-react'
import type { GuideBlogPost } from '@/features/guide-app/types'

/**
 * Vue « Blog » rendue DANS l'app (guest confiné). Reprend le langage visuel des
 * cartes du blog public, mais SANS lien sortant vers le site public.
 */
export function GuideBlogView({
  posts,
  onOpen,
}: {
  posts: GuideBlogPost[]
  onOpen: (post: GuideBlogPost) => void
}) {
  return (
    <div className="px-3 pb-24 pt-5">
      <h1 className="px-2 text-[30px] font-semibold leading-none tracking-[-0.045em] text-slate-900">
        Blog
      </h1>

      {posts.length > 0 ? (
        <div className="mt-6 space-y-6">
          {posts.map(post => (
            <button
              key={post.id}
              type="button"
              onClick={() => onOpen(post)}
              aria-label={`Lire ${post.title}`}
              className="block w-full overflow-hidden rounded-[24px] bg-white text-left shadow-[0_18px_48px_rgba(15,23,42,0.10)]"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                {post.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- image distante (parité blog public)
                  <img
                    src={post.coverUrl}
                    alt=""
                    loading="lazy"
                    className="absolute inset-0 h-full w-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300 text-white/70">
                    <Newspaper className="h-8 w-8" />
                  </div>
                )}
                {post.cityName && (
                  <span className="absolute left-4 top-4 flex max-w-[calc(100%-2rem)] items-center gap-1 rounded-full bg-slate-950/55 px-3 py-1.5 text-[8px] font-semibold uppercase tracking-wider text-white backdrop-blur">
                    <MapPin className="h-2.5 w-2.5 shrink-0" />
                    <span className="truncate">{post.cityName}</span>
                  </span>
                )}
              </div>
              <div className="p-6">
                {post.categoryLabel && (
                  <span className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
                    {post.categoryLabel}
                  </span>
                )}
                <h2 className="mt-3 text-xl font-bold leading-tight tracking-[-0.035em] text-slate-800">
                  {post.title}
                </h2>
                {post.excerpt && (
                  <p className="mt-4 line-clamp-3 text-xs leading-6 text-slate-500">{post.excerpt}</p>
                )}
              </div>
            </button>
          ))}
        </div>
      ) : (
        <p className="mt-10 px-2 text-sm leading-6 text-slate-500">
          Aucun article pour le moment.
        </p>
      )}
    </div>
  )
}
