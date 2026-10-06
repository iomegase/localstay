import type { ZodType } from 'zod'
import { LandingAdminApiErrorResponseSchema } from '../schemas/landing-pages'

// Appels JSON de l'admin des landings : réponse validée ou liste de messages d'erreur.
export type LandingAdminApiResult<T> = { ok: true; data: T } | { ok: false; errors: string[] }

// Les détails d'API contiennent les champs manquants par page et les erreurs Zod imbriquées.
export function errorDetails(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return [`${path ? `${path} : ` : ''}${value}`]
  if (Array.isArray(value)) return value.flatMap(item => errorDetails(item, path))
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => errorDetails(item, path ? `${path}.${key}` : key))
  return []
}

export async function callLandingAdminApi<T>(
  path: string,
  method: string,
  responseSchema: ZodType<T>,
  body?: unknown,
): Promise<LandingAdminApiResult<T>> {
  try {
    const response = await fetch(path, {
      method,
      ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }),
    })
    const result: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const payload = LandingAdminApiErrorResponseSchema.safeParse(result)
      return {
        ok: false,
        errors: [
          payload.success ? payload.data.error.message ?? 'Action impossible.' : 'Action impossible.',
          ...errorDetails(payload.success ? payload.data.error.details : undefined),
        ],
      }
    }
    const parsed = responseSchema.safeParse(result)
    return parsed.success ? { ok: true, data: parsed.data } : { ok: false, errors: ['Réponse serveur invalide. Réessayez.'] }
  } catch {
    return { ok: false, errors: ['Connexion impossible. Réessayez.'] }
  }
}
