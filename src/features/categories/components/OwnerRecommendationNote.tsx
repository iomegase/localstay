export function OwnerRecommendationNote({ note }: { note: string | null }) {
  if (!note) return null

  return (
    <section
      aria-label="Le mot de votre hôte"
      className="mx-6 rounded-[30px] bg-stone-200/40 p-6"
    >
      <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">
        Le mot de votre hôte
      </h2>
      <p className="mt-3 break-words whitespace-pre-line text-sm font-medium leading-relaxed text-charcoal/80">
        {note}
      </p>
    </section>
  )
}
