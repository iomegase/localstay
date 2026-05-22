import { getQrCode } from '@/features/qr-code/queries/qr-code'
import { QrCodeAdminClient } from './QrCodeAdminClient'

interface Props {
  params: { slug: string }
}

export default async function QrCodeAdminPage({ params }: Props) {
  const qr = await getQrCode(params.slug)
  const adminSecret = process.env.ADMIN_SECRET ?? ''

  if (!qr) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">QR Code — {params.slug}</h1>
        <div data-testid="qr-empty-state" className="text-gray-500">
          Aucun QR code généré pour cette ville.
        </div>
        <QrCodeAdminClient citySlug={params.slug} adminSecret={adminSecret} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">QR Code — {params.slug}</h1>

      <img
        src={qr.storage_url}
        alt={`QR code pour ${params.slug}`}
        width={300}
        height={300}
        className="border rounded-lg"
        data-testid="qr-preview"
      />

      <div className="space-y-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">URL encodée</p>
        <p className="text-sm font-mono break-all" data-testid="qr-encoded-url">
          {qr.url}
        </p>
      </div>

      <div className="space-y-1">
        <p className="text-xs text-gray-500 uppercase tracking-wide">Dernière génération</p>
        <p className="text-sm">{new Date(qr.created_at).toLocaleString('fr-FR')}</p>
      </div>

      <div className="flex gap-3">
        <a
          href={qr.storage_url}
          download={`qr-${params.slug}.png`}
          data-testid="btn-download"
          className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
        >
          Télécharger PNG
        </a>
        <QrCodeAdminClient citySlug={params.slug} adminSecret={adminSecret} />
      </div>
    </div>
  )
}
