export function LodgingExcerpt({ text }: { text: string }) {
  if (!text.trim()) return null
  return (
    <div className="mx-4 mt-5 border-l-2 border-pink-600 pl-4">
      <p className="text-[13px] font-light italic leading-relaxed text-gray-600">{text}</p>
    </div>
  )
}
