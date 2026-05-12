import { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { AnimatePresence, motion } from 'framer-motion'
import { HelpCircle, X } from 'lucide-react'

export function WalletConnectButton() {
  const { connected } = useWallet()
  const [showHelp, setShowHelp] = useState(false)

  return (
    <div className="flex flex-col items-end gap-1 relative">
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl blur opacity-0 group-hover:opacity-20 transition duration-500" />
        <WalletMultiButton className="!bg-white/5 hover:!bg-white/10 !border !border-white/10 !rounded-xl !h-9 !px-4 !text-xs !font-medium !transition-all !leading-none !relative" />
      </div>

      {!connected && (
        <button
          onClick={() => setShowHelp(v => !v)}
          className="text-[10px] text-zinc-600 hover:text-violet-400 transition-colors flex items-center gap-0.5"
        >
          <HelpCircle className="w-3 h-3" />
          Trouble connecting?
        </button>
      )}

      <AnimatePresence>
        {showHelp && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 z-[300] w-72 glass-card p-4 text-left"
            style={{ background: 'rgba(10,10,18,0.98)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-white">Connection Tips</span>
              <button onClick={() => setShowHelp(false)} className="p-1 rounded hover:bg-white/10">
                <X className="w-3 h-3 text-zinc-400" />
              </button>
            </div>
            <ul className="space-y-2 text-[11px] text-zinc-400">
              {[
                'Install Phantom or Solflare extension',
                'Disable conflicting extensions (MetaMask)',
                'Hard refresh: Ctrl+Shift+R / Cmd+Shift+R',
                'Ensure wallet is unlocked before connecting',
                'Try a different browser if issues persist',
              ].map((tip, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-violet-500 font-bold flex-shrink-0">{i + 1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
