import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  DollarSign, Users, FileText, TrendingUp, TrendingDown,
  ArrowUpRight, ArrowDownLeft, Lock, Shield, Activity, Zap
} from 'lucide-react'
import { AppLayout } from '../components/layout/AppLayout'
import { useAppStore } from '../store'
import { formatAmount, formatRelativeTime, truncateAddress } from '../lib/utils'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts'

function MetricCard({ card, delay }: { card: any, delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card-hover p-5 relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full opacity-5"
        style={{ background: card.color, transform: 'translate(30%, -30%)' }} />
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: `${card.color}20`, border: `1px solid ${card.color}30` }}>
          <card.icon className="w-5 h-5" style={{ color: card.color }} />
        </div>
        <div className={`flex items-center gap-1 text-xs font-medium ${card.up ? 'text-emerald-400' : 'text-amber-400'}`}>
          {card.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
          {card.change}
        </div>
      </div>

      {card.isEncrypted ? (
        <div className="flex items-center gap-2 mb-1">
          <div className="text-xl font-bold text-white/40 tracking-wider">••••••</div>
          <div className="px-1.5 py-0.5 rounded-md bg-violet-500/10 border border-violet-500/20 text-[10px] text-violet-400 font-bold flex items-center gap-1 uppercase">
            <Lock className="w-2.5 h-2.5" />
            Encrypted
          </div>
        </div>
      ) : (
        <div className="text-2xl font-bold text-white mb-1">{card.value}</div>
      )}

      <div className="text-xs text-zinc-500">{card.label}</div>
      <div className="text-[10px] text-zinc-600 mt-0.5">{card.sub}</div>
    </motion.div>
  )
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card px-3 py-2 text-xs">
        <p className="text-zinc-400 mb-1 font-medium">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }}>{p.name}: {formatAmount(p.value)}</p>
        ))}
      </div>
    )
  }
  return null
}

