export function ExternalBookingCta(props: {
  externalBookingUrl: string | null
  platform: string | null
  className?: string
}) {
  if (!props.externalBookingUrl) return null

  const label = props.platform === 'airbnb'
    ? 'Reserver sur Airbnb'
    : props.platform === 'booking'
      ? 'Reserver sur Booking'
      : 'Ouvrir la reservation'

  return (
    <a
      href={props.externalBookingUrl}
      target="_blank"
      rel="noopener noreferrer"
      data-analytics-event="lodging_external_booking_click"
      className={props.className ?? 'inline-flex h-11 items-center justify-center rounded-full bg-charcoal px-5 text-sm font-medium text-white'}
    >
      {label}
    </a>
  )
}
