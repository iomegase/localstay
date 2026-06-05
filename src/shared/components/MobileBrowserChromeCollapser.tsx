'use client'

import { useEffect } from 'react'

const MOBILE_BROWSER_PATTERN = /Android|iPhone|iPad|iPod/i

type NavigatorWithStandalone = Navigator & {
  standalone?: boolean
}

function isMobileBrowser(): boolean {
  return MOBILE_BROWSER_PATTERN.test(window.navigator.userAgent)
}

function isStandaloneDisplayMode(): boolean {
  const navigatorWithStandalone = window.navigator as NavigatorWithStandalone
  return window.matchMedia('(display-mode: standalone)').matches || navigatorWithStandalone.standalone === true
}

function updateViewportHeight() {
  document.documentElement.style.setProperty('--mystay-viewport-height', `${window.innerHeight}px`)
}

function collapseBrowserChrome() {
  if (!isMobileBrowser() || isStandaloneDisplayMode()) return
  if (window.scrollY > 0) return
  if (document.documentElement.scrollHeight <= window.innerHeight) return

  window.requestAnimationFrame(() => window.scrollTo(0, 1))
}

export function MobileBrowserChromeCollapser() {
  useEffect(() => {
    document.body.classList.add('mobile-browser-immersive')

    const scheduleChromeCollapse = () => {
      updateViewportHeight()
      window.setTimeout(collapseBrowserChrome, 120)
    }

    scheduleChromeCollapse()

    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', scheduleChromeCollapse)
    window.addEventListener('pageshow', scheduleChromeCollapse)
    window.addEventListener('touchend', scheduleChromeCollapse, { passive: true })

    return () => {
      document.body.classList.remove('mobile-browser-immersive')
      document.documentElement.style.removeProperty('--mystay-viewport-height')
      window.removeEventListener('resize', updateViewportHeight)
      window.removeEventListener('orientationchange', scheduleChromeCollapse)
      window.removeEventListener('pageshow', scheduleChromeCollapse)
      window.removeEventListener('touchend', scheduleChromeCollapse)
    }
  }, [])

  return null
}
