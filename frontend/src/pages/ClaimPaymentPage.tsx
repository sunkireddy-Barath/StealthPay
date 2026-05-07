import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Zap, CheckCircle, AlertCircle, Loader2, Wallet, ArrowRight } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useAppStore } from '../store'
import { formatAmount } from '../lib/utils'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')

export default function ClaimPaymentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { connected, publicKey } = useWallet()
  const { authenticateWallet, isAuthenticated } = useAppStore()
  const [linkData, setLinkData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Auto-auth when wallet is connected
  useEffect(() => {
    if (connected && publicKey && !isAuthenticated) {
      authenticateWallet(publicKey.toBase58())
    }
  }, [connected, publicKey, isAuthenticated, authenticateWallet])

  useEffect(() => {
    const fetchLink = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/payment-links/${id}/info`)
        if (res.ok) {
          const data = await res.json()
          setLinkData(data)
        } else {
          setError('Payment link not found or expired')
        }
      } catch (err) {
        setError('Connection error')
      } finally {
        setLoading(false)
      }
    }
    fetchLink()
  }, [id])

  const handleClaim = async () => {
    if (!connected || !publicKey || !isAuthenticated) return
    
    setClaiming(true)
    try {
      const res = await fetch(`${API_BASE}/api/payment-links/${id}/claim`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('stealthpay_token')}`
        },
        body: JSON.stringify({ wallet_address: publicKey.toBase58() })
      })
      
      if (res.ok) {
        setSuccess(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Failed to claim payment')
      }
    } catch (err) {
      setError('Network error during claim')
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080F] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-10"
          style={{ background: 'radial-gradient(circle at center, #7c3aed, transparent 70%)' }} />
        <div className="absolute inset-0 grid-pattern opacity-30" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        <div className="flex items-center gap-2 mb-8 justify-center">
          <Zap className="w-5 h-5 text-violet-500" />
          <span className="text-sm font-bold text-white uppercase tracking-widest">StealthPay</span>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Payment Claimed!</h2>
            <p className="text-sm text-zinc-400 mb-8">
              The confidential payment has been sent to your stealth address via Umbra Protocol.
            </p>
            <button onClick={() => navigate('/dashboard')} className="btn-primary w-full justify-center">
              Go to Dashboard
            </button>
          </div>
        ) : error ? (
          <div className="text-center py-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-white mb-2">Link Unavailable</h2>
            <p className="text-sm text-zinc-500 mb-8">{error}</p>
            <button onClick={() => navigate('/auth')} className="btn-ghost w-full justify-center">
              Back to App
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-xs text-zinc-500 uppercase tracking-widest font-bold mb-1">Incoming Private Payment</p>
              <h1 className="text-2xl font-bold text-white mb-1">{linkData?.title || 'Payment Link'}</h1>
              <div className="text-4xl font-black gradient-text my-4">{formatAmount(linkData?.amount)}</div>
              <p className="text-[10px] text-zinc-500 uppercase tracking-tighter">Encrypted via Umbra Protocol</p>
            </div>

            <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Asset</span>
                <span className="text-white font-bold">{linkData?.currency}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500">Status</span>
                <span className="text-emerald-400 font-bold uppercase tracking-widest text-[10px]">{linkData?.status}</span>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              {!connected ? (
                <div className="space-y-4">
                  <p className="text-xs text-center text-zinc-500 px-4">
                    Connect your Solana wallet to claim this payment privately.
                  </p>
                  <div className="flex justify-center">
                    <WalletMultiButton className="!bg-violet-600 hover:!bg-violet-700 !rounded-xl !h-12 !px-8 !text-sm !font-bold" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                    <Wallet className="w-4 h-4 text-emerald-400" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">Recipient Wallet</div>
                      <div className="text-xs text-white font-mono truncate">{publicKey?.toBase58()}</div>
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleClaim}
                    disabled={claiming}
                    className="btn-primary w-full py-4 justify-center"
                  >
                    {claiming ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    {claiming ? 'Processing...' : 'Claim Confidential Payment'}
                  </motion.button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 justify-center text-[10px] text-zinc-600 mt-4">
              <Lock className="w-3 h-3" />
              <span>Zero-knowledge transaction powered by Umbra Protocol</span>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  )
}
