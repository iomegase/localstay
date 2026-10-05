import { MarkdownText } from '@/shared/components/MarkdownText'
import { normalizeBlogMarkdown } from '../lib/markdown'

function stripRawHtml(source: string): string {
  return source.replace(/<[^>]+>/g, '')
}

function stripUnsafeMarkdownLinks(source: string): string {
  return source.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, label: string, href: string) => {
    const trimmedHref = href.trim().toLowerCase()
    return trimmedHref.startsWith('javascript:') ? label : `[${label}](${href})`
  })
}

export function BlogMarkdown({ source }: { source: string }) {
  const sanitized = stripUnsafeMarkdownLinks(stripRawHtml(normalizeBlogMarkdown(source)))

  return (
    <MarkdownText
      source={sanitized}
      breaks
      headingLevel={2}
      gfm
      className="text-[13px] leading-7 text-slate-700 [&_a]:text-slate-800 [&_h2]:mb-4 [&_h2]:mt-9 [&_h2]:text-[23px] [&_h2[data-markdown-depth='1']]:mb-5 [&_h2[data-markdown-depth='1']]:mt-10 [&_h2[data-markdown-depth='1']]:text-[30px] [&_h2]:font-thin [&_h2]:normal-case [&_h2]:leading-tight [&_h2]:tracking-[-0.03em] [&_h3]:mb-3 [&_h3]:mt-8 [&_h3]:text-[19px] [&_h3]:font-thin [&_h3]:normal-case [&_h3]:leading-tight [&_h4]:mb-3 [&_h4]:mt-8 [&_h4]:text-[19px] [&_h4]:font-light [&_h4]:normal-case [&_li]:text-[13px] [&_p]:mb-6 [&_p]:text-justify [&_p]:text-[13px] [&_p]:leading-7 [&_ul]:mb-7 [&_ul]:space-y-2"
    />
  )
}
