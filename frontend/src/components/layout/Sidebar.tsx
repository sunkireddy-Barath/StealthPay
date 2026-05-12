import { motion } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  Link2,
  Wallet,
  ShieldCheck,
} from 'lucide-react'
import { cn } from '../../lib/utils'

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { id: 'payroll', label: 'Payroll', icon: Users, path: '/payroll' },
  { id: 'invoices', label: 'Invoices', icon: FileText, path: '/invoices' },
  { id: 'payments', label: 'Payment Links', icon: Link2, path: '/payments' },
  { id: 'wallet', label: 'Wallet', icon: Wallet, path: '/wallet' },
  { id: 'compliance', label: 'Compliance', icon: ShieldCheck, path: '/compliance' },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-fit">
      <nav
        className="flex items-center gap-1 sm:gap-2 px-3 py-2 rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/10"
        style={{
          background: 'rgba(15, 15, 25, 0.6)',
          backdropFilter: 'blur(24px) saturate(180%)',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = location.pathname === item.path
          const Icon = item.icon
          return (
            <NavLink key={item.id} to={item.path}>
              <motion.div
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.95 }}
                className={cn(
                  'relative flex flex-col items-center justify-center px-2 min-w-[4.5rem] h-14 rounded-xl transition-all duration-300',
                  isActive 
                    ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' 
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5'
                )}
                title={item.label}
              >
                <Icon className="w-4 h-4 mb-1" />
                <span className="text-[10px] font-medium tracking-tight leading-none text-center whitespace-nowrap">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="activeDot"
                    className="absolute -bottom-1 w-1 h-1 rounded-full bg-violet-400"
                  />
                )}
              </motion.div>
            </NavLink>
          )
        })}


      </nav>
    </div>
  )
}
