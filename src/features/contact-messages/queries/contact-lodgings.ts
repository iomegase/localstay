import { cache } from 'react'
import { prisma } from '@/shared/lib/prisma'

/**
 * Logements proposés dans le select « Logement concerné » de la modale contact
 * (spec 053 AC-02-06) : profils publiés, actifs, non supprimés, libellés
 * « Titre · Commune ». Une erreur de lecture renvoie une liste vide pour ne
 * jamais casser la page (le champ redevient un texte libre).
 */
export const listContactLodgingOptions = cache(async (): Promise<string[]> => {
  try {
    const rows = await prisma.lodgingPublicProfile.findMany({
      where: {
        publication_status: 'published',
        deleted_at: null,
        city: { is_active: true, deleted_at: null },
        lodging: { is_active: true, deleted_at: null },
      },
      orderBy: [{ city: { name: 'asc' } }, { title: 'asc' }],
      select: { title: true, city: { select: { name: true } } },
    })
    return [...new Set(rows.map(row => `${row.title.trim()} · ${row.city.name.trim()}`))]
  } catch (error) {
    // Repli non bloquant (champ en texte libre) : avertissement d'une ligne, sans l'erreur complète.
    console.warn('[contact] lodging options unavailable:', error instanceof Error ? error.message.trim().split('\n').at(-1) : String(error))
    return []
  }
})
