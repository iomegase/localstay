'use client'

import { useEffect, useState } from 'react'

type StoredProgress = { checked: number[]; departed: boolean }

const EMPTY: StoredProgress = { checked: [], departed: false }

function storageKey(lodgingId: string): string {
  return `mystay:stay:${lodgingId}`
}

function read(lodgingId: string): StoredProgress {
  try {
    const raw = window.localStorage.getItem(storageKey(lodgingId))
    if (!raw) return EMPTY
    const parsed = JSON.parse(raw) as Partial<StoredProgress>
    return {
      checked: Array.isArray(parsed.checked) ? parsed.checked.filter(Number.isInteger) : [],
      departed: parsed.departed === true,
    }
  } catch {
    return EMPTY
  }
}

/**
 * Progression du séjour propre à cet appareil (checklist, départ) :
 * survit aux changements de route du guide, sans aucune donnée personnelle.
 */
export function useStayProgress(lodgingId: string, { persist = true }: { persist?: boolean } = {}) {
  const [progress, setProgress] = useState<StoredProgress>(EMPTY)

  useEffect(() => {
    if (persist) setProgress(read(lodgingId))
  }, [lodgingId, persist])

  function update(next: (current: StoredProgress) => StoredProgress) {
    setProgress(current => {
      const value = next(current)
      if (!persist) return value
      try {
        window.localStorage.setItem(storageKey(lodgingId), JSON.stringify(value))
      } catch {
        /* stockage indisponible : l'état reste en mémoire */
      }
      return value
    })
  }

  return {
    checked: new Set(progress.checked),
    departed: progress.departed,
    toggle(index: number) {
      update(current => ({
        ...current,
        checked: current.checked.includes(index)
          ? current.checked.filter(item => item !== index)
          : [...current.checked, index],
      }))
    },
    markDeparted() {
      update(current => ({ ...current, departed: true }))
    },
  }
}
