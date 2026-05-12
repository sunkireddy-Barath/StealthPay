import { motion } from 'framer-motion'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  FileText,
  Link2,
  Wallet,
  ShieldCheck,
  LogOut,
} from 'lucide-react'
import { useAppStore } from '../../store'
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
  const { user, logout } = useAppStore()
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

        <div className="w-px h-8 bg-white/10 mx-2" />

        <motion.button
          whileHover={{ y: -4 }}
          whileTap={{ scale: 0.95 }}
          onClick={logout}
          className="flex flex-col items-center justify-center px-2 min-w-[4.5rem] h-14 rounded-xl text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
          title="Logout"
        >
          <LogOut className="w-4 h-4 mb-1" />
          <span className="text-[10px] font-medium tracking-tight leading-none">Logout</span>
        </motion.button>

        {user && (
          <div className="hidden sm:flex items-center gap-3 ml-2 pl-4 border-l border-white/10">
            <div className="flex flex-col items-end">
              <div className="text-[10px] font-bold text-white uppercase tracking-tighter truncate max-w-[120px]">
                {user.companyName || 'Merchant'}
              </div>
              <div className="text-[8px] text-zinc-500 font-mono truncate max-w-[120px]">
                {user.walletAddress ? `${user.walletAddress.slice(0, 4)}…${user.walletAddress.slice(-4)}` : 'Wallet'}
              </div>
            </div>
            <div className="w-8 h-8 rounded-full bg-violet-600 flex items-center justify-center text-[10px] font-black text-white border border-white/10">
              <span>{(user.companyName || 'M').charAt(0).toUpperCase()}</span>
            </div>
          </div>
        )}
      </nav>
    </div>
  )
}
