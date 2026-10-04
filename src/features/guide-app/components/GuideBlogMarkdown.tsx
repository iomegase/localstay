import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Root, RootContent } from 'mdast'
import { normalizeBlogMarkdown } from '@/features/blog/lib/markdown'

/** Spec 054 AC-07-05 — taille des références, sans changer les titres. */
function remarkGuideSources() {
  return (tree: Root) => {
    let sourceDepth: number | null = null
    const text = (node: RootContent): string => {
      if ('value' in node) return node.value
      if ('children' in node) return node.children.map(child => text(child as RootContent)).join('')
      return ''
    }
    for (const node of tree.children) {
      if (node.type === 'heading') {
        if (sourceDepth !== null && node.depth <= sourceDepth) sourceDepth = null
        if (/^(sources?|références?|references?)\b/i.test(text(node).trim())) sourceDepth = node.depth
      } else if (sourceDepth !== null) {
        node.data = { ...node.data, hProperties: { ...node.data?.hProperties, className: 'text-[12px]' } }
      }
    }
  }
}

/** Spec 054 AC-07-03 — typographie du lecteur privé ; HTML brut ignoré. */
export function GuideBlogMarkdown({ source }: { source: string }) {
  return (
    <div className="break-words text-[14px] leading-7 text-slate-600 [&_p]:mb-5 [&_p]:text-justify [&_h2]:mb-4 [&_h2]:mt-8 [&_h2]:text-[23px] [&_h2]:font-bold [&_h2]:leading-snug [&_h2]:tracking-[-0.025em] [&_h2]:text-slate-900 [&_h3]:mb-3 [&_h3]:mt-7 [&_h3]:text-[19px] [&_h3]:font-bold [&_h3]:text-slate-900 [&_h4]:mb-3 [&_h4]:mt-6 [&_h4]:font-bold [&_h5]:font-bold [&_h6]:font-bold [&_ul]:mb-5 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:mb-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mb-2 [&_a]:text-pink-700 [&_a]:underline [&_a]:underline-offset-4 [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-pink-600 [&_blockquote]:pl-4 [&_blockquote]:italic [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-2xl [&_pre]:overflow-x-auto [&_strong]:text-slate-900">
      <ReactMarkdown skipHtml remarkPlugins={[remarkGfm, remarkGuideSources]} components={{
        table: ({ children }) => <div className="my-6 max-w-full overflow-x-auto rounded-xl border border-slate-200"><table className="w-full min-w-[320px] border-collapse text-left text-[13px] leading-6">{children}</table></div>,
        th: ({ children }) => <th scope="col" className="border-b border-slate-200 bg-slate-50 px-4 py-3 font-semibold text-slate-900">{children}</th>,
        td: ({ children }) => <td className="border-b border-slate-100 px-4 py-3 align-top">{children}</td>,
        h1: ({ children }) => <h2>{children}</h2>,
        h2: ({ children }) => <h3>{children}</h3>,
        h3: ({ children }) => <h4>{children}</h4>,
      }}>{normalizeBlogMarkdown(source)}</ReactMarkdown>
    </div>
  )
}
