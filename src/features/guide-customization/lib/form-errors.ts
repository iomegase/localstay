import { extractYouTubeId } from '@/shared/lib/youtube'

// Spec 083 : erreurs de la page Guide, indexées par chemin (« arrival_instructions.0.text »).

export type FieldErrors = Record<string, string>

type GuideFormState = {
  arrival_instructions: Array<{ text?: string | null }>
  practical_blocks: Array<{ title?: string | null; video_url?: string | null }>
  address_postal_code?: string | null
  presentation_video_url?: string | null
}

const invalidYouTube = (value: string | null | undefined) =>
  typeof value === 'string' && value.trim().length > 0 && extractYouTubeId(value) === null

/** Spec 083 AC-01-01 : mêmes règles que l'API, vérifiées avant l'envoi. */
export function validateGuideForm(state: GuideFormState): FieldErrors {
  const errors: FieldErrors = {}
  state.arrival_instructions.forEach((instruction, index) => {
    if (!instruction.text?.trim()) errors[`arrival_instructions.${index}.text`] = 'Le texte de l’instruction est requis.'
  })
  state.practical_blocks.forEach((block, index) => {
    if (!block.title?.trim()) errors[`practical_blocks.${index}.title`] = 'Le titre du bloc est requis.'
    if (invalidYouTube(block.video_url)) errors[`practical_blocks.${index}.video_url`] = 'Lien YouTube invalide.'
  })
  const postalCode = state.address_postal_code?.trim()
  if (postalCode && !/^\d{5}$/.test(postalCode)) errors.address_postal_code = 'Le code postal doit contenir 5 chiffres.'
  if (invalidYouTube(state.presentation_video_url)) errors.presentation_video_url = 'Lien YouTube invalide.'
  return errors
}

/** Spec 083 AC-01-02 : premier message par chemin renvoyé par l'API. */
export function issuesToErrors(issues: Array<{ path: string; message: string }> | undefined): FieldErrors {
  const errors: FieldErrors = {}
  for (const issue of issues ?? []) {
    if (issue.path && !errors[issue.path]) errors[issue.path] = issue.message
  }
  return errors
}

export function valueAtPath(state: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((current, key) => (
    current !== null && typeof current === 'object' ? (current as Record<string, unknown>)[key] : undefined
  ), state)
}

/** Spec 083 AC-01-03 : une erreur de l'API disparaît dès que la valeur du champ change. */
export function visibleServerErrors(errors: FieldErrors, snapshot: Record<string, string>, state: unknown): FieldErrors {
  return Object.fromEntries(Object.entries(errors).filter(([path]) => JSON.stringify(valueAtPath(state, path)) === snapshot[path]))
}

/** Erreurs d'une liste (« arrival_instructions ») réindexées pour son éditeur (« 0.text »). */
export function errorsUnder(errors: FieldErrors, prefix: string): FieldErrors {
  return Object.fromEntries(Object.entries(errors)
    .filter(([path]) => path.startsWith(`${prefix}.`))
    .map(([path, message]) => [path.slice(prefix.length + 1), message]))
}
