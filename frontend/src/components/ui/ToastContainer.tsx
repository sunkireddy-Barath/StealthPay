import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react'
import { useAppStore } from '../../store'
import type { Toast } from '../../types'
import { cn } from '../../lib/utils'

const ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const STYLES = {
  success: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
  error: 'border-red-500/30 bg-red-500/10 text-red-400',
  warning: 'border-amber-500/30 bg-amber-500/10 text-amber-400',
  info: 'border-violet-500/30 bg-violet-500/10 text-violet-400',
}

function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useAppStore()
  const Icon = ICONS[toast.type]

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 50, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={cn(
        'flex items-start gap-3 px-4 py-3 rounded-xl border min-w-[280px] max-w-[360px]',
        'backdrop-blur-xl shadow-2xl',
        STYLES[toast.type]
      )}
    >
      <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">{toast.title}</p>
        {toast.message && <p className="text-xs mt-0.5 opacity-70">{toast.message}</p>}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="opacity-50 hover:opacity-100 transition-opacity flex-shrink-0"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </motion.div>
  )
}

export function ToastContainer() {
  const { toasts } = useAppStore()

  return (
    <div className="fixed bottom-28 right-6 z-[200] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence mode="popLayout">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} />
          </div>
        ))}
      </AnimatePresence>
    </div>
  )
}
