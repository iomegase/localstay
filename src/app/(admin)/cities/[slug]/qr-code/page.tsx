import { getQrCode } from '@/features/qr-code/queries/qr-code'
import { getPageAdmin } from '@/features/merchant/lib/get-page-admin'
import { QrCodeAdminClient } from './QrCodeAdminClient'

interface Props {
  params: Promise<{ slug: string }>
}

export default async function QrCodeAdminPage({ params }: Props) {
  // QR ville réservé au super-admin : redirige si l'utilisateur n'a pas le rôle 'admin'.
  await getPageAdmin()

  const { slug } = await params
  const qr = await getQrCode(slug)

  if (!qr) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">QR Code — {slug}</h1>
        <div data-testid="qr-empty-state" className="text-gray-500">
          Aucun QR code généré pour cette ville.
        </div>
        <QrCodeAdminClient citySlug={slug} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">QR Code — {slug}</h1>

      <img
        src={qr.storage_url}
        alt={`QR code pour ${slug}`}
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
          download={`qr-${slug}.png`}
          data-testid="btn-download"
          className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm"
        >
          Télécharger PNG
        </a>
        <QrCodeAdminClient citySlug={slug} />
      </div>
    </div>
  )
}
