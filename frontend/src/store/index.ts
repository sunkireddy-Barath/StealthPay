import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UmbraService } from '../lib/umbra'
import { apiFetch } from '../lib/api'

interface User {
  id: string
  email: string
  walletAddress: string
  companyName: string
  umbra_spending_key?: string
  umbra_viewing_key?: string
  createdAt: string
}

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

interface Transaction {
  id: string
  txHash: string
  sender: string
  receiver: string
  amount?: number
  encryptedAmount: string
  currency: string
  type: 'payroll' | 'invoice' | 'payment_link'
  status: 'confirmed' | 'pending' | 'failed'
  timestamp: string
  memo?: string
  viewingKey?: string
}

interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  client_email: string
  amount: number
  currency: string
  description: string
  status: 'pending' | 'paid' | 'overdue' | 'draft'
  due_date: string
  payment_link: string
}

interface PaymentLink {
  id: string
  title: string
  amount: number
  currency: string
  status: 'active' | 'claimed' | 'expired'
  link: string
  createdAt: string
  claimedBy?: string
  expiresAt?: string
}

interface Balance {
  token: string
  symbol: string
  amount: number
  price: number
  usdValue: number
  percentChange24h: number
  isLive?: boolean
}

interface AppState {
  user: User | null
  isWalletConnected: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  logout: () => void

  sidebarCollapsed: boolean
  toggleSidebar: () => void

  balancesMasked: boolean
  toggleBalanceMask: () => void

  toasts: { id: string; type: 'success' | 'error' | 'info' | 'warning'; title: string; message?: string; duration?: number }[]
  addToast: (toast: Omit<AppState['toasts'][0], 'id'>) => void
  removeToast: (id: string) => void

  employees: Employee[]
  fetchEmployees: () => Promise<void>
  addEmployee: (emp: Partial<Employee>) => Promise<void>
  removeEmployee: (id: string) => Promise<void>

  isProcessingPayroll: boolean
  runPayroll: (employeeIds: string[], wallet?: any) => Promise<void>

  invoices: Invoice[]
  fetchInvoices: () => Promise<void>
  createInvoice: (inv: Partial<Invoice>) => Promise<void>
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>

  paymentLinks: PaymentLink[]
  fetchPaymentLinks: () => Promise<void>
  createPaymentLink: (link: Partial<PaymentLink>) => Promise<void>

  transactions: Transaction[]
  fetchTransactions: () => Promise<void>
  decryptTransaction: (txHash: string, viewingKey: string) => Promise<Response>

  balances: Balance[]
  fetchBalances: () => Promise<void>

  authenticateWallet: (address: string) => Promise<void>

  searchQuery: string
  setSearchQuery: (query: string) => void

  notifications: { id: string; title: string; message: string; time: string; read: boolean }[]
  addNotification: (notif: { title: string; message: string }) => void
  markNotificationsRead: () => void
}

