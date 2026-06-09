import { unzipSync, strFromU8 } from 'fflate'

export function parseFluxArchive(zip: Uint8Array): unknown[] {
  const files = unzipSync(zip)
  const objects: unknown[] = []
  for (const [name, data] of Object.entries(files)) {
    if (!name.endsWith('.json')) continue
    if (name.endsWith('index.json') || name.endsWith('context.jsonld')) continue
    const parsed = JSON.parse(strFromU8(data))
    if (Array.isArray(parsed)) objects.push(...parsed)
    else if (parsed && Array.isArray((parsed as Record<string, unknown>)['@graph'])) {
      objects.push(...((parsed as Record<string, unknown>)['@graph'] as unknown[]))
    } else {
      objects.push(parsed)
    }
  }
  return objects
}

export async function fetchFluxObjects(
  fluxUrl: string | undefined = process.env.DATATOURISME_FLUX_URL,
): Promise<unknown[]> {
  if (!fluxUrl) throw new Error('DATATOURISME_FLUX_URL is not set')
  const res = await fetch(fluxUrl)
  if (!res.ok) throw new Error(`DATAtourisme flux download failed: ${res.status}`)
  const buf = new Uint8Array(await res.arrayBuffer())
  return parseFluxArchive(buf)
}
