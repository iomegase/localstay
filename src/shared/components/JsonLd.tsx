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
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
    </>
  )
}
