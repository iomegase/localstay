'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Heart, Home, Map, LocateFixed, Newspaper } from 'lucide-react'
import { useUserLocation } from '@/features/geolocation/hooks/useUserLocation'

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

  const items: NavItemConfig[] = [
    {
      href: '/',
      label: 'Coup de\ncoeur',
      icon: <Heart className="w-5 h-5" />,
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
      href: '/blog',
      label: 'Blog',
      icon: <Newspaper className="w-5 h-5" />,
      active: isPathActive(pathname, '/blog'),
    },
  )

  return items
}

function buildLodgingItems(pathname: string | null, citySlug?: string | null): NavItemConfig[] {
  return [
    {
      href: '/',
      label: 'Coup de\ncoeur',
      icon: <Heart className="w-5 h-5" />,
      active: isPathActive(pathname, '/'),
    },
    {
      href: '/le-logement',
      label: 'Guide\nlogement',
      icon: <Home className="w-5 h-5" />,
      active: isPathActive(pathname, '/le-logement'),
    },
    {
      href: '/map',
      label: 'Carte',
      icon: <Map className="w-5 h-5" />,
      active: isPathActive(pathname, '/map'),
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

  const isMapPage = isPathActive(pathname, '/map')
  const navVisibilityClassName = isScrolling
    ? 'opacity-0 pointer-events-none translate-y-4' // Ajout d'un petit effet de glissement vers le bas au scroll
    : 'opacity-100 translate-y-0'
  const surfaceClassName = isScrolling
    ? 'bg-transparent border-transparent shadow-none backdrop-blur-0'
    : 'bg-white border-black/5 shadow-xl'

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
      className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[390px] ${isMapPage ? '' : 'immersive-hide'} transition-all duration-300 ease-in-out ${navVisibilityClassName}`}
    >
      <div
        data-testid="public-bottom-nav-surface"
        className={`border rounded-full px-2 py-1.5 flex justify-around items-center gap-1 transition-all duration-300 ease-out ${surfaceClassName}`}
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
  const labelLines = label.split('\n')

  return (
    <Link
      href={href}
      aria-label={labelLines.join(' ')}
      className={`group flex flex-col items-center justify-center gap-0.5 rounded-full transition-all duration-300 ease-out active:scale-95 ${
        active
          ? 'bg-slate-800 text-white px-6 py-1.5 shadow-sm'
          : 'text-[#6f7480] hover:text-[#4b5563] hover:bg-slate-50 px-2 py-1.5'
      }`}
    >
      <div className="transform transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
        {icon}
      </div>
      <span className="text-center text-[9px] font-bold uppercase tracking-wider leading-none">
        {labelLines.map(line => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
      </span>
    </Link>
  )
}

function GeoNavButton() {
  const { status, location, requestLocation, clearLocation } = useUserLocation()
  const isActive = status === 'ready' && location !== null
  const isLoading = status === 'loading'

  const colorClassName = isLoading
    ? 'text-orange-500'
    : isActive
      ? 'text-green-600 hover:text-green-700 bg-green-50'
      : 'text-red-500 hover:text-red-600 hover:bg-red-50'

  const label = isLoading ? 'GPS…' : isActive ? 'Activée' : 'Position'

  return (
    <button
      type="button"
      onClick={() => (isActive ? clearLocation() : requestLocation())}
      disabled={isLoading}
      aria-pressed={isActive}
      aria-label={isActive ? 'Désactiver la géolocalisation' : 'Activer la géolocalisation'}
      className={`group flex flex-col items-center justify-center gap-0.5 rounded-full px-2 py-1.5 transition-all duration-300 ease-out active:scale-95 ${colorClassName}`}
    >
      <div className="transform transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-105">
        <LocateFixed className={`w-5 h-5 ${isLoading ? 'animate-pulse' : ''}`} />
      </div>
      <span className="text-[9px] font-bold uppercase tracking-wider leading-none">{label}</span>
    </button>
  )
}