'use client'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Phone, Navigation, Globe, Map } from 'lucide-react'

export type ActionButtonsVariant = 'default' | 'compact' | 'modalFooter' | 'guide'

const SCROLL_IDLE_MS = 180
const DETAIL_ACTION_BUTTON_CLASS = 'min-h-[42px] min-w-0 w-full rounded-full bg-white py-1 pl-1 pr-2 flex items-center justify-center gap-1.5 whitespace-nowrap text-[9px] font-bold uppercase tracking-[0.12em] shadow-[0_7px_16px_rgba(17,24,39,0.07)] transition-[transform,box-shadow] duration-200 hover:shadow-[0_9px_20px_rgba(17,24,39,0.09)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal/20 active:scale-[0.98]'
const COMPACT_ACTION_BUTTON_CLASS = 'min-h-[32px] min-w-0 w-full rounded-full bg-white py-0.5 pl-0.5 pr-2 flex items-center justify-center gap-1 whitespace-nowrap text-[8px] font-bold uppercase tracking-[0.08em] shadow-[0_5px_14px_rgba(17,24,39,0.06)] transition-[transform,box-shadow] duration-200 hover:shadow-[0_7px_16px_rgba(17,24,39,0.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-charcoal/20 active:scale-[0.98]'
const DETAIL_ACTION_COLUMNS = {
  call: 'col-start-1',
  directions: 'col-start-2',
  website: 'col-start-3',
} as const
const DETAIL_ACTION_TONES = {
  call: {
    bubble: 'bg-[#31B95D]',
    label: 'text-[#31B95D]',
  },
  directions: {
    bubble: 'bg-[#EF5148]',
    label: 'text-[#EF5148]',
  },
  website: {
    bubble: 'bg-[#218F9D]',
    label: 'text-[#218F9D]',
  },
  map: {
    bubble: 'bg-slate-900',
    label: 'text-slate-900',
  },
} as const

interface Props {
  phone: string | null
  website: string | null
  latitude: number
  longitude: number
  address: string
  variant?: ActionButtonsVariant
  /** Guide variant only: adds a "Carte" pill that triggers internal map navigation. */
  onShowOnMap?: (() => void) | null
}

