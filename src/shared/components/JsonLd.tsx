/** Séparateurs de ligne Unicode, valides en JSON mais qui cassent un <script> inline. */
const LINE_SEPARATORS: Array<[RegExp, string]> = [
  [new RegExp(String.fromCharCode(0x2028), 'g'), '\\u2028'],
  [new RegExp(String.fromCharCode(0x2029), 'g'), '\\u2029'],
]

/**
 * Sérialise un objet JSON-LD pour une insertion sûre dans un <script>.
 * Échappe `<`, `>`, `&` et les séparateurs U+2028/U+2029 afin qu'une chaîne contenant
 * `</script>` (nom/description issus de scraping) ne puisse pas casser la balise ni injecter
 * de code. Le résultat reste du JSON valide (les séquences se décodent à l'identique).
 */
export function serializeJsonLd(data: object): string {
  let json = JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
  for (const [pattern, replacement] of LINE_SEPARATORS) {
    json = json.replace(pattern, replacement)
  }
  return json
}

/**
 * Injecte une (ou plusieurs) entrée(s) JSON-LD Schema.org dans le HTML serveur.
 * Composant serveur : le balisage est présent dans la réponse initiale (crawlers + moteurs IA).
 */
export function JsonLd({ data }: { data: object | object[] }) {
  const items = Array.isArray(data) ? data : [data]
  return (
    <>
      {items.map((item, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: serializeJsonLd(item) }}
        />
      ))}
    </>
  )
}
