'use client'

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react'
import { detectInstallPlatform, type InstallPlatform } from '../lib/install-platform'
import { installEndsAt, readInstallRecord } from '../lib/install-expiry'

/** Événement Chromium non typé par lib.dom. */
type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

// L'invite native arrive une seule fois, souvent avant l'ouverture de l'écran
// Réglages : on la capte dès le montage du guide (GuidePwaRuntime).
let deferredPrompt: BeforeInstallPromptEvent | null = null
let installedFromBrowser = false
let capturing = false
const listeners = new Set<() => void>()

function emit() {
  listeners.forEach(listener => listener())
}

function onBeforeInstallPrompt(event: Event) {
  event.preventDefault()
  deferredPrompt = event as BeforeInstallPromptEvent
  emit()
}

function onAppInstalled() {
  deferredPrompt = null
  installedFromBrowser = true
  emit()
}

export function startInstallPromptCapture(): void {
  if (capturing || typeof window === 'undefined') return
  capturing = true
  window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt)
  window.addEventListener('appinstalled', onAppInstalled)
}

export function resetInstallPromptForTests(): void {
  if (typeof window !== 'undefined') {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt)
    window.removeEventListener('appinstalled', onAppInstalled)
  }
  capturing = false
  deferredPrompt = null
  installedFromBrowser = false
  emit()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => { listeners.delete(listener) }
}

export function isStandaloneDisplay(): boolean {
  if (typeof window === 'undefined') return false
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  return iosStandalone || Boolean(window.matchMedia?.('(display-mode: standalone)').matches)
}

type InstallSnapshot = { hasPrompt: boolean; installed: boolean }
let snapshot: InstallSnapshot = { hasPrompt: false, installed: false }
function getSnapshot(): InstallSnapshot {
  const hasPrompt = deferredPrompt !== null
  if (snapshot.hasPrompt !== hasPrompt || snapshot.installed !== installedFromBrowser) {
    snapshot = { hasPrompt, installed: installedFromBrowser }
  }
  return snapshot
}
const SERVER_SNAPSHOT: InstallSnapshot = { hasPrompt: false, installed: false }

/** Spec 059 AC-01-03 à AC-01-06 : état de la carte « Installer le guide ». */
export function useGuideInstall(lodgingId: string): {
  platform: InstallPlatform | null
  endsAt: Date | null
  promptInstall: () => Promise<void>
} {
  const { hasPrompt, installed } = useSyncExternalStore(subscribe, getSnapshot, () => SERVER_SNAPSHOT)
  const [environment, setEnvironment] = useState<{ standalone: boolean; endsAt: Date | null } | null>(null)

  useEffect(() => {
    const standalone = isStandaloneDisplay()
    const record = standalone ? readInstallRecord(lodgingId) : null
    setEnvironment({ standalone, endsAt: record ? installEndsAt(record) : null })
  }, [lodgingId])

  const promptInstall = useCallback(async () => {
    const event = deferredPrompt
    if (!event) return
    await event.prompt()
    const choice = await event.userChoice
    deferredPrompt = null
    if (choice.outcome === 'accepted') installedFromBrowser = true
    emit()
  }, [])

  const platform = environment === null
    ? null
    : installed
      ? 'installed'
      : detectInstallPlatform({
        userAgent: window.navigator.userAgent,
        standalone: environment.standalone,
        hasNativePrompt: hasPrompt,
        maxTouchPoints: window.navigator.maxTouchPoints ?? 0,
      })

  return { platform, endsAt: environment?.endsAt ?? null, promptInstall }
}
