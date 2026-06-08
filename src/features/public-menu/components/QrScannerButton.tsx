'use client'

import { useRef, useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function QrScannerButton() {
  const [isScanning, setIsScanning] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const router = useRouter()
  const streamRef = useRef<MediaStream | null>(null)
  const jsqrRef = useRef<any>(null)

  useEffect(() => {
    if (isScanning && !jsqrRef.current) {
      import('jsqr').then(module => {
        jsqrRef.current = module.default
      })
    }
  }, [isScanning])

  async function startScanning() {
    setIsScanning(true)

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      })
      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play()
          scanQrCode()
        }
      }
    } catch (err) {
      console.error('Erreur accès caméra:', err)
      setIsScanning(false)
    }
  }

  function scanQrCode() {
    if (!videoRef.current || !canvasRef.current || !isScanning) return
    if (!jsqrRef.current) {
      requestAnimationFrame(scanQrCode)
      return
    }

    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    if (!context) return

    canvas.width = videoRef.current.videoWidth
    canvas.height = videoRef.current.videoHeight
    context.drawImage(videoRef.current, 0, 0)

    try {
      const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
      const code = jsqrRef.current(imageData.data, canvas.width, canvas.height)

      if (code) {
        stopScanning()
        handleQrResult(code.data)
        return
      }
    } catch {
      // Continue scanning
    }

    requestAnimationFrame(scanQrCode)
  }

  function stopScanning() {
    setIsScanning(false)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  function handleQrResult(qrCode: string) {
    // Assuming QR code format is /enter-stay/[code]
    router.push(`/enter-stay/${encodeURIComponent(qrCode)}`)
  }

  if (isScanning) {
    return (
      <div className="fixed inset-0 z-50 bg-charcoal/95 flex flex-col items-center justify-center">
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          playsInline
        />
        <canvas ref={canvasRef} className="hidden" />

        <button
          onClick={stopScanning}
          className="absolute top-6 left-6 text-white text-4xl hover:opacity-70"
        >
          ✕
        </button>

        <div className="absolute bottom-8 left-0 right-0 text-center text-white">
          <p className="text-sm opacity-80">Veuillez scanner le code QR</p>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={startScanning}
      className="w-full text-left bg-white border border-gray-100 rounded-2xl p-5 hover:bg-gray-50 transition-colors shadow-sm group"
    >
      <div className="flex items-center gap-4">
        <div className="flex-shrink-0 w-12 h-12 rounded-full bg-ivory flex items-center justify-center group-hover:bg-gray-100 transition-colors">
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5A6B5D"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <rect x="7" y="7" width="3" height="3"></rect>
            <rect x="14" y="7" width="3" height="3"></rect>
            <rect x="7" y="14" width="3" height="3"></rect>
            <rect x="14" y="14" width="3" height="3"></rect>
          </svg>
        </div>
        <div>
          <p className="font-semibold text-charcoal text-sm">J&apos;ai un code MyStay</p>
          <p className="text-xs text-gray-500 mt-0.5">Scannez pour accéder au logement</p>
        </div>
      </div>
    </button>
  )
}
