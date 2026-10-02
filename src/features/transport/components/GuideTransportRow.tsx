import { ChevronRight, TramFront } from 'lucide-react'

/** Ligne « Se déplacer » de la page Séjour (handoff « Le 305 »). */
export function GuideTransportRow({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-[76px] w-full items-center gap-4 rounded-[20px] bg-white px-4 py-4 text-left shadow-[0_1px_2px_rgba(17,17,17,0.06)]"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-[#FCE7F3] text-[#BE185D]">
        <TramFront className="h-5 w-5" strokeWidth={1.8} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-[#111111]">Se déplacer</span>
        <span className="block text-[13px] text-[#697386]">Navettes, tramway, trains</span>
      </span>
      <ChevronRight className="h-5 w-5 text-[#BE185D]" aria-hidden="true" />
    </button>
  )
}