const rHex = (len: number) =>
  Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('')

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isWalletConnected: false,
      isAuthenticated: false,

      setUser: (user) =>
        set({
          user,
          isWalletConnected: !!user,
          isAuthenticated: !!user,
        }),

      logout: () => {
        set({
          user: null,
          isWalletConnected: false,
          isAuthenticated: false,
          employees: [],
          invoices: [],
          paymentLinks: [],
          transactions: [],
          balances: [],
        })
        localStorage.removeItem('stealthpay_token')
      },

      sidebarCollapsed: false,
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      balancesMasked: true,
      toggleBalanceMask: () => set((s) => ({ balancesMasked: !s.balancesMasked })),

      toasts: [],
      addToast: (toast) => {
        const id = rHex(8)
        set((s) => ({ toasts: [...s.toasts, { ...toast, id }] }))
        setTimeout(() => get().removeToast(id), toast.duration ?? 5000)
      },
      removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

      // ── Data ──────────────────────────────────────────────────────────────

      employees: [],
      invoices: [],
      paymentLinks: [],
      transactions: [],
      balances: [],

      // ── Wallet Balances ───────────────────────────────────────────────────

      fetchBalances: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        try {
          const res = await apiFetch('/api/wallet/balances')
          if (res.ok) {
            const data = await res.json()
            set({ balances: data })
          } else {
            console.warn('[fetchBalances] HTTP', res.status)
          }
        } catch (e) {
          console.error('[fetchBalances]', e)
        }
      },

      // ── Employees ─────────────────────────────────────────────────────────

      fetchEmployees: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        try {
          const res = await apiFetch('/api/payroll/employees')
          if (res.ok) {
            set({ employees: await res.json() })
          }
        } catch (e) {
          console.error('[fetchEmployees]', e)
        }
      },

      addEmployee: async (emp) => {
        try {
          const res = await apiFetch('/api/payroll/employees', {
            method: 'POST',
            body: JSON.stringify({
              name: emp.name,
              email: emp.email,
              wallet_address: emp.wallet_address,
              salary: emp.salary,
              department: emp.department,
            }),
          })
          if (res.ok) {
            get().addToast({ type: 'success', title: 'Employee Added', message: `${emp.name} enrolled in private payroll.` })
            get().fetchEmployees()
          } else {
            const d = await res.json().catch(() => ({}))
            get().addToast({ type: 'error', title: 'Failed to Add Employee', message: d.error || 'Check all required fields.' })
          }
        } catch (e: any) {
          get().addToast({ type: 'error', title: 'Network Error', message: e.message })
        }
      },

      removeEmployee: async (id) => {
        try {
          const res = await apiFetch(`/api/payroll/employees/${id}`, { method: 'DELETE' })
          if (res.ok) {
            get().fetchEmployees()
            get().addToast({ type: 'info', title: 'Employee Removed' })
          } else {
            get().addToast({ type: 'error', title: 'Failed to Remove Employee' })
          }
        } catch (e: any) {
          get().addToast({ type: 'error', title: 'Network Error', message: e.message })
        }
      },

      // ── Payroll ───────────────────────────────────────────────────────────

      isProcessingPayroll: false,

      runPayroll: async (employeeIds, wallet) => {
        set({ isProcessingPayroll: true })
        try {
          for (const eid of employeeIds) {
            const emp = get().employees.find((e) => e.id === eid)
            if (!emp) continue

            const umbraData = await UmbraService.confidentialTransfer(
              wallet ?? null,
              emp.wallet_address,
              emp.salary,
              'USDC'
            )

            const res = await apiFetch('/api/payroll/run', {
              method: 'POST',
              body: JSON.stringify({
                employee_ids: [eid],
                umbra_metadata: umbraData,
              }),
            })
            if (!res.ok) {
              const d = await res.json().catch(() => ({}))
              throw new Error(d.error || 'Backend sync failed')
            }
          }

          get().addToast({
            type: 'success',
            title: 'Payroll Complete',
            message: `${employeeIds.length} confidential transfer${employeeIds.length > 1 ? 's' : ''} sent via Umbra.`,
          })
          get().addNotification({ title: 'Payroll Processed', message: `${employeeIds.length} private salary payment(s) sent.` })

          await get().fetchEmployees()
          await get().fetchTransactions()
          await get().fetchBalances()
        } catch (err: any) {
          get().addToast({ type: 'error', title: 'Payroll Failed', message: err.message })
        } finally {
          set({ isProcessingPayroll: false })
        }
      },

      // ── Invoices ──────────────────────────────────────────────────────────

      fetchInvoices: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        try {
          const res = await apiFetch('/api/invoices')
          if (res.ok) set({ invoices: await res.json() })
        } catch (e) {
          console.error('[fetchInvoices]', e)
        }
      },

      createInvoice: async (inv) => {
        try {
          const res = await apiFetch('/api/invoices', {
            method: 'POST',
            body: JSON.stringify({
              client_name: inv.client_name,
              client_email: inv.client_email,
              amount: inv.amount,
              currency: inv.currency,
              description: inv.description,
              due_date: inv.due_date,
            }),
          })
          if (res.ok) {
            const d = await res.json()
            get().addToast({ type: 'success', title: 'Invoice Created', message: d.invoice_number })
            get().addNotification({ title: 'Invoice Created', message: `${inv.client_name} — ${inv.currency} ${inv.amount}` })
            get().fetchInvoices()
          } else {
            const d = await res.json().catch(() => ({}))
            get().addToast({ type: 'error', title: 'Failed to Create Invoice', message: d.error })
          }
        } catch (e: any) {
          get().addToast({ type: 'error', title: 'Network Error', message: e.message })
        }
      },

      updateInvoiceStatus: async (id, status) => {
        try {
          const res = await apiFetch(`/api/invoices/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
          })
          if (res.ok) {
            get().fetchInvoices()
            get().fetchTransactions()
            get().addToast({ type: 'success', title: 'Invoice Updated', message: `Status set to ${status}` })
          } else {
            get().addToast({ type: 'error', title: 'Update Failed' })
          }
        } catch (e: any) {
          get().addToast({ type: 'error', title: 'Network Error', message: e.message })
        }
      },

      // ── Payment Links ─────────────────────────────────────────────────────

      fetchPaymentLinks: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        try {
          const res = await apiFetch('/api/payment-links/')
          if (res.ok) {
            const data = await res.json()
            set({
              paymentLinks: data.map((l: any) => ({
                id: l.id,
                title: l.title,
                amount: l.amount,
                currency: l.currency,
                status: l.status,
                link: l.link,
                createdAt: l.created_at,
                claimedBy: l.claimed_by,
                expiresAt: l.expires_at,
              })),
            })
          }
        } catch (e) {
          console.error('[fetchPaymentLinks]', e)
        }
      },

      createPaymentLink: async (link) => {
        try {
          const res = await apiFetch('/api/payment-links/', {
            method: 'POST',
            body: JSON.stringify({
              title: link.title,
              amount: link.amount,
              currency: link.currency,
              expires_at: link.expiresAt,
            }),
          })
          if (res.ok) {
            get().fetchPaymentLinks()
            get().addToast({ type: 'success', title: 'Payment Link Created', message: 'Share the link for private payments.' })
            get().addNotification({ title: 'Payment Link Created', message: `${link.currency} ${link.amount} — ${link.title}` })
          } else {
            const d = await res.json().catch(() => ({}))
            get().addToast({ type: 'error', title: 'Failed to Create Link', message: d.error })
          }
        } catch (e: any) {
          get().addToast({ type: 'error', title: 'Network Error', message: e.message })
        }
      },

      // ── Transactions ──────────────────────────────────────────────────────

      fetchTransactions: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        try {
          const res = await apiFetch('/api/transactions')
          if (res.ok) {
            const data = await res.json()
            set({
              transactions: data.map((tx: any) => ({
                id: tx.id,
                txHash: tx.tx_hash,
                sender: tx.sender,
                receiver: tx.receiver,
                encryptedAmount: tx.encrypted_amount || '',
                currency: 'USDC',
                type: tx.type,
                status: tx.status,
                timestamp: tx.created_at,
                memo: tx.memo,
                viewingKey: tx.viewing_key,
              })),
            })
          }
        } catch (e) {
          console.error('[fetchTransactions]', e)
        }
      },

      decryptTransaction: async (txHash, viewingKey) => {
        return apiFetch('/api/compliance/decrypt', {
          method: 'POST',
          body: JSON.stringify({ tx_hash: txHash, viewing_key: viewingKey }),
        })
      },

      // ── Auth ──────────────────────────────────────────────────────────────

      authenticateWallet: async (address: string) => {
        // Authenticate immediately from wallet — Web3 identity is the wallet
        set({
          user: {
            id: address,
            email: '',
            walletAddress: address,
            companyName: 'Merchant',
            createdAt: new Date().toISOString(),
          },
          isWalletConnected: true,
          isAuthenticated: true,
        })
        // Sync with backend in background to get JWT + full user profile
        try {
          const res = await apiFetch('/api/auth/wallet-login', {
            method: 'POST',
            body: JSON.stringify({ address }),
          })
          if (res.ok) {
            const data = await res.json()
            localStorage.setItem('stealthpay_token', data.access_token)
            set({ user: data.user, isWalletConnected: true, isAuthenticated: true })
          }
        } catch (e) {
          console.error('[authenticateWallet]', e)
        }
      },

      // ── Search ────────────────────────────────────────────────────────────

      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),

      // ── Notifications ─────────────────────────────────────────────────────

      notifications: [
        { id: '1', title: 'Umbra Online', message: 'Umbra Protocol connected on Solana Devnet.', time: '2m ago', read: false },
        { id: '2', title: 'Keys Generated', message: 'Umbra spending and viewing keys initialized.', time: '1h ago', read: true },
      ],

      addNotification: (notif) =>
        set((s) => ({
          notifications: [
            { ...notif, id: rHex(8), time: 'Just now', read: false },
            ...s.notifications,
          ],
        })),

      markNotificationsRead: () =>
        set((s) => ({
          notifications: s.notifications.map((n) => ({ ...n, read: true })),
        })),
    }),
    { name: 'stealthpay-storage' }
  )
)
