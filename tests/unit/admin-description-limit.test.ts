import { parseAdminPoiPatchInput } from '@/features/admin-pois/lib/admin-poi-rules'
import { ADMIN_DESCRIPTION_MAX_CHARS, ADMIN_DESCRIPTION_TOO_LONG } from '@/shared/lib/description-length'

// PO 2026-10-08 : description écrite à la main en markdown, jusqu'à 5 000 caractères.
const markdown = (length: number) => {
  const block = '## Le lieu\n\n**Ouvert** toute l’année :\n\n- terrasse\n- vue sur le Mont-Blanc\n\n'
  return block.repeat(Math.ceil(length / block.length)).slice(0, length)
}

describe('description admin — 5 000 caractères, markdown', () => {
  it('accepte un markdown de 4 000 caractères (refusé avant à 2 500)', () => {
    const result = parseAdminPoiPatchInput({ description: markdown(4000) })
    expect(result.success).toBe(true)
  })

  it('refuse au-delà de 5 000 caractères avec un message en français', () => {
    const result = parseAdminPoiPatchInput({ description: `${markdown(ADMIN_DESCRIPTION_MAX_CHARS - 10)}${'x'.repeat(11)}` })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.flatten().fieldErrors.description).toEqual([ADMIN_DESCRIPTION_TOO_LONG])
    }
    expect(ADMIN_DESCRIPTION_TOO_LONG).toMatch(/^La description dépasse 5\s000 caractères\.$/)
  })

  it('vide → null ; null accepté', () => {
    const empty = parseAdminPoiPatchInput({ description: '   ' })
    expect(empty.success && empty.data.description).toBeNull()
    expect(parseAdminPoiPatchInput({ description: null }).success).toBe(true)
  })
})
