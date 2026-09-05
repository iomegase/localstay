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
      className="text-[13px] leading-7 text-slate-700 [&_a]:text-slate-800 [&_h3]:mb-5 [&_h3]:mt-10 [&_h3]:text-[30px] [&_h3]:font-thin [&_h3]:normal-case [&_h3]:leading-tight [&_h3]:tracking-[-0.03em] [&_h4]:mb-4 [&_h4]:mt-9 [&_h4]:text-[23px] [&_h4]:font-thin [&_h4]:normal-case [&_h4]:leading-tight [&_h5]:mb-3 [&_h5]:mt-8 [&_h5]:text-[19px] [&_h5]:font-light [&_h5]:normal-case [&_li]:text-[13px] [&_p]:mb-6 [&_p]:text-justify [&_p]:text-[13px] [&_p]:leading-7 [&_ul]:mb-7 [&_ul]:space-y-2"
    />
  )
}
