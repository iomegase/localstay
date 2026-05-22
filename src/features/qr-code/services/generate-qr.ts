import QRCode from 'qrcode'
import sharp from 'sharp'

export async function generateQrPng(url: string): Promise<Buffer> {
  const rawBuffer = await QRCode.toBuffer(url, {
    type: 'png',
    width: 1200,
    margin: 4,
    errorCorrectionLevel: 'M',
    color: { dark: '#000000ff', light: '#ffffffff' },
  })

  return sharp(rawBuffer)
    .resize(1000, 1000, {
      fit: 'contain',
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    })
    .png()
    .toBuffer()
}
