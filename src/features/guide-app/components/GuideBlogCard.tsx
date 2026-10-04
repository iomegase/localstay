import { MapPin, Newspaper } from 'lucide-react'
import type { GuideBlogPost } from '../types'

/** Spec 054 AC-07-01 — carte du Journal dédiée au guide. */
export function GuideBlogCard({ post, onOpen }: { post: GuideBlogPost; onOpen: (post: GuideBlogPost) => void }) {
  return (
    <button type="button" onClick={() => onOpen(post)} aria-labelledby={`journal-${post.id}`}
      className="block w-full rounded-[2rem] bg-white p-2 text-left shadow-md transition-shadow hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-pink-600 focus-visible:ring-offset-4">
      <div className="relative aspect-[4/3] overflow-hidden rounded-[1.6rem] bg-zinc-800">
        {post.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- couverture distante du guide
          <img src={post.coverUrl} alt="" loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
        ) : <div className="flex h-full items-center justify-center text-white/60"><Newspaper aria-hidden="true" className="h-10 w-10" strokeWidth={1.5} /></div>}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        {post.categoryLabel && <span className="absolute left-4 top-4 max-w-[calc(100%-2rem)] rounded-full bg-black/40 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-white backdrop-blur-md">{post.categoryLabel}</span>}
      </div>
      <div className="px-3 pb-4 pt-4">
        {post.cityName && <p className="flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-slate-500"><MapPin aria-hidden="true" className="h-3.5 w-3.5 shrink-0" />{post.cityName}</p>}
        <h2 id={`journal-${post.id}`} className="mt-2 text-[20px] font-semibold leading-snug tracking-[-0.025em] text-slate-900">{post.title}</h2>
        {post.excerpt && <p className="mt-3 line-clamp-2 text-[13px] leading-6 text-slate-500">{post.excerpt}</p>}
      </div>
    </button>
  )
}
