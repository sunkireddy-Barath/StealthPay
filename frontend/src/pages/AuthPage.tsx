import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Zap, Lock, Shield, Eye, FileText, Users, Link2 } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useAppStore } from '../store'

const FEATURES = [
  { icon: Users,    label: 'Private Payroll',    desc: 'Confidential salary transfers via stealth addresses' },
  { icon: FileText, label: 'Encrypted Invoices',  desc: 'On-chain invoices with zero-knowledge amounts' },
  { icon: Link2,    label: 'Payment Links',       desc: 'Shareable links for anonymous incoming payments' },
  { icon: Eye,      label: 'Selective Disclosure', desc: 'Share viewing keys only when compliance requires' },
]

export default function AuthPage() {
  const navigate = useNavigate()
  const { connected, publicKey } = useWallet()
  const { authenticateWallet } = useAppStore()

  useEffect(() => {
    if (connected && publicKey) {
      authenticateWallet(publicKey.toBase58())
      navigate('/dashboard', { replace: true })
    }
  }, [connected, publicKey])

  return (
    <div className="min-h-screen bg-[#08080F] flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.14) 0%, transparent 70%)' }}
        />
        <div className="absolute inset-0 grid-pattern opacity-25" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center gap-3 mb-12 relative z-10"
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center glow-violet"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}
        >
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-2xl font-black text-white tracking-tight">StealthPay</div>
          <div className="text-[10px] text-violet-400 font-bold uppercase tracking-[0.2em]">Private Finance OS · Solana</div>
        </div>
      </motion.div>

      {/* Hero + Connect Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="glass-card w-full max-w-md p-8 text-center relative z-10"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-black text-white mb-3 leading-tight">
            Private Business Finance<br />
            <span className="gradient-text-bright">Powered by Umbra Protocol</span>
          </h1>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Confidential payroll, invoices, and payments on Solana.
            <br />Your amounts stay private — always.
          </p>
        </div>

        {/* Wallet Connect */}
        <div className="flex flex-col items-center gap-4 mb-8">
          <WalletMultiButton className="!bg-violet-600 hover:!bg-violet-700 !rounded-xl !h-14 !px-10 !text-sm !font-bold !w-full !justify-center !transition-all" />
          <p className="text-[10px] text-zinc-600">
            Supports Phantom, Solflare, and all Solana Wallet Standard wallets
          </p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 mb-6">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold">Features</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {/* Feature grid */}
        <div className="grid grid-cols-2 gap-3 text-left">
          {FEATURES.map((f) => (
            <div
              key={f.label}
              className="p-3 rounded-xl"
              style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.12)' }}
            >
              <f.icon className="w-4 h-4 text-violet-400 mb-2" />
              <div className="text-[11px] font-bold text-white mb-0.5">{f.label}</div>
              <div className="text-[10px] text-zinc-500 leading-tight">{f.desc}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Trust footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-6 mt-10 opacity-30 relative z-10"
      >
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-zinc-400" />
          <span className="text-[9px] text-zinc-400 uppercase tracking-[0.2em] font-bold">Umbra Protocol</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-zinc-700" />
        <div className="flex items-center gap-2">
          <Lock className="w-3 h-3 text-zinc-400" />
          <span className="text-[9px] text-zinc-400 uppercase tracking-[0.2em] font-bold">Non-Custodial</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-zinc-700" />
        <div className="flex items-center gap-2">
          <Zap className="w-3 h-3 text-zinc-400" />
          <span className="text-[9px] text-zinc-400 uppercase tracking-[0.2em] font-bold">Solana Devnet</span>
        </div>
      </motion.div>
    </div>
  )
}
