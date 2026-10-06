import { fallbackDeletionNotice } from '@/features/admin-taxonomy/lib/fallback-deletion-notice'

// Spec 074 AC-02-01 — message de confirmation.
describe('074 — annonce avant suppression', () => {
  it('catégorie → Non classées', () => {
    expect(fallbackDeletionNotice({ kind: 'category' }, 3)).toBe('3 images de remplacement repasseront dans « Non classées ».')
    expect(fallbackDeletionNotice({ kind: 'category' }, 1)).toBe('1 image de remplacement repassera dans « Non classées ».')
  })

  it('sous-catégorie → catégorie parente', () => {
    expect(fallbackDeletionNotice({ kind: 'subcategory', categoryName: 'Cafés' }, 2)).toBe('2 images de remplacement remonteront dans « Cafés ».')
  })

  it('aucune image → pas de message', () => {
    expect(fallbackDeletionNotice({ kind: 'category' }, 0)).toBeNull()
  })
})
