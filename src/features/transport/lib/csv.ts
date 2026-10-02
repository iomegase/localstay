/** Analyse CSV (RFC 4180 : guillemets, virgules et sauts de ligne échappés) en objets par en-tête. */
export function parseCsv(source: string): Record<string, string>[] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let quoted = false
  const text = source.replace(/^﻿/, '')

  for (let index = 0; index < text.length; index++) {
    const char = text[index]
    if (quoted) {
      if (char === '"' && text[index + 1] === '"') {
        field += '"'
        index++
      } else if (char === '"') {
        quoted = false
      } else {
        field += char
      }
    } else if (char === '"') {
      quoted = true
    } else if (char === ',') {
      row.push(field)
      field = ''
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && text[index + 1] === '\n') index++
      row.push(field)
      rows.push(row)
      row = []
      field = ''
    } else {
      field += char
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  const [header, ...body] = rows.filter(line => line.some(value => value.length > 0))
  if (!header) return []
  return body.map(values =>
    Object.fromEntries(header.map((key, index) => [key.trim(), (values[index] ?? '').trim()])),
  )
}
