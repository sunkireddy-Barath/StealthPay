import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Lock, Zap, CheckCircle, AlertCircle, Loader2, Wallet, ArrowRight, Shield } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { apiFetch } from '../lib/api'
import { formatAmount } from '../lib/utils'

export default function ClaimPaymentPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { connected, publicKey } = useWallet()

  const [linkData, setLinkData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [claiming, setClaiming] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [txResult, setTxResult] = useState<{ txHash: string; viewingKey: string } | null>(null)
  const [token, setToken] = useState<string | null>(null)

  // Auto-register wallet on Solana (no Firebase required for external claim)
  useEffect(() => {
    if (!connected || !publicKey) return
    const existing = localStorage.getItem('stealthpay_token')
    if (existing) { setToken(existing); return }

    apiFetch('/api/auth/wallet-login', {
      method: 'POST',
      body: JSON.stringify({ address: publicKey.toBase58() }),
    })
      .then(r => r.json())
      .then(d => {
        if (d.access_token) {
          localStorage.setItem('stealthpay_token', d.access_token)
          setToken(d.access_token)
        }
      })
      .catch(console.error)
  }, [connected, publicKey])

  useEffect(() => {
    apiFetch(`/api/payment-links/${id}/info`)
      .then(r => {
        if (r.ok) return r.json()
        throw new Error('Payment link not found or expired')
      })
      .then(setLinkData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const handleClaim = async () => {
    if (!connected || !publicKey) return
    const authToken = token || localStorage.getItem('stealthpay_token')
    if (!authToken) {
      setError('Session not ready. Please wait a moment and try again.')
      return
    }

    setClaiming(true)
    try {
      const res = await apiFetch(`/api/payment-links/${id}/claim`, {
        method: 'POST',
        body: JSON.stringify({ wallet_address: publicKey.toBase58() }),
      })
      const data = await res.json()
      if (res.ok) {
        setTxResult({ txHash: data.tx_hash, viewingKey: data.viewing_key })
        setSuccess(true)
      } else {
        setError(data.error || 'Failed to claim payment')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setClaiming(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="relative w-10 h-10">
            <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
          </div>
          <span className="text-xs text-zinc-500">Loading payment details...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#08080F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] opacity-10"
          style={{ background: 'radial-gradient(circle at center, #7c3aed, transparent 70%)' }} />
        <div className="absolute inset-0 grid-pattern opacity-20" />
      </div>

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-2 mb-8 relative z-10"
      >
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="text-sm font-black text-white tracking-tight uppercase">StealthPay</span>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-8 relative z-10"
      >
        <AnimatePresence mode="wait">
          {success ? (
            <motion.div key="success"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-4"
            >
              <div className="w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/30 flex items-center justify-center mx-auto mb-6"
                style={{ boxShadow: '0 0 40px rgba(16,185,129,0.2)' }}>
                <CheckCircle className="w-10 h-10 text-emerald-400" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">Payment Claimed!</h2>
              <p className="text-sm text-zinc-400 mb-6">
                Confidential transfer sent to your stealth address via Umbra Protocol.
              </p>

              {txResult && (
                <div className="text-left space-y-2 mb-6 p-4 rounded-xl"
                  style={{ background: 'rgba(124,58,237,0.06)', border: '1px solid rgba(124,58,237,0.15)' }}>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">TX Hash</span>
                    <p className="text-xs font-mono text-violet-300 mt-0.5 break-all">{txResult.txHash.slice(0, 40)}...</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Viewing Key (save this)</span>
                    <p className="text-xs font-mono text-emerald-300 mt-0.5 break-all">{txResult.viewingKey}</p>
                  </div>
                </div>
              )}

              <button onClick={() => navigate('/dashboard')} className="btn-primary w-full justify-center">
                Go to Dashboard
              </button>
            </motion.div>
          ) : error ? (
            <motion.div key="error" className="text-center py-4">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-lg font-bold text-white mb-2">Link Unavailable</h2>
              <p className="text-sm text-zinc-500 mb-8">{error}</p>
              <button onClick={() => navigate('/auth')} className="btn-ghost w-full justify-center">
                Back to App
              </button>
            </motion.div>
          ) : (
            <motion.div key="claim" className="space-y-6">
              <div className="text-center">
                <p className="text-[10px] text-zinc-500 uppercase tracking-[0.2em] font-bold mb-2">Incoming Private Payment</p>
                <h1 className="text-2xl font-black text-white mb-2">{linkData?.title || 'Payment Request'}</h1>
                <div className="text-5xl font-black gradient-text my-5">{formatAmount(linkData?.amount ?? 0)}</div>
                <div className="flex items-center justify-center gap-2">
                  <span className="text-sm font-bold text-zinc-400">{linkData?.currency}</span>
                  <div className="w-1 h-1 rounded-full bg-zinc-600" />
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">Encrypted via Umbra</span>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 rounded-xl space-y-2"
                style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)' }}>
                {[
                  { label: 'Asset', value: linkData?.currency },
                  { label: 'Status', value: linkData?.status, green: true },
                  { label: 'Privacy', value: 'Umbra Stealth Address', purple: true },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-zinc-500">{item.label}</span>
                    <span className={item.green ? 'text-emerald-400 font-bold uppercase tracking-widest text-[10px]' :
                      item.purple ? 'text-violet-400 font-medium' : 'text-white font-bold'}>
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>

              {/* Wallet connection */}
              {!connected ? (
                <div className="space-y-4">
                  <p className="text-xs text-center text-zinc-500">
                    Connect your Solana wallet to claim this private payment.
                  </p>
                  <div className="flex justify-center">
                    <WalletMultiButton className="!bg-violet-600 hover:!bg-violet-700 !rounded-xl !h-12 !px-8 !text-sm !font-bold" />
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-3 rounded-xl"
                    style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.15)' }}>
                    <Wallet className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-[10px] text-zinc-500 font-bold uppercase">Your Wallet</div>
                      <div className="text-xs text-white font-mono truncate">{publicKey?.toBase58()}</div>
                    </div>
                  </div>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={handleClaim}
                    disabled={claiming}
                    className="btn-primary w-full py-4 justify-center disabled:opacity-50"
                  >
                    {claiming ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
                    {claiming ? 'Processing Confidential Transfer...' : 'Claim Payment'}
                  </motion.button>
                </div>
              )}

              <div className="flex items-center gap-2 justify-center text-[10px] text-zinc-600">
                <Lock className="w-3 h-3" />
                <span>Zero-knowledge transfer · Umbra Protocol on Solana</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Trust badges */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="flex items-center gap-6 mt-8 opacity-30"
      >
        {[{ icon: Shield, label: 'Privacy Guard' }, { icon: Lock, label: 'AES-256' }].map(b => (
          <div key={b.label} className="flex items-center gap-1.5">
            <b.icon className="w-3 h-3 text-zinc-400" />
            <span className="text-[9px] text-zinc-400 uppercase tracking-[0.2em] font-bold">{b.label}</span>
          </div>
        ))}
      </motion.div>
    </div>
  )
}
