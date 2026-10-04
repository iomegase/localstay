'use client'

import { useState, useSyncExternalStore } from 'react'
import type { GuideRouteMap, GuideView } from '../types'

const TAB_FRAGMENTS = { map: '#carte', help: '#reglages' } as const
const NAVIGATION_EVENT = 'guide-view-navigation'

function currentUrl() {
  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}

function subscribe(listener: () => void) {
  window.addEventListener('popstate', listener)
  window.addEventListener('hashchange', listener)
  window.addEventListener(NAVIGATION_EVENT, listener)
  return () => {
    window.removeEventListener('popstate', listener)
    window.removeEventListener('hashchange', listener)
    window.removeEventListener(NAVIGATION_EVENT, listener)
  }
}

function fragmentView(url: string): GuideView | undefined {
  const hash = url.slice(url.indexOf('#'))
  if (hash === TAB_FRAGMENTS.map) return 'map'
  if (hash === TAB_FRAGMENTS.help) return 'help'
}

function viewFromUrl(url: string, routes: GuideRouteMap): GuideView | undefined {
  const pathname = url.split(/[?#]/)[0]
  return fragmentView(url) ?? (Object.keys(routes) as (keyof GuideRouteMap)[]).find(
    view => routes[view] === pathname,
  )
}

/** Spec 054 AC-01-09–11 : une seule navigation locale, avec historique natif. */
export function useGuideViewNavigation(initialView: GuideView, routes?: GuideRouteMap) {
  const url = useSyncExternalStore(subscribe, currentUrl, () => '')
  const [selection, setSelection] = useState({
    url,
    view: (routes ? fragmentView(url) : undefined) ?? initialView,
  })
  const activeView = selection.url === url
    ? selection.view
    : (routes ? viewFromUrl(url, routes) : undefined) ?? selection.view
  if (selection.url !== url) setSelection({ url, view: activeView })

  function setActiveView(view: GuideView) {
    setSelection({ url: currentUrl(), view })
  }

  function navigate(view: GuideView) {
    if (routes) {
      const href = view === 'map' || view === 'help'
        ? `${window.location.pathname}${window.location.search}${TAB_FRAGMENTS[view]}`
        : view === 'poi' ? undefined : routes[view]
      if (href && href !== currentUrl()) {
        // Next.js conserve son arbre client ; aucun chargement RSC du guide.
        window.history.pushState(null, '', href)
        window.dispatchEvent(new Event(NAVIGATION_EVENT))
      }
    }
    setActiveView(view)
  }

  return { activeView, setActiveView, navigate }
}
