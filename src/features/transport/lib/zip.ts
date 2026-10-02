import { inflateRawSync } from 'node:zlib'

const END_OF_CENTRAL_DIRECTORY = 0x06054b50
const CENTRAL_FILE_HEADER = 0x02014b50
const LOCAL_FILE_HEADER = 0x04034b50
const MAX_ENTRY_BYTES = 5 * 1024 * 1024

/**
 * Lecteur zip minimal (entrées « stored » ou « deflate ») pour l'archive GTFS
 * publique — évite une dépendance pour quelques fichiers texte.
 */
export function readZipEntries(buffer: Buffer): Map<string, string> {
  const entries = new Map<string, string>()
  let eocd = -1
  for (let offset = buffer.length - 22; offset >= Math.max(0, buffer.length - 65_557); offset--) {
    if (buffer.readUInt32LE(offset) === END_OF_CENTRAL_DIRECTORY) {
      eocd = offset
      break
    }
  }
  if (eocd < 0) throw new Error('ZIP_INVALID')

  const count = buffer.readUInt16LE(eocd + 10)
  let cursor = buffer.readUInt32LE(eocd + 16)
  for (let index = 0; index < count; index++) {
    if (buffer.readUInt32LE(cursor) !== CENTRAL_FILE_HEADER) throw new Error('ZIP_INVALID')
    const method = buffer.readUInt16LE(cursor + 10)
    const compressedSize = buffer.readUInt32LE(cursor + 20)
    const size = buffer.readUInt32LE(cursor + 24)
    const nameLength = buffer.readUInt16LE(cursor + 28)
    const extraLength = buffer.readUInt16LE(cursor + 30)
    const commentLength = buffer.readUInt16LE(cursor + 32)
    const localOffset = buffer.readUInt32LE(cursor + 42)
    const name = buffer.toString('utf8', cursor + 46, cursor + 46 + nameLength)
    cursor += 46 + nameLength + extraLength + commentLength

    if (size > MAX_ENTRY_BYTES) throw new Error('ZIP_ENTRY_TOO_LARGE')
    if (buffer.readUInt32LE(localOffset) !== LOCAL_FILE_HEADER) throw new Error('ZIP_INVALID')
    const dataStart =
      localOffset + 30 + buffer.readUInt16LE(localOffset + 26) + buffer.readUInt16LE(localOffset + 28)
    const data = buffer.subarray(dataStart, dataStart + compressedSize)
    if (method === 0) entries.set(name, data.toString('utf8'))
    else if (method === 8) entries.set(name, inflateRawSync(data, { maxOutputLength: MAX_ENTRY_BYTES }).toString('utf8'))
  }
  return entries
}
