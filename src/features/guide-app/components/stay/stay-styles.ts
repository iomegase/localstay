// Tokens du handoff « Le 305 » (spec 054 UI Behaviour).
export const STAY_PINK = 'bg-[#DB2777]'
export const STAY_CARD = 'rounded-[20px] bg-white shadow-md'
export const STAY_EYEBROW = 'text-[12px] font-semibold uppercase tracking-[0.08em] text-[#DB2777]'
export const STAY_SECTION_TITLE = 'text-[19px] font-semibold tracking-[-0.01em] text-[#111111]'
export const STAY_PRIMARY_BUTTON =
  'flex h-[52px] items-center justify-center rounded-2xl bg-[#111111] px-4 text-[15px] font-semibold text-white transition-transform active:scale-[0.99]'
export const STAY_SECONDARY_BUTTON =
  'flex h-[52px] items-center justify-center rounded-2xl border border-[rgba(17,17,17,0.15)] bg-white px-4 text-[15px] font-semibold text-[#111111] transition-transform active:scale-[0.99]'

/** « 16:00 » → « 16 h », « 10:30 » → « 10 h 30 ». */
export function formatGuideHour(value: string): string {
  const match = value.match(/^(\d{1,2}):(\d{2})$/)
  if (!match) return value
  const hours = String(Number(match[1]))
  return match[2] === '00' ? `${hours} h` : `${hours} h ${match[2]}`
}

export function lodgingMapsHref(latitude: number, longitude: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`
}
