import React from 'react'

// react-markdown@10 est un module ESM pur que next/jest ne transforme pas
// (node_modules exclus) → "Unexpected token 'export'" à l'import dans les tests.
// Ce stub rend le markdown source tel quel (texte). Les tests de rendu de pages
// vérifient le contenu textuel, pas le HTML markdown, donc c'est suffisant.
export default function ReactMarkdown({ children }: { children?: React.ReactNode }) {
  return <>{children}</>
}
