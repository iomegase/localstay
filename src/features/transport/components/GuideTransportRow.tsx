import { ChevronRight, TramFront } from 'lucide-react'

/** Ligne « Se déplacer » de la page Séjour (handoff « Le 305 »). */
export function GuideTransportRow({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex min-h-[76px] w-full items-center gap-2.5 rounded-[20px] bg-white p-3 text-left tracking-[-0.025em] shadow-md transition-[transform,box-shadow] duration-200 hover:shadow-sm"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[14px] bg-slate-100 text-black">
        <TramFront className="h-7 w-7 stroke-1" strokeWidth={1} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-[#111111]">Se déplacer</span>
        <span className="block text-[13px] text-[#697386]">Navettes, Vélos ...</span>
      </span>
      <ChevronRight strokeWidth={1} className="h-5 w-5 stroke-1 text-[#BE185D]" aria-hidden="true" />
    </button>
  )
}
