import { MarkdownText } from '@/shared/components/MarkdownText'

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
  const sanitized = stripUnsafeMarkdownLinks(stripRawHtml(source))

  return (
    <MarkdownText
      source={sanitized}
      className="space-y-4 text-sm leading-7 text-slate-700 [&_h3]:text-3xl [&_h3]:font-semibold [&_h3]:text-slate-950 [&_h4]:text-2xl [&_h4]:font-semibold [&_h4]:text-slate-950 [&_h5]:text-xl [&_h5]:font-semibold [&_h5]:text-slate-950 [&_p]:text-sm [&_p]:leading-7 [&_p]:text-slate-700 [&_ul]:pl-5 [&_ol]:pl-5"
    />
  )
}
