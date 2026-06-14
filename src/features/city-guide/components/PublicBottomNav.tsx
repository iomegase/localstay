'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Heart, Home, Map, LocateFixed } from 'lucide-react'
import { useUserLocation } from '@/features/geolocation/hooks/useUserLocation'
import { contextualContactPath, contextualFavoritesPath } from '@/features/city-guide/lib/public-paths'

type Props = {
  mode: 'anonymous' | 'lodging'
  citySlug?: string | null
}

type NavItemConfig = {
  href: string
  label: string
  icon: ReactNode
  active: boolean
}

const SCROLL_IDLE_MS = 180

function getGuideCitySlug(pathname: string | null): string | null {
  if (!pathname) return null

  const segments = pathname.split('/').filter(Boolean)
  if (segments[0] !== 'guide' || !segments[1]) return null
  return segments[1]
}

function isPathActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false
  if (href === '/') return pathname === '/'
  return pathname === href || pathname.startsWith(`${href}/`)
}

function buildAnonymousItems(pathname: string | null): NavItemConfig[] {
  const guideCitySlug = getGuideCitySlug(pathname)
  const favoritesHref = contextualFavoritesPath(guideCitySlug)
  const contactHref = contextualContactPath(guideCitySlug)

  const items: NavItemConfig[] = [
    {
      href: '/',
      label: 'Bienvenue',
      icon: <Compass className="w-5 h-5" />,
      active: isPathActive(pathname, '/'),
    },
  ]

  if (guideCitySlug) {
    const guideHref = `/guide/${guideCitySlug}`
    items.push({
      href: guideHref,
      label: 'Guide',
      icon: <Map className="w-5 h-5" />,
      active: isPathActive(pathname, guideHref),
    })
  }

  items.push(
    {
      href: favoritesHref,
      label: 'Vos favoris',
      icon: <Heart className="w-5 h-5" />,
      active: isPathActive(pathname, favoritesHref),
    },
    {
      href: contactHref,
      label: 'Contact',
      icon: <Home className="w-5 h-5" />,
      active: isPathActive(pathname, contactHref),
    },
  )

  return items
}

function buildLodgingItems(pathname: string | null, citySlug?: string | null): NavItemConfig[] {
  const guideHref = citySlug ? `/guide/${citySlug}` : '/'
  const favoritesHref = contextualFavoritesPath(citySlug)

  return [
    {
      href: '/',
      label: 'Bienvenue',
      icon: <Compass className="w-5 h-5" />,
      active: isPathActive(pathname, '/'),
    },
    {
      href: '/le-logement',
      label: 'Logement',
      icon: <Home className="w-5 h-5" />,
      active: isPathActive(pathname, '/le-logement'),
    },
    {
      href: favoritesHref,
      label: 'Vos favoris',
      icon: <Heart className="w-5 h-5" />,
      active: isPathActive(pathname, favoritesHref),
    },
    {
      href: guideHref,
      label: 'Guide',
      icon: <Map className="w-5 h-5" />,
      active: guideHref !== '/' && isPathActive(pathname, guideHref),
    },
  ]
}

export function PublicBottomNav({ mode, citySlug }: Props) {
  const pathname = usePathname()
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollIdleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const items = mode === 'lodging'
    ? buildLodgingItems(pathname, citySlug)
    : buildAnonymousItems(pathname)
  const navVisibilityClassName = isScrolling
    ? 'opacity-0 pointer-events-none'
    : 'opacity-100'
  const surfaceClassName = isScrolling
    ? 'bg-transparent border-transparent shadow-none backdrop-blur-0'
    : 'glass border-black/5 shadow-xl'

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolling(true)

      if (scrollIdleTimer.current) {
        clearTimeout(scrollIdleTimer.current)
      }

      scrollIdleTimer.current = setTimeout(() => {
        setIsScrolling(false)
        scrollIdleTimer.current = null
      }, SCROLL_IDLE_MS)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollIdleTimer.current) {
        clearTimeout(scrollIdleTimer.current)
      }
    }
  }, [])

  return (
    <nav
      data-testid="public-bottom-nav"
      className={`fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[390px] immersive-hide transition-opacity duration-200 ${navVisibilityClassName}`}
    >
      <div
        data-testid="public-bottom-nav-surface"
        className={`border rounded-full px-8 py-4 flex justify-between items-center transition-all duration-300 ${surfaceClassName}`}
      >
        {items.map(item => (
          <NavItem key={item.href} {...item} />
        ))}
        {getGuideCitySlug(pathname) && <GeoNavButton />}
      </div>
    </nav>
  )
}

function NavItem({
  icon,
  label,
  href,
  active,
}: NavItemConfig) {
  return (
    <Link
      href={href}
      className={`group flex flex-col items-center gap-1 transition-colors ${
        active ? 'text-[#bd9254]' : 'text-[#6f7480] hover:text-[#bd9254]'
      }`}
    >
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-widest">
        {label}
      </span>
    </Link>
  )
}

/**
 * Bouton de géolocalisation intégré à la nav : active la position (distances
 * recalculées au plus près) et l'éteint au tap suivant. Couleur foncée = actif.
 */
function GeoNavButton() {
  const { status, location, requestLocation, clearLocation } = useUserLocation()
  const isActive = status === 'ready' && location !== null
  const isLoading = status === 'loading'

  const colorClassName = isActive
    ? 'text-charcoal'
    : 'text-[#6f7480] hover:text-charcoal'

  const label = isLoading ? 'GPS…' : isActive ? 'Activée' : 'Position'

  return (
    <button
      type="button"
      onClick={() => (isActive ? clearLocation() : requestLocation())}
      disabled={isLoading}
      aria-pressed={isActive}
      aria-label={isActive ? 'Désactiver la géolocalisation' : 'Activer la géolocalisation'}
      className={`flex flex-col items-center gap-1 transition-colors ${colorClassName} ${
        isLoading ? 'opacity-60' : ''
      }`}
    >
      <LocateFixed className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
      <span className="text-[9px] font-bold uppercase tracking-widest">{label}</span>
    </button>
  )
}
