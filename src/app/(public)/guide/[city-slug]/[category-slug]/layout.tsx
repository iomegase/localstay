/**
 * Layout de la catégorie : expose un slot parallèle `@modal` en plus du contenu.
 * Le slot reste vide (default.tsx → null) sauf navigation client vers `.../start`,
 * où la route interceptée affiche la navigation rando en overlay au-dessus de la liste.
 */
export default function CategoryLayout({
  children,
  modal,
}: {
  children: React.ReactNode
  modal: React.ReactNode
}) {
  return (
    <>
      {children}
      {modal}
    </>
  )
}
