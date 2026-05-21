import Link from 'next/link'
import { t } from '@/shared/lib/i18n'

export default function CityNotFound() {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-24 text-center gap-6">
      <h2 className="text-2xl font-light italic font-serif text-charcoal">
        {t('guide.city_not_found')}
      </h2>
      <p className="text-sm text-gray-400">
        Le guide de cette ville n&apos;existe pas encore.
      </p>
      <Link
        href="/"
        className="text-xs font-bold uppercase tracking-widest text-gold underline underline-offset-4"
      >
        {t('guide.back_home')}
      </Link>
    </div>
  )
}