export function ActionButtons({ phone, website, latitude, longitude, address, variant = 'default', onShowOnMap }: Props) {
  const destination = address.trim() || `${latitude},${longitude}`
  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeMapsDestination(destination)}`
  const phoneLabel = phone?.trim() || null
  const telHref = phoneLabel ? `tel:${phoneLabel.replace(/\s/g, '')}` : null

  if (variant === 'modalFooter') {
    return (
      <ModalFooterActions telHref={telHref} website={website} directionsUrl={directionsUrl} />
    )
  }

  // Guide POI details : mêmes pilules, mais sur 2 colonnes. Avec les 4 actions on
  // obtient un 2×2 (Appeler / Site web puis Carte / Itinéraire).
  if (variant === 'guide') {
    return (
      <div className="grid w-full grid-cols-2 gap-2 px-1 pt-2 pb-3">
        {telHref && phoneLabel && (
          <DetailActionButton
            href={telHref}
            testId="btn-call"
            tone="call"
            icon={<Phone className="h-3.5 w-3.5" />}
            label="Appeler"
            ariaLabel={`Appeler ${phoneLabel}`}
            pinColumn={false}
          />
        )}
        {website && (
          <DetailActionButton
            href={website}
            testId="btn-site"
            tone="website"
            icon={<Globe className="h-3.5 w-3.5" />}
            label="Site web"
            external
            pinColumn={false}
          />
        )}
        {onShowOnMap && (
          <DetailActionButton
            onClick={onShowOnMap}
            testId="btn-map"
            tone="map"
            icon={<Map className="h-3.5 w-3.5" />}
            label="Carte"
            pinColumn={false}
          />
        )}
        <DetailActionButton
          href={directionsUrl}
          testId="btn-directions"
          tone="directions"
          icon={<Navigation className="h-3.5 w-3.5" />}
          label="Itinéraire"
          external
          pinColumn={false}
        />
      </div>
    )
  }

  const compact = variant === 'compact'

  return (
    <div className={`grid w-full grid-cols-3 ${compact ? 'gap-1.5 px-0.5 pt-1 pb-2' : 'gap-2 px-1 pt-2 pb-3'}`}>
      {telHref && phoneLabel && (
        <DetailActionButton
          href={telHref}
          testId="btn-call"
          tone="call"
          icon={<Phone className="h-3.5 w-3.5" />}
          label="Appeler"
          ariaLabel={`Appeler ${phoneLabel}`}
          compact={compact}
        />
      )}

      <DetailActionButton
        href={directionsUrl}
        testId="btn-directions"
        tone="directions"
        icon={<Navigation className="h-3.5 w-3.5" />}
        label="Itinéraire"
        external
        compact={compact}
      />

      {website && (
        <DetailActionButton
          href={website}
          testId="btn-site"
          tone="website"
          icon={<Globe className="h-3.5 w-3.5" />}
          label="Site web"
          external
          compact={compact}
        />
      )}
    </div>
  )
}

function DetailActionButton({
  href,
  onClick,
  testId,
  tone,
  icon,
  label,
  external = false,
  ariaLabel,
  compact = false,
  pinColumn = true,
}: {
  href?: string
  onClick?: () => void
  testId: string
  tone: keyof typeof DETAIL_ACTION_TONES
  icon: ReactNode
  label: string
  external?: boolean
  ariaLabel?: string
  compact?: boolean
  pinColumn?: boolean
}) {
  const toneClasses = DETAIL_ACTION_TONES[tone]
  const buttonClass = compact ? COMPACT_ACTION_BUTTON_CLASS : DETAIL_ACTION_BUTTON_CLASS
  const bubbleClass = compact ? 'h-6 w-6 [&_svg]:h-3 [&_svg]:w-3' : 'h-8 w-8'
  const columnClass = pinColumn ? DETAIL_ACTION_COLUMNS[tone as keyof typeof DETAIL_ACTION_COLUMNS] ?? '' : ''

  const inner = (
    <>
      <span className={`flex ${bubbleClass} shrink-0 items-center justify-center rounded-full text-white ${toneClasses.bubble}`}>
        {icon}
      </span>
      <span className={`shrink-0 ${toneClasses.label}`}>{label}</span>
    </>
  )

  const className = `${buttonClass} ${columnClass}`

  if (onClick) {
    return (
      <button type="button" onClick={onClick} data-testid={testId} className={className} aria-label={ariaLabel}>
        {inner}
      </button>
    )
  }

  return (
    <a
      href={href}
      target={external ? '_blank' : undefined}
      rel={external ? 'noopener noreferrer' : undefined}
      data-testid={testId}
      className={className}
      aria-label={ariaLabel}
    >
      {inner}
    </a>
  )
}

function ModalFooterActions({
  telHref,
  website,
  directionsUrl,
}: {
  telHref: string | null
  website: string | null
  directionsUrl: string
}) {
  const [isScrolling, setIsScrolling] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const scrollIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const visibilityClassName = isScrolling
    ? 'opacity-0 pointer-events-none translate-y-4'
    : 'opacity-100 translate-y-0'

  useEffect(() => {
    const targets: Array<Window | Element> = [window]
    const modalPanel = rootRef.current?.closest('[data-testid="favorite-poi-modal-panel"]')

    if (modalPanel) {
      targets.push(modalPanel)
    }

    const handleScroll = () => {
      setIsScrolling(true)

      if (scrollIdleTimer.current) {
        clearTimeout(scrollIdleTimer.current)
      }

      scrollIdleTimer.current = setTimeout(() => {
        setIsScrolling(false)
        scrollIdleTimer.current = null
      }, SCROLL_IDLE_MS)
    }

    targets.forEach(target => target.addEventListener('scroll', handleScroll, { passive: true }))

    return () => {
      targets.forEach(target => target.removeEventListener('scroll', handleScroll))

      if (scrollIdleTimer.current) {
        clearTimeout(scrollIdleTimer.current)
      }
    }
  }, [])

  return (
    <div
      ref={rootRef}
      className={`fixed bottom-8 left-1/2 z-[120] grid w-[calc(100%-2rem)] max-w-[390px] -translate-x-1/2 grid-cols-3 items-center gap-2 px-1 transition-[opacity,transform] duration-200 ${visibilityClassName}`}
      data-testid="favorite-modal-footer-actions"
    >
      {telHref && (
        <DetailActionButton
          href={telHref}
          tone="call"
          testId="btn-call"
          icon={<Phone className="h-3.5 w-3.5" />}
          label="Appeler"
          ariaLabel="Appeler"
        />
      )}

      {website && (
        <DetailActionButton
          href={website}
          tone="website"
          testId="btn-site"
          icon={<Globe className="h-3.5 w-3.5" />}
          label="Site web"
          external
        />
      )}

      <DetailActionButton
        href={directionsUrl}
        tone="directions"
        testId="btn-directions"
        icon={<Navigation className="h-3.5 w-3.5" />}
        label="Itinéraire"
        external
      />
    </div>
  )
}

function encodeMapsDestination(value: string): string {
  return encodeURIComponent(value).replace(/'/g, '%27')
}
