'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Bell,
  Building2,
  CreditCard,
  ChevronDown,
  ChevronRight,
  LayoutDashboard,
  MessageSquare,
  BarChart3,
  Search,
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogoutButton } from '@/shared/components/LogoutButton'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Accueil', icon: LayoutDashboard },
  { href: '/dashboard/lodgings', label: 'Logements', icon: Building2 },
  { href: '/dashboard/messages', label: 'Messages', icon: MessageSquare },
  { href: '/dashboard/stats', label: 'Statistiques', icon: BarChart3 },
  { href: '/dashboard/subscription', label: 'Abonnement', icon: CreditCard },
]

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#F4F7FE] p-0 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 md:h-screen md:flex-row md:gap-8 md:p-6">

      {/* ======================= */}
      {/* DESKTOP SIDEBAR (FIXE)  */}
      {/* ======================= */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 100 : 280 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="sticky top-6 z-20 hidden h-[calc(100vh-3rem)] shrink-0 flex-col overflow-visible rounded-[35px] bg-[#0B1437] shadow-2xl shadow-indigo-900/10 md:flex"
      >
        {/* Toggle Button */}
        <motion.button
          onClick={() => setIsCollapsed(!isCollapsed)}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          className="absolute -right-3.5 top-16 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-gray-100 bg-white text-[#0B1437] shadow-lg transition-colors hover:text-indigo-600 focus:outline-none"
        >
          <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.3 }}>
            <ChevronRight className="h-4 w-4" />
          </motion.div>
        </motion.button>

        {/* Logo Section */}
        <div className="relative flex h-32 flex-shrink-0 items-center px-6 pt-6">
          <div className="flex w-14 flex-shrink-0 items-center justify-center">
            <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-white p-1.5 shadow-md">
              <img src="/logo.png" alt="Logo" className="h-full w-full object-contain" />
            </div>
          </div>

          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: 'auto' }}
                exit={{ opacity: 0, x: -10, width: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-3 flex flex-col overflow-hidden whitespace-nowrap"
              >
                <span className="text-[10px] font-bold uppercase leading-tight tracking-[0.2em] text-gray-400">
                  MyStay
                </span>
                <span className="mt-1 text-base font-bold leading-tight text-white">
                  Hébergeur
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Links */}
        <nav className="scrollbar-hide flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 pb-6 pt-4">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === '/dashboard'
              ? pathname === '/dashboard'
              : pathname === href || pathname?.startsWith(`${href}/`)

            return (
              <Link key={href} href={href} className="group block w-full outline-none">
                <div className="relative flex w-full items-center">
                  {isActive && (
                    <motion.div
                      layoutId="ownerActiveIndicator"
                      className="absolute -left-4 top-1/2 z-20 h-8 w-1.5 -translate-y-1/2 rounded-r-full bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                    />
                  )}

                  <motion.div
                    whileHover={{ scale: isActive ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`relative flex h-[52px] w-full cursor-pointer items-center overflow-hidden transition-all duration-300 ${
                      isCollapsed ? 'justify-center rounded-[18px]' : 'rounded-xl px-2'
                    } ${
                      isActive
                        ? isCollapsed
                          ? 'mx-auto w-12 bg-white text-[#0B1437] shadow-lg shadow-black/20'
                          : 'bg-white/10 text-white'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <div
                      className={`relative z-10 flex flex-shrink-0 items-center justify-center transition-colors duration-200 ${
                        isCollapsed ? 'w-full' : 'w-10'
                      }`}
                    >
                      <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                    </div>

                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`relative z-10 ml-2 flex-1 whitespace-nowrap text-[14px] font-medium tracking-wide ${
                            isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                          }`}
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Logout en bas */}
        <div className="mt-auto border-t border-white/10 bg-white/5 p-6">
          <div
            className={`[&_span]:font-bold [&_span]:text-orange-500 [&_svg]:text-orange-500 hover:[&_span]:text-orange-400 hover:[&_svg]:text-orange-400 transition-colors ${
              isCollapsed ? 'flex justify-center' : ''
            }`}
          >
            <LogoutButton variant="sidebar" showLabel={!isCollapsed} />
          </div>
        </div>
      </motion.aside>

      {/* ======================= */}
      {/* ZONE DE CONTENU         */}
      {/* ======================= */}
      <div className="scrollbar-hide flex w-full min-w-0 flex-1 flex-col pt-0 md:h-full md:overflow-y-auto md:pr-2 md:pt-2">

        {/* DESKTOP HEADER */}
        <header className="mb-8 hidden shrink-0 items-center justify-between px-2 md:flex">
          <div className="relative w-full max-w-[420px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="search"
              placeholder="Rechercher"
              className="h-[52px] w-full rounded-full bg-white pl-14 pr-6 text-sm font-medium text-gray-700 placeholder-gray-400 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow focus:outline-none focus:ring-2 focus:ring-[#0B1437]/10"
            />
          </div>

          <div className="flex items-center gap-8">
            <button className="relative text-gray-400 transition-colors hover:text-[#0B1437]">
              <Bell size={22} />
            </button>

            <div className="flex cursor-pointer items-center gap-1.5 text-sm font-bold text-gray-500 transition-colors hover:text-[#0B1437]">
              FR <ChevronDown size={16} strokeWidth={2.5} />
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-bold leading-tight text-gray-900">Hébergeur</div>
                <div className="mt-0.5 text-[11px] font-bold uppercase tracking-widest text-gray-400">
                  Espace propriétaire
                </div>
              </div>
              <img
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=Owner"
                alt="Owner"
                className="h-11 w-11 rounded-full border border-gray-200 bg-white shadow-sm"
              />
            </div>
          </div>
        </header>

        {/* MOBILE HEADER */}
        <header className="sticky top-0 z-20 shrink-0 border-b border-gray-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0B1437] p-1 shadow-sm">
                <img
                  src="/logo.png"
                  alt="Logo"
                  className="h-full w-full object-contain brightness-0 invert"
                />
              </div>
              <div className="pt-0.5">
                <p className="mb-0.5 text-[9px] font-bold uppercase leading-none tracking-[0.2em] text-gray-400">
                  MyStay
                </p>
                <p className="text-sm font-bold leading-none text-slate-800">Hébergeur</p>
              </div>
            </div>
            <div className="[&_span]:text-orange-500 [&_svg]:text-orange-500">
              <LogoutButton variant="compact" />
            </div>
          </div>
          <nav className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto px-1 pb-1">
            {NAV_ITEMS.map(item => {
              const isActive = item.href === '/dashboard'
                ? pathname === '/dashboard'
                : pathname === item.href || pathname?.startsWith(`${item.href}/`)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-2 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#0B1437] text-white shadow-md'
                      : 'border border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="h-3.5 w-3.5" strokeWidth={isActive ? 2.5 : 2} />
                  <span className="whitespace-nowrap">{item.label}</span>
                </Link>
              )
            })}
          </nav>
        </header>

        <main className="mx-auto w-full flex-1 p-4 md:px-2 md:pb-8">{children}</main>
      </div>
    </div>
  )
}
