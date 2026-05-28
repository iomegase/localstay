'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { 
  BarChart3, 
  Building2, 
  LayoutDashboard, 
  MapPinPlus, 
  MapPinned, 
  Mountain, 
  Radar, 
  Tags, 
  Users, 
  ChevronRight 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogoutButton } from '@/shared/components/LogoutButton'


const NAV_ITEMS = [
  { href: '/admin', label: 'Vue globale', icon: LayoutDashboard },
  { href: '/admin/merchant-claims', label: 'Revendications', icon: BarChart3 },
  { href: '/admin/cities', label: 'Villes', icon: Building2 },
  { href: '/admin/taxonomy', label: 'Taxonomie', icon: Tags },
  { href: '/admin/poi-acquisition', label: 'Acquisition POI', icon: Radar },
  { href: '/admin/pois', label: 'POI par ville', icon: MapPinned },
  { href: '/admin/trails', label: 'Randonnées', icon: Mountain },
  { href: '/admin/pois/new', label: 'Créer POI', icon: MapPinPlus },
  { href: '/admin/users', label: 'Utilisateurs', icon: Users },
]

const LINK_THEMES = [
  { groupHover: 'hover:bg-blue-50/80', icon: 'text-slate-400 group-hover:text-blue-500', text: 'text-slate-500 group-hover:text-blue-700' },
  { groupHover: 'hover:bg-amber-50/80', icon: 'text-slate-400 group-hover:text-amber-500', text: 'text-slate-500 group-hover:text-amber-700' },
  { groupHover: 'hover:bg-emerald-50/80', icon: 'text-slate-400 group-hover:text-emerald-500', text: 'text-slate-500 group-hover:text-emerald-700' },
  { groupHover: 'hover:bg-fuchsia-50/80', icon: 'text-slate-400 group-hover:text-fuchsia-500', text: 'text-slate-500 group-hover:text-fuchsia-700' },
  { groupHover: 'hover:bg-indigo-50/80', icon: 'text-slate-400 group-hover:text-indigo-500', text: 'text-slate-500 group-hover:text-indigo-700' },
  { groupHover: 'hover:bg-rose-50/80', icon: 'text-slate-400 group-hover:text-rose-500', text: 'text-slate-500 group-hover:text-rose-700' },
  { groupHover: 'hover:bg-orange-50/80', icon: 'text-slate-400 group-hover:text-orange-500', text: 'text-slate-500 group-hover:text-orange-700' },
  { groupHover: 'hover:bg-cyan-50/80', icon: 'text-slate-400 group-hover:text-cyan-500', text: 'text-slate-500 group-hover:text-cyan-700' },
  { groupHover: 'hover:bg-violet-50/80', icon: 'text-slate-400 group-hover:text-violet-500', text: 'text-slate-500 group-hover:text-violet-700' },
]

