'use client'

import type { ReactNode } from 'react'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  ChevronRight,
  Search,
  Bell,
  ChevronDown
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

export default function AdminPathLayout({ children }: { children: ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const pathname = usePathname()

  return (
    <div className="min-h-screen md:h-screen bg-[#F4F7FE] font-sans text-slate-900 selection:bg-indigo-100 selection:text-indigo-900 flex flex-col md:flex-row p-0 md:p-6 md:gap-8 overflow-x-hidden">
      
      {/* ======================= */}
      {/* DESKTOP SIDEBAR (FIXE)  */}
      {/* ======================= */}
      <motion.aside
        initial={false}
        animate={{ width: isCollapsed ? 100 : 280 }}
        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
        className="sticky top-6 h-[calc(100vh-3rem)] hidden flex-col bg-[#0B1437] rounded-[35px] shadow-2xl shadow-indigo-900/10 md:flex z-20 overflow-visible shrink-0"
      >
        {/* Toggle Button : À cheval sur le bord droit */}
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
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-md p-1.5 overflow-hidden">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
          </div>
          
          <AnimatePresence initial={false}>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10, width: 0 }}
                animate={{ opacity: 1, x: 0, width: "auto" }}
                exit={{ opacity: 0, x: -10, width: 0 }}
                transition={{ duration: 0.2 }}
                className="ml-3 flex flex-col overflow-hidden whitespace-nowrap"
              >
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400 leading-tight">StayLocal</span>
                <span className="text-base font-bold text-white leading-tight mt-1">Super-Admin</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 space-y-3 overflow-y-auto overflow-x-hidden px-4 pb-6 pt-4 scrollbar-hide">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || (href !== '/admin' && pathname?.startsWith(href))
            const isPending = label === 'Revendications'

            return (
              <Link key={href} href={href} className="block outline-none w-full group">
                <div className="relative flex w-full items-center">
                  
                  {/* Indicateur Actif : Parfaitement centré verticalement sur l'item */}
                  {isActive && (
                    <motion.div 
                      layoutId="activeIndicator"
                      className="absolute -left-4 top-1/2 -translate-y-1/2 w-1.5 h-8 bg-white rounded-r-full shadow-[0_0_10px_rgba(255,255,255,0.5)] z-20"
                    />
                  )}

                  <motion.div
                    whileHover={{ scale: isActive ? 1 : 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 25 }}
                    className={`relative flex h-[52px] cursor-pointer items-center overflow-hidden transition-all duration-300 w-full ${
                      isCollapsed ? 'justify-center rounded-[18px]' : 'rounded-xl px-2'
                    } ${
                      isActive 
                        ? isCollapsed 
                          ? 'bg-white text-[#0B1437] shadow-lg shadow-black/20 w-12 mx-auto' 
                          : 'bg-white/10 text-white' 
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <div className={`relative z-10 flex flex-shrink-0 items-center justify-center transition-colors duration-200 ${isCollapsed ? 'w-full' : 'w-10'}`}>
                      <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.5 : 2} />
                    </div>

                    <AnimatePresence initial={false}>
                      {!isCollapsed && (
                        <motion.span
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 'auto' }}
                          exit={{ opacity: 0, width: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`relative z-10 flex-1 whitespace-nowrap text-[14px] font-medium tracking-wide ml-2 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'}`}
                        >
                          {label}
                        </motion.span>
                      )}
                    </AnimatePresence>

                    {/* Notification badge */}
                    <AnimatePresence initial={false}>
                      {isPending && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0 }}
                          className={`relative z-10 flex items-center justify-center ${isCollapsed ? 'absolute top-2 right-2' : 'mr-2'}`}
                        >
                          <span aria-label="Badge" className={`rounded-full bg-amber-400 ${isCollapsed ? 'h-2.5 w-2.5 border-2 border-[#0B1437]' : 'h-2 w-2 shadow-[0_0_8px_rgba(251,191,36,0.6)]'}`} />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                </div>
              </Link>
            )
          })}
        </nav>

        {/* Logout au pied du sidebar (Rendu Orange comme demandé) */}
        <div className="mt-auto p-6 bg-white/5 border-t border-white/10">
          <div className={`
            [&_span]:text-orange-500 [&_span]:font-bold [&_svg]:text-orange-500 hover:[&_span]:text-orange-400 hover:[&_svg]:text-orange-400 transition-colors
            ${isCollapsed ? 'flex justify-center' : ''}
          `}>
            <LogoutButton variant="sidebar" showLabel={!isCollapsed} />
          </div>
        </div>
      </motion.aside>

      {/* ======================= */}
      {/* ZONE DE CONTENU DÉFILANTE */}
      {/* ======================= */}
      <div className="flex w-full min-w-0 flex-1 flex-col pt-0 md:pt-2 md:pr-2 md:overflow-y-auto md:h-full scrollbar-hide">
        
        {/* DESKTOP HEADER */}
        <header className="hidden md:flex items-center justify-between mb-8 px-2 shrink-0">
          <div className="relative w-full max-w-[420px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="search" 
              placeholder="Search" 
              className="w-full h-[52px] bg-white rounded-full pl-14 pr-6 text-sm font-medium text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#0B1437]/10 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-shadow" 
            />
          </div>
          
          <div className="flex items-center gap-8">
            <button className="relative text-gray-400 hover:text-[#0B1437] transition-colors">
              <Bell size={22} />
              <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-[#F4F7FE]"></span>
            </button>
            
            <div className="flex items-center gap-1.5 text-sm font-bold text-gray-500 cursor-pointer hover:text-[#0B1437] transition-colors">
              EN <ChevronDown size={16} strokeWidth={2.5} />
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <div className="text-sm font-bold text-gray-900 leading-tight">John Doe</div>
                <div className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Super Admin</div>
              </div>
              <img 
                src="https://api.dicebear.com/7.x/avataaars/svg?seed=John" 
                alt="Admin" 
                className="w-11 h-11 rounded-full bg-white border border-gray-200 shadow-sm" 
              />
            </div>
          </div>
        </header>

        {/* MOBILE HEADER */}
        <header className="sticky top-0 z-20 border-b border-gray-100 bg-white/80 px-4 py-3 shadow-sm backdrop-blur-xl md:hidden shrink-0">
          <div className="flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#0B1437] p-1 shadow-sm">
                <img src="/logo.png" alt="Logo" className="w-full h-full object-contain filter brightness-0 invert" />
              </div>
              <div className="pt-0.5">
                <p className="mb-0.5 text-[9px] font-bold uppercase leading-none tracking-[0.2em] text-gray-400">StayLocal</p>
                <p className="text-sm font-bold leading-none text-slate-800">Super-Admin</p>
              </div>
            </div>
            <div className="[&_span]:text-orange-500 [&_svg]:text-orange-500">
                <LogoutButton variant="compact" />
            </div>
          </div>
          <nav className="mt-4 flex gap-2 overflow-x-auto pb-1 scrollbar-hide px-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href
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
                  {item.label === 'Revendications' && (
                    <span aria-label="Badge" className="ml-0.5 h-[6px] w-[6px] shrink-0 rounded-full bg-amber-400" />
                  )}
                </Link>
              )
            })}
          </nav>
        </header>
        
        <main className="mx-auto w-full flex-1 md:px-2 md:pb-8 p-4">
          {children}
        </main>
      </div>
    </div>
  )
}