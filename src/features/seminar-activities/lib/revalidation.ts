import { revalidatePath } from 'next/cache'

/** Spec 097 BR-13 : toute mutation revalide le hub, les landings séminaire et l'admin. */
export function revalidateSeminarActivitySurfaces(): void {
  revalidatePath('/seminaires', 'page')
  revalidatePath('/seminaires/[city-slug]', 'page')
  revalidatePath('/admin/seminar-activities', 'page')
}
