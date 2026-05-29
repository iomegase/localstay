import { Prisma } from '@prisma/client'
import type { PoiHours, DayHours } from '@/features/categories/types'
import type { GoogleReviewPayload } from '../types'

type GoogleHourPoint = { day?: unknown; hour?: unknown; minute?: unknown }

const DAY_KEYS: Array<keyof PoiHours> = ['0', '1', '2', '3', '4', '5', '6']

export function mapRegularOpeningHoursToPoiHours(value: unknown): PoiHours | null {
  if (!isRecord(value)) return null
  const periods = Array.isArray(value.periods) ? (value.periods as unknown[]) : null
  if (!periods || periods.length === 0) return null

  const slots: Record<number, { openMin: number; closeMin: number }> = {}

  for (const period of periods) {
    if (!isRecord(period)) continue
    const open = isRecord(period.open) ? (period.open as GoogleHourPoint) : null
    if (!open) continue

    const dayIndex = toDayIndex(open.day)
    if (dayIndex === null) continue

    const openMin = toMinutes(open.hour, open.minute)
    if (openMin === null) continue

    const close = isRecord(period.close) ? (period.close as GoogleHourPoint) : null
    const closeMin = close ? toMinutes(close.hour, close.minute) ?? 1440 : 1440

    const existing = slots[dayIndex]
    if (!existing) {
      slots[dayIndex] = { openMin, closeMin }
    } else {
      slots[dayIndex] = {
        openMin: Math.min(existing.openMin, openMin),
        closeMin: Math.max(existing.closeMin, closeMin),
      }
    }
  }

  if (Object.keys(slots).length === 0) return null

  const out: PoiHours = {}
  for (const key of DAY_KEYS) {
    const idx = Number(key)
    const slot = slots[idx]
    if (slot) {
      out[key] = { open: formatTime(slot.openMin), close: formatTime(slot.closeMin) } satisfies DayHours
    }
  }
  return out
}

function toDayIndex(value: unknown): number | null {
  if (typeof value !== 'number') return null
  const n = Math.trunc(value)
  return n >= 0 && n <= 6 ? n : null
}

function toMinutes(hour: unknown, minute: unknown): number | null {
  if (typeof hour !== 'number') return null
  const h = Math.trunc(hour)
  if (h < 0 || h > 24) return null
  const m = typeof minute === 'number' ? Math.trunc(minute) : 0
  if (m < 0 || m > 59) return null
  return h * 60 + m
}

function formatTime(totalMinutes: number): string {
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function mergeHoursIntoReviewPayload(
  reviewPayload: GoogleReviewPayload | null,
  hours: PoiHours | null,
): Prisma.InputJsonValue | typeof Prisma.JsonNull {
  if (!reviewPayload && !hours) return Prisma.JsonNull
  const base: GoogleReviewPayload = reviewPayload ?? { attribution: 'Google Maps' }
  if (hours) return { ...base, hours } as unknown as Prisma.InputJsonValue
  return base as unknown as Prisma.InputJsonValue
}

export function extractHoursFromReviewPayload(value: unknown): PoiHours | null {
  if (!isRecord(value)) return null
  const hours = value.hours
  if (!isRecord(hours)) return null

  const out: PoiHours = {}
  for (const key of DAY_KEYS) {
    const slot = hours[key]
    if (!isRecord(slot)) continue
    const open = typeof slot.open === 'string' ? slot.open : null
    const close = typeof slot.close === 'string' ? slot.close : null
    if (open && close) out[key] = { open, close } satisfies DayHours
  }
  return Object.keys(out).length > 0 ? out : null
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
