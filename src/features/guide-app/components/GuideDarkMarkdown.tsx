import ReactMarkdown from 'react-markdown'
import type { ReactNode } from 'react'

/** Rendu markdown pour les cartes sombres du guide (texte clair, titres H1-H3, listes, gras). */
const COMPONENTS = {
  p: (props: { children?: ReactNode }) => (
    <p className="mb-2 whitespace-pre-line text-xs leading-5 text-white/80 last:mb-0">{props.children}</p>
  ),
  h1: (props: { children?: ReactNode }) => (
    <h3 className="mb-1 mt-3 text-sm font-bold uppercase tracking-[0.14em] text-white first:mt-0">{props.children}</h3>
  ),
  h2: (props: { children?: ReactNode }) => (
    <h4 className="mb-1 mt-3 text-[13px] font-bold uppercase tracking-[0.12em] text-white first:mt-0">{props.children}</h4>
  ),
  h3: (props: { children?: ReactNode }) => (
    <h5 className="mb-1 mt-2 text-xs font-bold uppercase tracking-[0.1em] text-white/90 first:mt-0">{props.children}</h5>
  ),
  ul: (props: { children?: ReactNode }) => (
    <ul className="mb-2 ml-4 list-disc space-y-0.5 last:mb-0">{props.children}</ul>
  ),
  ol: (props: { children?: ReactNode }) => (
    <ol className="mb-2 ml-4 list-decimal space-y-0.5 last:mb-0">{props.children}</ol>
  ),
  li: (props: { children?: ReactNode }) => (
    <li className="text-xs leading-5 text-white/80">{props.children}</li>
  ),
  strong: (props: { children?: ReactNode }) => (
    <strong className="font-semibold text-white">{props.children}</strong>
  ),
  em: (props: { children?: ReactNode }) => <em className="italic">{props.children}</em>,
  a: (props: { href?: string; children?: ReactNode }) => (
    <a href={props.href} target="_blank" rel="noopener noreferrer" className="text-pink-300 underline underline-offset-2">
      {props.children}
    </a>
  ),
}

export function GuideDarkMarkdown({ source }: { source: string }) {
  // Tolérant : « ##Titre » sans espace → « ## Titre ». Retours à la ligne simples
  // conservés (saut dur `  \n`) sans casser titres/listes.
  const normalized = source
    .replace(/^(#{1,6})(?=\S)/gm, '$1 ')
    .replace(/([^\n])\n(?!\n)/g, '$1  \n')

  return (
    <ReactMarkdown components={COMPONENTS} skipHtml>
      {normalized}
    </ReactMarkdown>
  )
}
