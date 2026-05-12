import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Users, Plus, Send, Trash2, Lock, CheckCircle,
  Building2, Wallet, DollarSign, X, Loader2, Shield
} from 'lucide-react'
import { useWallet } from '@solana/wallet-adapter-react'
import { AppLayout } from '../components/layout/AppLayout'
import { useAppStore } from '../store'
import { truncateAddress, formatAmount } from '../lib/utils'

interface Employee {
  id: string
  name: string
  email: string
  wallet_address: string
  salary: number
  currency: string
  department: string
  status: string
  lastPaid?: string
}

function AddEmployeeModal({ onClose }: { onClose: () => void }) {
  const { addEmployee, addToast } = useAppStore()
  const [form, setForm] = useState({
    name: '', email: '', wallet_address: '',
    salary: '', currency: 'USDC', department: '', status: 'active' as const,
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name || !form.wallet_address || !form.salary) {
      addToast({ type: 'error', title: 'Missing Fields', message: 'Please fill in all required fields' })
      return
    }
    setLoading(true)
    await addEmployee({ ...form, salary: Number(form.salary) })
    setLoading(false)
    onClose()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="glass-card w-full max-w-md p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-bold text-white">Add Employee</h2>
            <p className="text-xs text-zinc-500 mt-0.5">Salary will be paid via Umbra confidential transfer</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5 transition-colors">
            <X className="w-4 h-4 text-zinc-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Full Name *</label>
              <input
                className="input-field"
                placeholder="Sarah Chen"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Department</label>
              <input
                className="input-field"
                placeholder="Engineering"
                value={form.department}
                onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Email</label>
            <input
              type="email"
              className="input-field"
              placeholder="sarah@company.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            />
          </div>

          <div>
            <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Solana Wallet Address *</label>
            <input
              className="input-field font-mono text-xs"
              placeholder="7xKXtg2CW87d97TXJSDpbD5..."
              value={form.wallet_address}
              onChange={e => setForm(f => ({ ...f, wallet_address: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Monthly Salary *</label>
              <input
                type="number"
                className="input-field"
                placeholder="8500"
                value={form.salary}
                onChange={e => setForm(f => ({ ...f, salary: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-xs text-zinc-400 font-medium mb-1.5 block">Currency</label>
              <select
                className="input-field"
                value={form.currency}
                onChange={e => setForm(f => ({ ...f, currency: e.target.value }))}
              >
                <option value="USDC">USDC</option>
                <option value="SOL">SOL</option>
                <option value="USDT">USDT</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded-xl text-xs"
            style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
            <Shield className="w-3.5 h-3.5 text-violet-400 flex-shrink-0" />
            <span className="text-violet-300">Salary amount will be encrypted via Umbra. Amount is never visible on-chain.</span>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-ghost flex-1 justify-center">
              Cancel
            </button>
            <motion.button
              type="submit"
              whileTap={{ scale: 0.97 }}
              disabled={loading}
              className="btn-primary flex-1 justify-center"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {loading ? 'Adding...' : 'Add Employee'}
            </motion.button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

function RunPayrollModal({ employees, onClose }: { employees: Employee[], onClose: () => void }) {
  const { runPayroll, isProcessingPayroll } = useAppStore()
  const wallet = useWallet()
  const [selected, setSelected] = useState<string[]>(employees.filter(e => e.status === 'active').map(e => e.id))
  const totalAmount = employees.filter(e => selected.includes(e.id)).reduce((acc, e) => acc + e.salary, 0)
  const [step, setStep] = useState<'select' | 'confirm' | 'processing' | 'done'>('select')

  const handleRun = async () => {
    setStep('processing')
    // Pass the live wallet adapter so UmbraService can use it for signing
    await runPayroll(selected, wallet)
    setStep('done')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
      onClick={(e) => e.target === e.currentTarget && step !== 'processing' && onClose()}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="glass-card w-full max-w-md p-6"
      >
        {step === 'done' ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8"
          >
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: 'rgba(16,185,129,0.15)', border: '2px solid rgba(16,185,129,0.3)' }}>
              <CheckCircle className="w-8 h-8 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Payroll Complete!</h3>
            <p className="text-sm text-zinc-400 mb-1">{selected.length} confidential transfers sent</p>
            <p className="text-xs text-zinc-500">Encrypted via Umbra Protocol on Solana</p>
            <button onClick={onClose} className="btn-primary mt-6 mx-auto">Close</button>
          </motion.div>
        ) : step === 'processing' ? (
          <div className="text-center py-10">
            <div className="relative mx-auto w-16 h-16 mb-4">
              <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
              <div className="absolute inset-2 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.15)' }}>
                <Lock className="w-6 h-6 text-violet-400" />
              </div>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Encrypting & Sending</h3>
            <p className="text-sm text-zinc-400">Confidential transfers in progress via Umbra...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-white">Run Payroll</h2>
                <p className="text-xs text-zinc-500 mt-0.5">Select employees for this payroll run</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/5"><X className="w-4 h-4 text-zinc-400" /></button>
            </div>

            <div className="space-y-2 mb-4 max-h-60 overflow-y-auto">
              {employees.filter(e => e.status === 'active').map(emp => (
                <label key={emp.id} className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors hover:bg-white/5">
                  <input
                    type="checkbox"
                    checked={selected.includes(emp.id)}
                    onChange={e => setSelected(s => e.target.checked ? [...s, emp.id] : s.filter(id => id !== emp.id))}
                    className="w-4 h-4 accent-violet-500"
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium text-white">{emp.name}</div>
                    <div className="text-xs text-zinc-500">{emp.department} • {truncateAddress(emp.wallet_address)}</div>
                  </div>
                  <div className="text-sm font-semibold text-violet-300">{formatAmount(emp.salary)}</div>
                </label>
              ))}
            </div>

            <div className="flex items-center justify-between p-3 rounded-xl mb-4"
              style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}>
              <span className="text-sm text-zinc-400">{selected.length} employees</span>
              <span className="text-lg font-bold gradient-text">{formatAmount(totalAmount)}</span>
            </div>

            <div className="flex gap-3">
              <button onClick={onClose} className="btn-ghost flex-1 justify-center">Cancel</button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleRun}
                disabled={selected.length === 0}
                className="btn-primary flex-1 justify-center disabled:opacity-50"
              >
                <Lock className="w-4 h-4" />
                Send Private Payroll
              </motion.button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  )
}

export default function PayrollPage() {
  const { employees, removeEmployee, addToast, fetchEmployees, searchQuery } = useAppStore()
  const [showAdd, setShowAdd] = useState(false)
  const [showRunPayroll, setShowRunPayroll] = useState(false)

  useEffect(() => {
    fetchEmployees()
  }, [])

  const filteredEmployees = (employees || []).filter(emp => 
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.wallet_address.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeCount = employees.filter(e => e.status === 'active').length
  const totalPayroll = employees.filter(e => e.status === 'active').reduce((a, b) => a + b.salary, 0)

  return (
    <AppLayout pageTitle="Private Payroll" pageSubtitle="Confidential salary payments via Umbra Protocol">
      <div className="space-y-6 w-full">
        {/* Bento Grid Stats & Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Employees', value: activeCount, icon: Users, color: '#7c3aed' },
            { label: 'Monthly Payroll', value: formatAmount(totalPayroll), icon: DollarSign, color: '#6366f1' },
            { label: 'Privacy Level', value: '100%', icon: Lock, color: '#10b981' },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              className="glass-card p-6 flex flex-col justify-center relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-32 h-32 opacity-10 translate-x-8 -translate-y-8 rounded-full blur-2xl group-hover:opacity-20 transition-opacity"
                style={{ background: stat.color }} />
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 mb-4"
                style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}30` }}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              <div>
                <div className="text-3xl font-black text-white tracking-tight">{stat.value}</div>
                <div className="text-sm font-medium text-zinc-500 uppercase tracking-wider mt-1">{stat.label}</div>
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
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Quick Actions</h3>
              <p className="text-xs text-zinc-500">Manage your roster</p>
            </div>
            <div className="flex flex-col gap-2 mt-4">
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowRunPayroll(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold shadow-[0_0_15px_rgba(124,58,237,0.2)] bg-violet-600 hover:bg-violet-700 text-white transition-all"
              >
                <Send className="w-4 h-4" />
                Run Payroll
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => setShowAdd(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold border border-white/10 hover:bg-white/5 text-zinc-300 transition-all"
              >
                <Plus className="w-4 h-4" />
                Add Employee
              </motion.button>
            </div>
          </motion.div>
        </div>

        {/* Roster Header */}
        <div className="flex items-center justify-between mt-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider">Employee Roster</h2>
        </div>

        {/* Employee Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card overflow-hidden bg-black/20"
        >
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  {['Employee', 'Department', 'Wallet Address', 'Monthly Salary', 'Last Paid', 'Status', ''].map(h => (
                    <th key={h} className="text-left px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredEmployees.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-14 text-center text-zinc-500 text-sm font-medium">
                      No employees yet. Click "Add Employee" to get started.
                    </td>
                  </tr>
                )}
                <AnimatePresence>
                  {filteredEmployees.map((emp, i) => (
                    <motion.tr
                      key={emp.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.05 }}
                      className="table-row-hover group transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white flex-shrink-0 shadow-lg"
                            style={{ background: `linear-gradient(135deg, hsl(${(i * 67) % 360}, 70%, 45%), hsl(${(i * 67) % 360}, 80%, 25%))` }}>
                            {emp.name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white tracking-tight">{emp.name}</div>
                            <div className="text-xs text-zinc-500">{emp.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-zinc-400">{emp.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-xs font-mono font-medium text-zinc-500 bg-black/20 px-2 py-1 rounded-md border border-white/5">{truncateAddress(emp.wallet_address)}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 px-3 py-1.5 rounded-lg w-fit">
                          <Lock className="w-3 h-3 text-violet-400" />
                          <span className="text-sm font-bold text-violet-300 privacy-mask cursor-pointer tracking-tight">
                            {formatAmount(emp.salary)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-zinc-500 uppercase tracking-wider">
                        {emp.lastPaid ? new Date(emp.lastPaid).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={emp.status === 'active' ? 'badge-success shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'badge-warning'}>
                          {emp.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <button
                          onClick={() => removeEmployee(emp.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20"
                        >
                          <Trash2 className="w-4 h-4 text-red-400" />
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {showAdd && <AddEmployeeModal onClose={() => setShowAdd(false)} />}
        {showRunPayroll && <RunPayrollModal employees={employees} onClose={() => setShowRunPayroll(false)} />}
      </AnimatePresence>
    </AppLayout>
  )
}
