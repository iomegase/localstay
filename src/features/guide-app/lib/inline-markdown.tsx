import type { ReactNode } from 'react'

/**
 * Rendu markdown INLINE minimal (gras `**…**`) pour du texte court affiché sur
 * fond sombre (règlement, descriptions de cartes). Le gras ressort en blanc.
 */
export function inlineMarkdown(text: string): ReactNode {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, index) => {
    const bold = /^\*\*([^*]+)\*\*$/.exec(part)
    return bold ? (
      <strong key={index} className="font-semibold text-white">
        {bold[1]}
      </strong>
    ) : (
      part
    )
  })
}
