import Image from 'next/image'

export type MyStayLogoForm = 'horizontal' | 'mark'
export type MyStayLogoTone = 'standard' | 'reversed'

const logoSources = {
  horizontal: {
    standard: '/mystay-logo-approved/mystay-logo-approved@4x.png',
    reversed:
      '/mystay-logo-approved/mystay-logo-approved-reversed@4x.png',
  },
  mark: {
    standard: '/mystay-logo-approved/mystay-mark-approved@4x.png',
    reversed: '/mystay-logo-approved/mystay-mark-approved@4x.png',
  },
} satisfies Record<
  MyStayLogoForm,
  Record<MyStayLogoTone, string>
>

const intrinsicDimensions = {
  horizontal: { width: 1684, height: 444 },
  mark: { width: 656, height: 444 },
} satisfies Record<MyStayLogoForm, { width: number; height: number }>

export function MyStayLogo({
  form = 'horizontal',
  tone = 'standard',
  alt = 'MyStay',
  className,
  priority = false,
  sizes,
}: {
  form?: MyStayLogoForm
  tone?: MyStayLogoTone
  alt?: string
  className?: string
  priority?: boolean
  sizes?: string
}) {
  const dimensions = intrinsicDimensions[form]

  return (
    <Image
      src={logoSources[form][tone]}
      alt={alt}
      width={dimensions.width}
      height={dimensions.height}
      className={className}
      priority={priority}
      sizes={sizes}
    />
  )
}
