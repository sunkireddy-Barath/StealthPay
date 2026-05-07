import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Zap, Lock, Shield, ArrowRight, Loader2, Info, Mail } from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { useAppStore } from '../store'
import { auth, googleProvider } from '../lib/firebase'
import { signInWithPopup } from 'firebase/auth'

export default function AuthPage() {
  const navigate = useNavigate()
  const { connected, publicKey } = useWallet()
  const { 
    authenticateWallet, addToast, 
    isWalletConnected, isFirebaseAuthenticated, setFirebaseUser,
    isAuthenticated 
  } = useAppStore()
  const [loading, setLoading] = useState(false)

  // Step 1: Wallet Authentication
  useEffect(() => {
    if (connected && publicKey && !isWalletConnected) {
      authenticateWallet(publicKey.toBase58())
    }
  }, [connected, publicKey, authenticateWallet, isWalletConnected])

  // Navigate when fully authenticated
  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true)
      setTimeout(() => {
        navigate('/dashboard')
        setLoading(false)
      }, 500)
    }
  }, [isAuthenticated, navigate])

  const handleGoogleSignIn = async () => {
    if (!isWalletConnected) {
      addToast({ type: 'warning', title: 'Wallet Required', message: 'Please connect your wallet first.' })
      return
    }
    if (loading) return
    
    setLoading(true)
    try {
      if (!auth || !googleProvider) {
        throw new Error('Google sign-in is not configured for this deployment.')
      }
      const result = await signInWithPopup(auth, googleProvider)
      setFirebaseUser(result.user)
      addToast({ type: 'success', title: 'Authentication Successful', message: `Welcome back, ${result.user.displayName}` })
    } catch (error: any) {
      console.error('Sign-in error:', error)
      if (error.code !== 'auth/popup-closed-by-user') {
        addToast({ 
          type: 'error', 
          title: 'Google Sign-In Failed', 
          message: error.code === 'auth/network-request-failed' 
            ? 'Network error. Please check your connection or try a different browser.' 
            : error.message 
        })
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#08080F] flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decorations */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[500px]"
          style={{ background: 'radial-gradient(ellipse at center, rgba(124,58,237,0.12) 0%, transparent 70%)' }} />
        <div className="absolute inset-0 grid-pattern opacity-30" />
      </div>

      {/* Logo Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-3 mb-10 relative z-20"
      >
        <div className="w-12 h-12 rounded-xl flex items-center justify-center glow-violet"
          style={{ background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)' }}>
          <Zap className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="text-xl font-bold text-white tracking-tight">StealthPay</div>
          <div className="text-[10px] text-violet-400 font-bold uppercase tracking-widest">Private Finance OS</div>
        </div>
      </motion.div>

      {/* Auth Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="glass-card w-full max-w-md p-8 text-center relative z-20 overflow-hidden"
      >
        {/* Animated Progress Bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-white/5">
          <motion.div 
            className="h-full bg-violet-500"
            animate={{ width: isFirebaseAuthenticated ? '100%' : isWalletConnected ? '50%' : '0%' }}
          />
        </div>

        <div className="mb-8">
          <h2 className="text-xl font-bold text-white mb-2">Two-Step Verification</h2>
          <p className="text-zinc-500 text-xs">Complete both steps to access your private ledger.</p>
        </div>

        <div className="space-y-4">
          {/* STEP 1: WALLET */}
          <div className={`p-4 rounded-xl border transition-all duration-300 ${isWalletConnected ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isWalletConnected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-zinc-500'}`}>
                  {isWalletConnected ? <Shield className="w-4 h-4" /> : <span className="text-xs font-bold">1</span>}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Wallet Identity</div>
                  <div className="text-[10px] text-zinc-500">{isWalletConnected ? 'Identity Verified' : 'Connect Solana Wallet'}</div>
                </div>
              </div>
              {isWalletConnected && <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Active</div>}
            </div>
            {!isWalletConnected && (
              <div className="relative group">
                <WalletMultiButton className="!w-full !bg-white/5 hover:!bg-white/10 !border !border-white/10 !rounded-lg !h-11 !px-4 !text-xs !font-bold !transition-all" />
              </div>
            )}
          </div>

          {/* STEP 2: GOOGLE */}
          <div className={`p-4 rounded-xl border transition-all duration-300 ${!isWalletConnected ? 'opacity-50 grayscale pointer-events-none' : isFirebaseAuthenticated ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isFirebaseAuthenticated ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/10 text-zinc-500'}`}>
                  {isFirebaseAuthenticated ? <Lock className="w-4 h-4" /> : <span className="text-xs font-bold">2</span>}
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold text-white">Google Auth</div>
                  <div className="text-[10px] text-zinc-500">{isFirebaseAuthenticated ? 'User Authenticated' : 'Secure OAuth Login'}</div>
                </div>
              </div>
              {isFirebaseAuthenticated && <div className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest">Verified</div>}
            </div>
            {!isFirebaseAuthenticated && (
              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 h-11 bg-white text-black hover:bg-zinc-200 rounded-lg text-xs font-bold transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <Mail className="w-4 h-4" />
                    Sign in with Google
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 flex items-start gap-3 p-3 rounded-lg bg-violet-500/5 border border-violet-500/10 text-left">
          <Info className="w-4 h-4 text-violet-400 mt-0.5 flex-shrink-0" />
          <p className="text-[10px] text-zinc-500 leading-relaxed">
            Multi-factor authentication ensures that your private keys are only accessible after both cryptographic and identity verification.
          </p>
        </div>
      </motion.div>

      {/* Footer */}
      <div className="mt-10 flex items-center gap-6 opacity-30">
        <div className="flex items-center gap-2">
          <Shield className="w-3 h-3 text-zinc-400" />
          <span className="text-[9px] text-zinc-400 uppercase tracking-[0.2em] font-bold">Privacy Guard</span>
        </div>
        <div className="w-1 h-1 rounded-full bg-zinc-700" />
        <div className="flex items-center gap-2">
          <Lock className="w-3 h-3 text-zinc-400" />
          <span className="text-[9px] text-zinc-400 uppercase tracking-[0.2em] font-bold">AES-256 Enabled</span>
        </div>
      </div>
    </div>
  )
}