export default function AdminPathLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50/50 font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900">
      <div className="flex min-h-screen">
        {/* DESKTOP SIDEBAR */}
        <motion.aside
          initial={false}
          animate={{ width: isCollapsed ? 80 : 260 }}
          transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
          className="relative hidden flex-col border-r border-slate-100 bg-white shadow-[4px_0_24px_rgba(0,0,0,0.02)] md:flex z-20"
        >
          {/* Toggle Button */}
          <motion.button
            onClick={() => setIsCollapsed(!isCollapsed)}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="absolute -right-3 top-9 z-30 flex h-6 w-6 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-400 shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-colors hover:text-slate-600 focus:outline-none"
          >
            <motion.div animate={{ rotate: isCollapsed ? 0 : 180 }} transition={{ duration: 0.3 }}>
              <ChevronRight className="h-3 w-3" />
            </motion.div>
          </motion.button>

          {/* Logo Section */}
          <div className="relative flex h-24 flex-shrink-0 items-center overflow-hidden px-4">
            <div className="flex w-12 flex-shrink-0 items-center justify-center">
              <div className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-sm font-bold text-white shadow-md">
                SL
              </div>
            </div>
            
            <AnimatePresence initial={false}>
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10, width: 0 }}
                  animate={{ opacity: 1, x: 0, width: "auto" }}
                  exit={{ opacity: 0, x: -10, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="ml-2 flex flex-col overflow-hidden whitespace-nowrap"
                >
                  <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-slate-400 leading-tight">StayLocal</span>
                  <span className="text-sm font-bold text-slate-800 leading-tight">Super-Admin</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 space-y-1.5 overflow-y-auto overflow-x-hidden px-4 pb-6 pt-2 scrollbar-hide">
            {NAV_ITEMS.map(({ href, label, icon: Icon }, index) => {
              const theme = LINK_THEMES[index % LINK_THEMES.length]
              const isPending = label === 'Revendications'

              return (
                <Link key={href} href={href} className="block outline-none">
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`group relative flex h-[44px] cursor-pointer items-center overflow-hidden rounded-xl transition-all duration-200 ${theme.groupHover}`}
                  >
                    <div className={`relative z-10 flex w-12 flex-shrink-0 items-center justify-center transition-colors duration-200 ${theme.icon}`}>
                      <Icon className="h-[20px] w-[20px] stroke-[2]" />
                    </div>

                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`relative z-10 flex-1 whitespace-nowrap text-[13px] font-medium tracking-wide transition-colors duration-200 ${theme.text}`}
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Notification badge when expanded */}
                    <AnimatePresence initial={false}>
                      {!isCollapsed && isPending && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="relative z-10 mr-3 flex h-full items-center justify-center"
                        >
                          <span aria-label="Badge revendications pending" className="h-2 w-2 rounded-full bg-amber-400 shadow-sm" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Notification badge when collapsed */}
                    <AnimatePresence initial={false}>
                      {isCollapsed && isPending && (
                        <motion.span
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className="absolute right-2.5 top-2.5 z-20 h-2 w-2 box-content rounded-full border-2 border-white bg-amber-400"
                        />
                      )}
                    </AnimatePresence>
                  </motion.div>
                </Link>
              )
            })}
          </nav>

          {/* Logout au pied du sidebar */}
          <div className="border-t border-slate-100 p-3">
            <LogoutButton variant="sidebar" showLabel={!isCollapsed} />
          </div>
        </motion.aside>

        {/* MAIN CONTENT */}
        <main className="flex w-full min-w-0 flex-1 flex-col">
          {/* MOBILE HEADER */}
          <header className="sticky top-0 z-20 border-b border-slate-100 bg-white/80 px-4 py-3 shadow-[0_4px_16px_rgba(0,0,0,0.01)] backdrop-blur-xl md:hidden">
            <div className="flex items-center justify-between gap-3 px-1">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-fuchsia-500 text-xs font-bold text-white shadow-sm">
                  SL
                </div>
                <div className="pt-0.5">
                  <p className="mb-0.5 text-[9px] font-bold uppercase leading-none tracking-[0.2em] text-slate-400">StayLocal</p>
                  <p className="text-sm font-semibold leading-none text-slate-800">Super-Admin</p>
                </div>
              </div>
              <LogoutButton variant="compact" />
            </div>
            <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-1">
              {NAV_ITEMS.map((item, index) => {
                const theme = LINK_THEMES[index % LINK_THEMES.length]
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-2 rounded-full border border-slate-100 bg-white px-4 py-2 text-xs font-medium shadow-sm transition-all ${theme.groupHover}`}
                  >
                    <item.icon className={`h-3.5 w-3.5 transition-colors ${theme.icon}`} />
                    <span className={`transition-colors ${theme.text}`}>{item.label}</span>
                    {item.label === 'Revendications' && (
                      <span aria-label="Badge revendications pending" className="ml-0.5 h-[6px] w-[6px] shrink-0 rounded-full bg-amber-400" />
                    )}
                  </Link>
                )
              })}
            </nav>
          </header>
          
          <div className="mx-auto w-full flex-1 px-4 py-8 ">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}