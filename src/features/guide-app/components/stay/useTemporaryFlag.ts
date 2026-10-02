'use client'

import { useEffect, useRef, useState } from 'react'

/** Drapeau vrai pendant `durationMs` après `trigger()` (« Copié ✓ »). */
export function useTemporaryFlag(durationMs: number): [boolean, () => void] {
  const [on, setOn] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current)
  }, [])

  function trigger() {
    setOn(true)
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setOn(false), durationMs)
  }

  return [on, trigger]
}

export async function copyToClipboard(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    return false
  }
}
