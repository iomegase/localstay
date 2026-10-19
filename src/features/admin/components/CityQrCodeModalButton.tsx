'use client'
import { QrCodeModalButton } from './QrCodeModalButton'

/** QR ville (promotion de l'app). */
export function CityQrCodeModalButton({ citySlug, cityName }: { citySlug: string; cityName: string }) {
  return (
    <QrCodeModalButton
      endpoint={`/api/admin/cities/${citySlug}/qr-code`}
      title={`QR code — ${cityName}`}
      emptyLabel="Aucun QR code généré pour cette ville."
      downloadName={`qr-${citySlug}.png`}
    />
  )
}
