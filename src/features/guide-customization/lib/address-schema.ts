import { z } from 'zod'

const part = (max: number) => z.string().trim().max(max).nullable()

/** Spec 080 AC-03-02 / AC-03-03 : adresse privée du logement (routes Owner et Admin). */
export const LodgingAddressSchema = z.object({
  address_number: part(10),
  address_street: part(200),
  address_postal_code: z.string().trim().regex(/^(\d{5})?$/, 'Le code postal doit contenir 5 chiffres.').nullable(),
  address_city: part(120),
}).strict()

export function invalidAddressResponseBody(error: z.ZodError) {
  return {
    error: {
      code: 'INVALID_BODY',
      message: 'Adresse invalide',
      details: { issues: error.issues.map(issue => ({ path: issue.path.join('.'), message: issue.message })) },
    },
  }
}
