import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Eye, EyeOff, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownLeft, Lock, Copy, Check } from 'lucide-react'
import { AppLayout } from '../components/layout/AppLayout'
import { useAppStore } from '../store'
import { formatAmount, truncateAddress, formatRelativeTime } from '../lib/utils'


export default function WalletPage() {
  const { transactions, balancesMasked, toggleBalanceMask, user, balances, fetchBalances } = useAppStore()
  const [copiedAddress, setCopiedAddress] = useState(false)

  useEffect(() => {
    fetchBalances()
  }, [])

  const displayBalances = balances || []
  const totalUSD = displayBalances.reduce((a, b) => a + (b.usdValue ?? 0), 0)

  const copyAddress = () => {
    if (user?.walletAddress) {
      navigator.clipboard.writeText(user.walletAddress).catch(() => {})
      setCopiedAddress(true)
      setTimeout(() => setCopiedAddress(false), 2000)
    }
  }

  return (
    <AppLayout pageTitle="Private Wallet" pageSubtitle="Encrypted balances and transaction history">
      <div className="w-full flex flex-col gap-6">
        {/* Bento Grid Top */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hero balance card (Spans 2 columns) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-8 relative overflow-hidden lg:col-span-2 flex flex-col justify-center"
          >
            <div className="absolute inset-0 opacity-30"
              style={{ background: 'radial-gradient(ellipse at 80% 20%, rgba(124,58,237,0.5), transparent 60%)' }} />
            <div className="relative">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-sm text-zinc-400 mb-2">Total Portfolio Value</p>
                  <motion.div
                    className={`text-6xl font-black tracking-tight ${balancesMasked ? 'privacy-mask' : 'gradient-text'}`}
                    animate={{ filter: balancesMasked ? 'blur(12px)' : 'blur(0px)' }}
                    transition={{ duration: 0.3 }}
                  >
                    {formatAmount(totalUSD)}
                  </motion.div>
                  <div className="flex items-center gap-2 mt-4">
                    <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-emerald-400" />
                      <span className="text-xs font-bold text-emerald-400">+2.4%</span>
                    </div>
                    <p className="text-sm text-zinc-500">Encrypted via Umbra Protocol</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleBalanceMask}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold shadow-[0_0_20px_rgba(124,58,237,0.15)]"
                    style={{ background: 'rgba(124,58,237,0.15)', border: '1px solid rgba(124,58,237,0.3)', color: '#a78bfa' }}
                  >
                    {balancesMasked ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    {balancesMasked ? 'Show' : 'Hide'}
                  </motion.button>
                </div>
              </div>

              {/* Wallet address */}
              {user?.walletAddress && (
                <div className="flex items-center gap-3 p-3 rounded-xl inline-flex"
                  style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Lock className="w-4 h-4 text-violet-400" />
                  </div>
                  <span className="text-sm font-mono text-zinc-300 tracking-wider">{truncateAddress(user.walletAddress, 12)}</span>
                  <button onClick={copyAddress} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors ml-2">
                    {copiedAddress ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-500" />}
                  </button>
                </div>
              )}
            </div>
          </motion.div>

          {/* Token balances */}
          <div className="glass-card p-6 flex flex-col h-[320px]">
            <h3 className="text-sm font-bold text-white mb-4 uppercase tracking-wider">Token Balances</h3>
            <div className="space-y-2 overflow-y-auto flex-1 pr-2 custom-scrollbar">
              {displayBalances.map((bal, i) => (
                <motion.div
                  key={bal.symbol}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="glass-card-hover p-4 flex items-center gap-4 border border-white/5 bg-white/[0.02]"
                >
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-lg"
                    style={{ background: `linear-gradient(135deg, hsl(${i * 80 + 260}, 70%, 50%), hsl(${i * 80 + 280}, 80%, 30%))` }}>
                    {bal.symbol.slice(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-bold text-white">{bal.token}</div>
                    <div className="text-xs text-zinc-500 uppercase tracking-wider font-medium">{bal.symbol}</div>
                  </div>
                  <div className="text-right">
                    <motion.div
                      className="text-sm font-bold text-white"
                      animate={{ filter: balancesMasked ? 'blur(6px)' : 'blur(0px)' }}
                      transition={{ duration: 0.3 }}
                    >
                      {balancesMasked ? '••••••' : formatAmount(bal.usdValue ?? 0)}
                    </motion.div>
                    <div className={`flex items-center gap-1 justify-end text-[10px] font-bold mt-0.5
                      ${(bal.percentChange24h ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {(bal.percentChange24h ?? 0) >= 0
                        ? <TrendingUp className="w-3 h-3" />
                        : <TrendingDown className="w-3 h-3" />}
                      {Math.abs(bal.percentChange24h ?? 0)}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Transaction history */}
        <div className="glass-card p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Transaction History</h3>
            <span className="badge-private shadow-[0_0_15px_rgba(16,185,129,0.2)]"><Lock className="w-3 h-3" /> All encrypted</span>
          </div>
          {transactions.length === 0 && (
            <div className="py-14 text-center border border-white/5 rounded-xl bg-black/20">
              <Lock className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 font-medium">No transactions yet</p>
              <p className="text-xs text-zinc-600 mt-1">Your encrypted transaction history will appear here.</p>
            </div>
          )}
          <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-black/20">
            {transactions.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-4 px-5 py-4 table-row-hover transition-colors"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0
                  ${tx.type === 'payroll' ? 'bg-violet-500/20 border border-violet-500/30 shadow-[0_0_10px_rgba(139,92,246,0.2)]' : 'bg-indigo-500/20 border border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.2)]'}`}>
                  {tx.type === 'payroll'
                    ? <ArrowUpRight className="w-5 h-5 text-violet-400" />
                    : <ArrowDownLeft className="w-5 h-5 text-indigo-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold text-white truncate">{tx.memo ?? tx.type}</div>
                  <div className="text-xs font-mono text-zinc-500 truncate mt-0.5">{tx.txHash}</div>
                </div>
                <div className="text-right flex-shrink-0">
                  <motion.div
                    className="text-sm font-mono font-bold text-zinc-300"
                    animate={{ filter: balancesMasked ? 'blur(4px)' : 'blur(0px)' }}
                    transition={{ duration: 0.3 }}
                  >
                    {tx.encryptedAmount.slice(0, 14)}...
                  </motion.div>
                  <div className="text-[10px] text-zinc-600 font-medium uppercase tracking-wider mt-0.5">{formatRelativeTime(tx.timestamp)}</div>
                </div>
                <div className="w-24 text-right">
                  <span className={tx.status === 'confirmed' ? 'badge-success' : 'badge-warning'}>{tx.status}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
