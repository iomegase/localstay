'use client'

import type { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Compass, Heart, Home, Map } from 'lucide-react'

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
      href: '/mes-favoris',
      label: 'Vos favoris',
      icon: <Heart className="w-5 h-5" />,
      active: isPathActive(pathname, '/mes-favoris'),
    },
    {
      href: '/contact',
      label: 'Contact',
      icon: <Home className="w-5 h-5" />,
      active: isPathActive(pathname, '/contact'),
    },
  )

  return items
}

function buildLodgingItems(pathname: string | null, citySlug?: string | null): NavItemConfig[] {
  const guideHref = citySlug ? `/guide/${citySlug}` : '/'

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
      href: '/mes-favoris',
      label: 'Vos favoris',
      icon: <Heart className="w-5 h-5" />,
      active: isPathActive(pathname, '/mes-favoris'),
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
  const items = mode === 'lodging'
    ? buildLodgingItems(pathname, citySlug)
    : buildAnonymousItems(pathname)

  return (
    <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-[390px] immersive-hide">
      <div className="glass border border-black/5 rounded-full px-8 py-4 flex justify-between items-center shadow-xl">
        {items.map(item => (
          <NavItem key={item.href} {...item} />
        ))}
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
        active ? 'text-charcoal' : 'text-gray-300 hover:text-gold'
      }`}
    >
      {icon}
      <span className="text-[9px] font-bold uppercase tracking-widest">
        {label}
      </span>
    </Link>
  )
}
