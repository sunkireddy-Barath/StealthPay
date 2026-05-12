import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link2, Plus, Copy, Check, X, Loader2, ExternalLink, Lock } from 'lucide-react'
import { AppLayout } from '../components/layout/AppLayout'
import { useAppStore } from '../store'
import { formatAmount, formatRelativeTime } from '../lib/utils'

interface PaymentLink {
  id: string
  title: string
  amount: number
  currency: string
  status: 'active' | 'claimed' | 'expired'
  link: string
  createdAt: string
  claimedBy?: string
}

const STATUS_BADGE: Record<PaymentLink['status'], string> = {
  active: 'badge-success',
  claimed: 'badge-private',
  expired: 'badge-danger',
}

function CreateLinkModal({ onClose }: { onClose: () => void }) {
  const { createPaymentLink } = useAppStore()
  const [form, setForm] = useState({ title: '', amount: '', currency: 'USDC', expiresAt: '' })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await createPaymentLink({ ...form, amount: Number(form.amount) })
    setLoading(false)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
        className="glass-card w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-white">Generate Payment Link</h2>
            <p className="text-xs text-zinc-500">Shareable link for private payments via Umbra</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X className="w-4 h-4 text-zinc-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Link Title</label>
            <input className="input-field" placeholder="Conference Sponsorship" value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Amount</label>
              <input type="number" className="input-field" placeholder="500" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />
            </div>
            <div>
              <label className="text-xs text-zinc-400 mb-1 block">Currency</label>
              <select className="input-field" value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}>
                <option>USDC</option><option>SOL</option><option>USDT</option>
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-zinc-400 mb-1 block">Expiry (optional)</label>
            <input type="date" className="input-field" value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} />
          </div>
          <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Lock className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <span className="text-violet-300">Payment will be processed privately via Umbra stealth addresses</span>
          </div>
          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
            <motion.button type="submit" whileTap={{ scale: 0.97 }} disabled={loading} className="btn-primary flex-1 justify-center">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Link2 className="w-4 h-4" />}
              {loading ? 'Generating...' : 'Generate Link'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function LinkCard({ link }: { link: PaymentLink }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(link.link).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <motion.div
      layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
      className="glass-card-hover p-5 flex flex-col gap-4"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Link2 className="w-5 h-5 text-violet-400" />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">{link.title || 'Payment Link'}</div>
            <div className="text-xs text-zinc-500">{formatRelativeTime(link.createdAt)}</div>
          </div>
        </div>
        <span className={STATUS_BADGE[link.status]}>{link.status}</span>
      </div>

      <div className="flex items-center justify-between px-3 py-2 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}>
        <span className="text-xl font-bold gradient-text">{formatAmount(link.amount)}</span>
        <span className="text-sm text-zinc-400">{link.currency}</span>
      </div>

      <div className="flex items-center gap-2">
        <div className="flex-1 px-3 py-2 rounded-xl text-xs font-mono text-zinc-500 truncate"
          style={{ background: 'rgba(255,255,255,0.03)' }}>
          {link.link}
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={copy}
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.2)' }}>
          {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-violet-400" />}
        </motion.button>
        <motion.button whileTap={{ scale: 0.9 }}
          onClick={() => window.open(link.link, '_blank', 'noopener,noreferrer')}
          className="p-2 rounded-xl transition-colors"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <ExternalLink className="w-4 h-4 text-zinc-400" />
        </motion.button>
      </div>

      {link.status === 'claimed' && link.claimedBy && (
        <div className="flex items-center gap-2 p-2 rounded-xl text-xs"
          style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Check className="w-3 h-3 text-emerald-400" />
          <span className="text-emerald-400">Claimed by <span className="font-mono">{link.claimedBy}</span></span>
        </div>
      )}
    </motion.div>
  )
}

export default function PaymentsPage() {
  const { paymentLinks, fetchPaymentLinks } = useAppStore()
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    fetchPaymentLinks()
  }, [])

  const active = (paymentLinks || []).filter(p => p.status === 'active').length
  const claimed = (paymentLinks || []).filter(p => p.status === 'claimed').length

  return (
    <AppLayout pageTitle="Payment Links" pageSubtitle="Generate shareable private payment links">
      <div className="space-y-6 w-full">
        {/* Bento Grid Stats & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Links', value: active, color: '#10b981', icon: Link2 },
            { label: 'Claimed', value: claimed, color: '#7c3aed', icon: Check },
            { label: 'Total Generated', value: (paymentLinks || []).length, color: '#6366f1', icon: Copy },
          ].map((s, i) => (
            <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }} className="glass-card p-6 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10 translate-x-8 -translate-y-8 rounded-full blur-2xl group-hover:opacity-20 transition-opacity"
                style={{ background: s.color }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mb-4"
                style={{ background: `${s.color}15`, border: `1px solid ${s.color}30` }}>
                <s.icon className="w-6 h-6" style={{ color: s.color }} />
              </div>
              <div>
                <div className="text-3xl font-black text-white tracking-tight">{s.value}</div>
                <div className="text-sm font-medium text-zinc-500 uppercase tracking-wider mt-1">{s.label}</div>
              </div>
            </motion.div>
          ))}

          {/* Quick Actions Bento Card */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.24 }}
            className="glass-card p-6 flex flex-col justify-between relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, rgba(15,15,25,0.8), rgba(124,58,237,0.05))' }}
          >
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Create Link</h3>
              <p className="text-xs text-zinc-500">Generate private invoices</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowCreate(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(124,58,237,0.2)] bg-violet-600 hover:bg-violet-700 text-white transition-all mt-4 h-full"
            >
              <Plus className="w-5 h-5" />
              Generate Link
            </motion.button>
          </motion.div>
        </div>

        <div className="flex items-center justify-between mt-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Your Payment Links</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <AnimatePresence>
            {(paymentLinks || []).map(link => <LinkCard key={link.id} link={link} />)}
            {(paymentLinks || []).length === 0 && (
              <div className="col-span-full py-12 text-center text-zinc-500 text-sm font-medium">No payment links generated yet.</div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AnimatePresence>
        {showCreate && <CreateLinkModal onClose={() => setShowCreate(false)} />}
      </AnimatePresence>
    </AppLayout>
  )
}
