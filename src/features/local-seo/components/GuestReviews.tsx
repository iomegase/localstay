import type { GuestReview } from '../content/guest-reviews'

export function GuestReviews({ reviews }: { reviews: GuestReview[] }) {
  const visibleReviews = reviews.slice(0, 3)
  if (visibleReviews.length === 0) return null

  return (
    <section aria-labelledby="guest-reviews-title">
      <h2 id="guest-reviews-title" className="text-[30px] font-bold tracking-[-0.04em] text-slate-900 sm:text-[38px]">
        L’expérience de nos voyageurs
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {visibleReviews.map(review => (
          <figure key={review.id} className="rounded-[24px] bg-[#f8f7f5] p-6">
            {review.rating ? (
              <div aria-label={`${review.rating} étoiles sur 5`} className="mb-4 text-sm tracking-[0.18em] text-pink-600">
                {'★'.repeat(review.rating)}
              </div>
            ) : null}
            <blockquote className="text-[13px] text-justify leading-7 text-slate-600">« {review.quote} »</blockquote>
            <figcaption className="mt-5 text-xs font-bold text-slate-900">
              {review.author}{review.stayDate ? ` · ${review.stayDate}` : ''}
              {review.source === 'AIRBNB' && <span className="mt-1 block font-normal text-slate-500">Avis voyageur reçu via Airbnb</span>}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
