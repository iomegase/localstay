import { zipSync, strToU8 } from 'fflate'
import { parseFluxArchive, fetchFluxObjects } from '@/features/events-acquisition/lib/datatourisme-client'

function buildZip(): Uint8Array {
  return zipSync({
    'index.json': strToU8(JSON.stringify([{ file: 'objects/a.json' }])),
    'objects/a.json': strToU8(JSON.stringify({ '@id': 'a', 'dc:identifier': 'A' })),
    'objects/b.json': strToU8(JSON.stringify({ '@id': 'b', 'dc:identifier': 'B' })),
    'context.jsonld': strToU8('{}'),
  })
}

describe('datatourisme-client', () => {
  it('parseFluxArchive: extrait les objets .json hors index/context', () => {
    const objects = parseFluxArchive(buildZip())
    const ids = objects.map((o: any) => o['dc:identifier']).sort()
    expect(ids).toEqual(['A', 'B'])
  })

  it("fetchFluxObjects: telecharge puis parse l'archive", async () => {
    const zip = buildZip()
    const realFetch = global.fetch
    global.fetch = jest.fn(async () => ({
      ok: true,
      arrayBuffer: async () => zip.buffer.slice(zip.byteOffset, zip.byteOffset + zip.byteLength),
    })) as unknown as typeof fetch
    try {
      const objects = await fetchFluxObjects('https://flux.example/test')
      expect(objects).toHaveLength(2)
    } finally {
      global.fetch = realFetch
    }
  })

  it("fetchFluxObjects: leve une erreur si l'URL est absente", async () => {
    await expect(fetchFluxObjects(undefined)).rejects.toThrow('DATATOURISME_FLUX_URL')
  })
})
