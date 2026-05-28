import ReactMarkdown from 'react-markdown'

type Props = {
  source: string | null | undefined
  className?: string
}

const MARKDOWN_COMPONENTS = {
  p: (props: { children?: React.ReactNode }) => (
    <p className="mb-3 last:mb-0">{props.children}</p>
  ),
  h1: (props: { children?: React.ReactNode }) => (
    <h3 className="mb-2 mt-4 text-base font-semibold text-slate-900">{props.children}</h3>
  ),
  h2: (props: { children?: React.ReactNode }) => (
    <h4 className="mb-2 mt-3 text-sm font-semibold text-slate-900">{props.children}</h4>
  ),
  h3: (props: { children?: React.ReactNode }) => (
    <h5 className="mb-1.5 mt-3 text-sm font-semibold text-slate-800">{props.children}</h5>
  ),
  ul: (props: { children?: React.ReactNode }) => (
    <ul className="mb-3 ml-4 list-disc space-y-1 last:mb-0">{props.children}</ul>
  ),
  ol: (props: { children?: React.ReactNode }) => (
    <ol className="mb-3 ml-4 list-decimal space-y-1 last:mb-0">{props.children}</ol>
  ),
  li: (props: { children?: React.ReactNode }) => (
    <li className="leading-relaxed">{props.children}</li>
  ),
  a: (props: { href?: string; children?: React.ReactNode }) => (
    <a
      href={props.href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-indigo-600 underline underline-offset-2 hover:text-indigo-700"
    >
      {props.children}
    </a>
  ),
  strong: (props: { children?: React.ReactNode }) => (
    <strong className="font-semibold text-slate-900">{props.children}</strong>
  ),
  em: (props: { children?: React.ReactNode }) => (
    <em className="italic">{props.children}</em>
  ),
  code: (props: { children?: React.ReactNode }) => (
    <code className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.85em] text-slate-800">{props.children}</code>
  ),
  blockquote: (props: { children?: React.ReactNode }) => (
    <blockquote className="my-3 border-l-2 border-slate-300 pl-3 italic text-slate-600">{props.children}</blockquote>
  ),
  hr: () => <hr className="my-4 border-slate-200" />,
}

export function MarkdownText({ source, className }: Props) {
  if (!source || source.trim() === '') return null
  return (
    <div className={className}>
      <ReactMarkdown
        components={MARKDOWN_COMPONENTS}
        // react-markdown 10 désactive le HTML brut par défaut — pas de sanitization nécessaire
        skipHtml
      >
        {source}
      </ReactMarkdown>
    </div>
  )
}
