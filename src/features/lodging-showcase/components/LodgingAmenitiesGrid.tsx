import { Check } from 'lucide-react'

export function LodgingAmenitiesGrid({ title, subtitle, items }: { title: string; subtitle: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <section className="mx-4 mt-6">
      <p className="mb-1 text-[14px] font-bold uppercase tracking-wider text-charcoal">{title}</p>
      <p className="mb-4 text-[9px] font-light uppercase tracking-widest text-gray-500">{subtitle}</p>
      <ul className="grid grid-cols-4 gap-3">
        {items.map(label => (
          <li key={label} className="flex flex-col items-center gap-1.5 text-center">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-pink-600">
              <Check className="h-[18px] w-[18px]" />
            </span>
            <span className="text-[10px] text-gray-600">{label}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
