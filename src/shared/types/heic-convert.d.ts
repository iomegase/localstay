// Spec 085 : déclaration minimale de heic-convert (paquet sans types).
declare module 'heic-convert' {
  export default function heicConvert(options: {
    buffer: Buffer | Uint8Array | ArrayBuffer
    format: 'JPEG' | 'PNG'
    quality?: number
  }): Promise<ArrayBuffer | Buffer>
}
