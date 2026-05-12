import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useWallet } from '@solana/wallet-adapter-react'
import { useNavigate } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { ToastContainer } from '../ui/ToastContainer'
import { useAppStore } from '../../store'

interface AppLayoutProps {
  children: React.ReactNode
  pageTitle: string
  pageSubtitle?: string
}

const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
}

export function AppLayout({ children, pageTitle, pageSubtitle }: AppLayoutProps) {
  const { sidebarCollapsed, user, setUser, logout } = useAppStore()
  const { publicKey, connected } = useWallet()
  const navigate = useNavigate()

  useEffect(() => {
    if (connected && publicKey && user && user.walletAddress !== publicKey.toBase58()) {
      setUser({ ...user, walletAddress: publicKey.toBase58() })
    }
  }, [connected, publicKey, user, setUser])

  useEffect(() => {
    if (!connected) {
      logout()
      navigate('/auth', { replace: true })
    }
  }, [connected])

  return (
    <div className="min-h-screen bg-[#08080F] flex">
      {/* Background decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] opacity-30"
          style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.15) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-0 w-[600px] h-[300px] opacity-20"
          style={{ background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.2) 0%, transparent 70%)' }} />
      </div>

      <Sidebar />

      {/* Main content area */}
      <main
        className="flex-1 flex flex-col w-full min-h-screen relative z-10 pb-32"
      >
        <Topbar title={pageTitle} subtitle={pageSubtitle} />

        <div
          key={pageTitle}
          className="flex-1 mt-6 mx-auto w-full px-6 md:px-12 overflow-y-auto"
        >
          {children}
        </div>
      </main>

      <ToastContainer />
    </div>
  )
}
