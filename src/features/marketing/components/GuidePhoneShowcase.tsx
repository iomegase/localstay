import Image from 'next/image'
import { ArrowRight, Heart, Home, QrCode } from 'lucide-react'

/**
 * Visuel du guide MyStay (téléphone, étiquettes « Équipe MyStay » / « Voyageur »
 * et QR code), partagé par `/concept` et les landings conciergerie (spec 046 AC-01-04).
 */
export function GuidePhoneShowcase({
  className = '',
  alt = 'Guide digital MyStay affiché sur un smartphone',
  priority = false,
}: {
  className?: string
  alt?: string
  priority?: boolean
}) {
  return (
    <div
      data-testid="guide-phone-showcase"
      className={`relative mx-auto min-h-[470px] w-full max-w-[500px] items-center justify-center ${className}`}
    >
      <div className="relative z-10 w-[240px]">
        <Image
          src="/marketing/telephone-demo-trim.png"
          alt={alt}
          width={598}
          height={1185}
          sizes="240px"
          className="h-auto w-full rounded-[34px] bg-white"
          priority={priority}
        />

        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[34px] border-[6px] border-white shadow-[0_18px_50px_rgba(15,23,42,0.16)]"
        />
      </div>

      <div className="absolute -left-2 top-3 z-20 flex max-w-[220px] items-center gap-3 overflow-hidden rounded-2xl bg-[#f7f6f4] p-3 pt-3.5 shadow-[0_18px_38px_rgba(15,23,42,0.12)]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500">
          <Home aria-hidden="true" className="h-4 w-4" />
        </span>

        <div>
          <small className="block text-[8px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
            Équipe MyStay
          </small>

          <strong className="mt-2 block p-1 text-[10px] uppercase leading-tight text-slate-800">
            Prépare et accompagne le séjour
          </strong>
        </div>
      </div>

      <div className="absolute left-3 top-[152px] z-20 flex items-center gap-2">
        <div className="grid h-14 w-14 place-items-center rounded-2xl bg-white p-2 shadow-[0_14px_30px_rgba(15,23,42,0.12)]">
          <QrCode
            aria-hidden="true"
            className="h-full w-full text-slate-900"
          />
        </div>

        <ArrowRight
          aria-hidden="true"
          className="h-4 w-4 text-slate-400"
        />
      </div>

      <div className="absolute -right-2 bottom-6 z-20 flex max-w-[212px] items-center gap-3 overflow-hidden rounded-2xl bg-[#f7f6f4] p-3 pt-3.5 shadow-[0_18px_38px_rgba(15,23,42,0.12)]">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-slate-200 bg-white text-slate-500">
          <Heart aria-hidden="true" className="h-4 w-4" />
        </span>

        <div>
          <small className="block text-[8px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
            Voyageur
          </small>

          <strong className="mt-2 block p-1 text-[10px] uppercase leading-tight text-slate-800">
            Profite pleinement du séjour
          </strong>
        </div>
      </div>
    </div>
  )
}
