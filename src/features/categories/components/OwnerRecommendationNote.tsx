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
      <p
        data-testid="owner-recommendation-note-text"
        className="mt-2 break-words whitespace-pre-line font-hand text-[15px] leading-snug text-gray-700"
      >
        {note}
      </p>
    </section>
  )
}
