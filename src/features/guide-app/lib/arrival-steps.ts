import { z } from 'zod'

/** Types d'étapes d'arrivée (spec 054 AC-05-01) — miroir de l'enum Prisma ArrivalStepKind. */
export const ARRIVAL_STEP_KINDS = ['address', 'access', 'garage', 'ski', 'custom'] as const
export type ArrivalStepKind = (typeof ARRIVAL_STEP_KINDS)[number]

export const ARRIVAL_STEP_KIND_LABELS: Record<ArrivalStepKind, string> = {
  address: 'Adresse',
  access: 'Accès',
  garage: 'Garage',
  ski: 'Local à skis',
  custom: 'Autre',
}

export const ARRIVAL_STEP_ITEMS_MAX = 10

export interface ArrivalSubstep {
  title: string
  detail: string
}

export interface ArrivalFact {
  label: string
  value: string
}

export const arrivalSubstepSchema = z.object({
  title: z.string().trim().min(1).max(120),
  detail: z.string().trim().max(600).default(''),
})

export const arrivalFactSchema = z.object({
  label: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(60),
})

export function isArrivalStepKind(value: unknown): value is ArrivalStepKind {
  return typeof value === 'string' && (ARRIVAL_STEP_KINDS as readonly string[]).includes(value)
}

function parseList<T>(value: unknown, schema: z.ZodType<T, z.ZodTypeDef, unknown>): T[] {
  if (!Array.isArray(value)) return []
  return value.flatMap(item => {
    const parsed = schema.safeParse(item)
    return parsed.success ? [parsed.data] : []
  }).slice(0, ARRIVAL_STEP_ITEMS_MAX)
}

/** Lecture tolérante du JSON stocké : les entrées invalides sont ignorées. */
export function parseArrivalSubsteps(value: unknown): ArrivalSubstep[] {
  return parseList(value, arrivalSubstepSchema)
}

export function parseArrivalFacts(value: unknown): ArrivalFact[] {
  return parseList(value, arrivalFactSchema)
}