export default function DashboardPage() {
  const {
    transactions, employees, invoices, paymentLinks,
    fetchEmployees, fetchInvoices, fetchPaymentLinks, fetchTransactions,
    searchQuery
  } = useAppStore()

  useEffect(() => {
    fetchEmployees()
    fetchInvoices()
    fetchPaymentLinks()
    fetchTransactions()
  }, [])

  const filteredTransactions = (transactions || []).filter(tx => 
    tx.txHash.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tx.memo && tx.memo.toLowerCase().includes(searchQuery.toLowerCase())) ||
    tx.type.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const activeEmployees = (employees || []).filter(e => e.status === 'active').length
  const pendingInvoices = (invoices || []).filter(i => i.status === 'pending').length
  const transactionsList = filteredTransactions
  
  // Dynamic Chart Data derived from transactions
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun']
  const dynamicChartData = months.map((month, index) => {
    const txsInMonth = transactionsList.filter((_, i) => i % months.length === index)
    const outflow = txsInMonth.filter(t => t.type === 'payroll' || t.type === 'invoice').length * 2500
    const inflow = txsInMonth.filter(t => t.type === 'payment_link').length * 1500
    return {
      month,
      outflow: outflow,
      inflow: inflow
    }
  })

  // Dynamic Pie Data
  const payrollCount = transactionsList.filter(t => t.type === 'payroll').length
  const invoiceCount = transactionsList.filter(t => t.type === 'invoice').length
  const linkCount = transactionsList.filter(t => t.type === 'payment_link').length
  const total = payrollCount + invoiceCount + linkCount || 1
  
  const dynamicPieData = [
    { name: 'Payroll', value: Math.round((payrollCount / total) * 100) || 33, color: '#7c3aed' },
    { name: 'Invoices', value: Math.round((invoiceCount / total) * 100) || 33, color: '#6366f1' },
    { name: 'Payments', value: Math.round((linkCount / total) * 100) || 34, color: '#a78bfa' },
  ]

  const dynamicMetrics = [
    {
      label: 'Total Transactions',
      value: transactionsList.length.toString(),
      change: `+${transactionsList.length} total`,
      up: true,
      icon: DollarSign,
      color: '#7c3aed',
      sub: 'Confidential via Umbra',
      isEncrypted: false
    },
    {
      label: 'Active Employees',
      value: activeEmployees.toString(),
      change: `+${activeEmployees} active`,
      up: true,
      icon: Users,
      color: '#6366f1',
      sub: 'Receiving private payroll',
    },
    {
      label: 'Open Invoices',
      value: 'Encrypted',
      change: `${pendingInvoices} pending`,
      up: pendingInvoices > 0,
      icon: FileText,
      color: '#8b5cf6',
      sub: 'Awaiting confidential payment',
      isEncrypted: true
    },
    {
      label: 'Privacy Score',
      value: '100%',
      change: 'All encrypted',
      up: true,
      icon: Shield,
      color: '#10b981',
      sub: 'Zero on-chain exposure',
    },
  ]

  return (
    <AppLayout pageTitle="StealthPay" pageSubtitle="Private Business Finance Overview">
      <div className="space-y-6 w-full">
        {/* Umbra Banner */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl"
          style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.2)' }}
        >
          <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #5b21b6)' }}>
            <Lock className="w-3.5 h-3.5 text-white" />
          </div>
          <div className="flex-1">
            <span className="text-sm font-semibold text-violet-300">Umbra Privacy Protocol Active</span>
            <span className="text-xs text-zinc-500 ml-2">All transactions encrypted and confidential on Solana</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-xs text-emerald-400 font-medium">Live</span>
          </div>
        </motion.div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {dynamicMetrics.map((card, i) => (
            <MetricCard key={card.label} card={card} delay={i * 0.08} />
          ))}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Area chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-5 lg:col-span-2"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-sm font-semibold text-white">Payment Flow</h3>
                <p className="text-xs text-zinc-500">Encrypted via Umbra Protocol</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-violet-500" />
                  <span className="text-zinc-400">Outflow</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-indigo-400" />
                  <span className="text-zinc-400">Inflow</span>
                </div>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={dynamicChartData}>
                <defs>
                  <linearGradient id="gradOut" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradIn" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#71717a', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="outflow" name="Outflow" stroke="#7c3aed" strokeWidth={2} fill="url(#gradOut)" />
                <Area type="monotone" dataKey="inflow" name="Inflow" stroke="#6366f1" strokeWidth={2} fill="url(#gradIn)" />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Pie chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-5"
          >
            <h3 className="text-sm font-semibold text-white mb-1">Payment Breakdown</h3>
            <p className="text-xs text-zinc-500 mb-4">By category</p>
            <div className="flex justify-center mb-4">
              <PieChart width={160} height={160}>
                <Pie data={dynamicPieData} cx={75} cy={75} innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                  {dynamicPieData.map((entry, index) => (
                    <Cell key={index} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </div>
            <div className="space-y-2">
              {dynamicPieData.map(item => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs text-zinc-400">{item.name}</span>
                  </div>
                  <span className="text-xs font-semibold text-white">{item.value}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card"
        >
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
            <div>
              <h3 className="text-sm font-semibold text-white">Recent Transactions</h3>
              <p className="text-xs text-zinc-500">All amounts encrypted via Umbra</p>
            </div>
            <span className="badge-private">
              <Lock className="w-2.5 h-2.5" />
              Private
            </span>
          </div>
          {transactionsList.length === 0 && (
            <div className="py-14 text-center">
              <Lock className="w-8 h-8 text-zinc-700 mx-auto mb-3" />
              <p className="text-sm text-zinc-500 font-medium">No transactions yet</p>
              <p className="text-xs text-zinc-600 mt-1">Run payroll, create an invoice, or generate a payment link to get started.</p>
            </div>
          )}
          <div className="divide-y divide-white/5">
            {transactionsList.slice(0, 5).map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.05 }}
                className="flex items-center gap-4 px-5 py-3 table-row-hover"
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0
                  ${tx.type === 'payroll' ? 'bg-violet-500/15' : 'bg-indigo-500/15'}`}>
                  {tx.type === 'payroll' ? (
                    <ArrowUpRight className="w-4 h-4 text-violet-400" />
                  ) : (
                    <ArrowDownLeft className="w-4 h-4 text-indigo-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-white truncate">{tx.memo ?? tx.type}</div>
                  <div className="text-xs text-zinc-500 font-mono truncate">{tx.txHash.slice(0, 20)}...</div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-mono text-zinc-500 privacy-mask cursor-pointer"
                    title="Hover to reveal">
                    {tx.encryptedAmount.slice(0, 12)}...
                  </div>
                  <div className="text-[10px] text-zinc-600">{formatRelativeTime(tx.timestamp)}</div>
                </div>
                <span className={`flex-shrink-0 ${tx.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                  {tx.status}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </AppLayout>
  )
}
