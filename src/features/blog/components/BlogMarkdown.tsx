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
      breaks
      className="px-6 text-sm leading-relaxed text-charcoal/70"
    />
  )
}
