import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { UmbraService } from '../lib/umbra'
import { auth as firebaseAuth } from '../lib/firebase'

const API_BASE = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '')
const apiUrl = (path: string) => `${API_BASE}${path}`

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
}

interface AppState {
  isWalletConnected: boolean
  isFirebaseAuthenticated: boolean
  firebaseUser: any | null
  setFirebaseUser: (user: any | null) => void
  
  user: User | null
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
  runPayroll: (employeeIds: string[]) => Promise<void>
  
  invoices: Invoice[]
  fetchInvoices: () => Promise<void>
  createInvoice: (inv: Partial<Invoice>) => Promise<void>
  updateInvoiceStatus: (id: string, status: Invoice['status']) => Promise<void>
  
  paymentLinks: PaymentLink[]
  fetchPaymentLinks: () => Promise<void>
  createPaymentLink: (link: Partial<PaymentLink>) => Promise<void>
  
  transactions: Transaction[]
  fetchTransactions: () => Promise<void>
  decryptTransaction: (txHash: string, viewingKey: string) => Promise<any>
  
  balances: Balance[]
  fetchBalances: () => Promise<void>
  
  authenticateWallet: (address: string) => Promise<void>
  
  searchQuery: string
  setSearchQuery: (query: string) => void
  
  notifications: { id: string; title: string; message: string; time: string; read: boolean }[]
  addNotification: (notif: { title: string; message: string }) => void
  markNotificationsRead: () => void
}

const randomHex = (len: number) => Array.from({ length: len }, () => Math.floor(Math.random() * 16).toString(16)).join('')

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isWalletConnected: false,
      isFirebaseAuthenticated: false,
      firebaseUser: null,
      isAuthenticated: false,

      setFirebaseUser: (fuser) => set(s => ({ 
        firebaseUser: fuser, 
        isFirebaseAuthenticated: !!fuser,
        isAuthenticated: s.isWalletConnected && !!fuser 
      })),

      setUser: (user) => set(s => ({ 
        user, 
        isWalletConnected: !!user,
        isAuthenticated: !!user && s.isFirebaseAuthenticated 
      })),

      logout: () => {
        set({
          user: null,
          isWalletConnected: false,
          isFirebaseAuthenticated: false,
          firebaseUser: null,
          isAuthenticated: false
        })
        localStorage.removeItem('stealthpay_token')
        firebaseAuth?.signOut().catch(console.error)
      },

      sidebarCollapsed: false,
      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),

      balancesMasked: true,
      toggleBalanceMask: () => set(s => ({ balancesMasked: !s.balancesMasked })),

      toasts: [],
      addToast: (toast) => {
        const id = randomHex(8)
        set(s => ({ toasts: [...s.toasts, { ...toast, id }] }))
        setTimeout(() => get().removeToast(id), toast.duration ?? 5000)
      },
      removeToast: (id) => set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),

      employees: [],
      invoices: [],
      paymentLinks: [],
      transactions: [],
      balances: [],

      fetchBalances: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        try {
          const res = await fetch(apiUrl('/api/wallet/balances'), {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            set({ balances: data })
          }
        } catch (e) { console.error(e) }
      },

      fetchEmployees: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        try {
          const res = await fetch(apiUrl('/api/payroll/employees'), {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            set({ employees: data })
          }
        } catch (e) { console.error(e) }
      },

      fetchTransactions: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        try {
          const res = await fetch(apiUrl('/api/transactions'), {
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (res.ok) {
            const data = await res.json()
            const mapped = data.map((tx: any) => ({
              id: tx.id,
              txHash: tx.tx_hash,
              sender: tx.sender,
              receiver: tx.receiver,
              encryptedAmount: tx.encrypted_amount || 'ENCRYPTED_DATA_MOCK',
              currency: 'USDC',
              type: tx.type,
              status: tx.status,
              timestamp: tx.created_at,
              memo: tx.memo,
              viewingKey: tx.viewing_key
            }))
            set({ transactions: mapped })
          }
        } catch (e) { console.error(e) }
      },

      decryptTransaction: async (txHash, viewingKey) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch(apiUrl('/api/compliance/decrypt'), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ tx_hash: txHash, viewing_key: viewingKey }),
        })
        return res
      },

      addEmployee: async (emp) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch(apiUrl('/api/payroll/employees'), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: emp.name,
            email: emp.email,
            wallet_address: emp.wallet_address,
            salary: emp.salary,
            department: emp.department
          }),
        })
        if (res.ok) {
          get().fetchEmployees()
          get().addToast({ type: 'success', title: 'Employee Added' })
        }
      },

      removeEmployee: async (id) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch(apiUrl(`/api/payroll/employees/${id}`), {
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          get().fetchEmployees()
          get().addToast({ type: 'info', title: 'Employee Removed' })
        }
      },

      isProcessingPayroll: false,
      runPayroll: async (employeeIds) => {
        set({ isProcessingPayroll: true })
        const token = localStorage.getItem('stealthpay_token')
        
        try {
          for (const eid of employeeIds) {
            const emp = get().employees.find(e => e.id === eid)
            if (!emp) continue

            const umbraData = await UmbraService.confidentialTransfer(null, emp.wallet_address, emp.salary, 'USDC')
            
            const res = await fetch(apiUrl('/api/payroll/run'), {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify({ 
                employee_ids: [eid],
                umbra_metadata: umbraData
              }),
            })
            
            if (!res.ok) throw new Error('Backend sync failed')
          }
          
          get().addToast({ 
            type: 'success', 
            title: 'Payroll Complete', 
            message: `Successfully processed ${employeeIds.length} private transfers.` 
          })
          
          await get().fetchEmployees()
          await get().fetchTransactions()
          await get().fetchBalances()
          
        } catch (err: any) {
          get().addToast({ type: 'error', title: 'Payroll Failed', message: err.message })
        } finally {
          set({ isProcessingPayroll: false })
        }
      },

      fetchInvoices: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        const res = await fetch(apiUrl('/api/invoices'), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          set({ invoices: data })
        }
      },

      createInvoice: async (inv) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch(apiUrl('/api/invoices'), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            client_name: inv.client_name,
            client_email: inv.client_email,
            amount: inv.amount,
            currency: inv.currency,
            description: inv.description,
            due_date: inv.due_date
          }),
        })
        if (res.ok) {
          get().fetchInvoices()
          get().addToast({ type: 'success', title: 'Invoice Created' })
        }
      },

      updateInvoiceStatus: async (id, status) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch(apiUrl(`/api/invoices/${id}`), {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ status }),
        })
        if (res.ok) {
          get().fetchInvoices()
          get().addToast({ type: 'info', title: 'Invoice Updated' })
        }
      },

      fetchPaymentLinks: async () => {
        const token = localStorage.getItem('stealthpay_token')
        if (!token) return
        const res = await fetch(apiUrl('/api/payment-links/'), {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (res.ok) {
          const data = await res.json()
          const mapped = data.map((l: any) => ({
            id: l.id,
            title: l.title,
            amount: l.amount,
            currency: l.currency,
            status: l.status,
            link: l.link,
            createdAt: l.created_at,
            claimedBy: l.claimed_by
          }))
          set({ paymentLinks: mapped })
        }
      },

      createPaymentLink: async (link) => {
        const token = localStorage.getItem('stealthpay_token')
        const res = await fetch(apiUrl('/api/payment-links/'), {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            title: link.title,
            amount: link.amount,
            currency: link.currency,
            expires_at: link.expiresAt
          }),
        })
        if (res.ok) {
          get().fetchPaymentLinks()
          get().addToast({ type: 'success', title: 'Payment Link Created' })
        }
      },

      authenticateWallet: async (address: string) => {
        try {
          const res = await fetch(apiUrl('/api/auth/wallet-login'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ address }),
          })
          if (res.ok) {
            const data = await res.json()
            localStorage.setItem('stealthpay_token', data.access_token)
            set(s => ({ 
              user: data.user, 
              isWalletConnected: true,
              isAuthenticated: true && s.isFirebaseAuthenticated
            }))
          }
        } catch (e) {
          console.error('Auto-auth failed:', e)
        }
      },
      
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      notifications: [
        { id: '1', title: 'System Online', message: 'Umbra Devnet connection established.', time: '2m ago', read: false },
        { id: '2', title: 'Security Protocol', message: 'Encryption keys generated successfully.', time: '1h ago', read: true }
      ],
      addNotification: (notif) => set(s => ({ 
        notifications: [{ ...notif, id: randomHex(8), time: 'Just now', read: false }, ...s.notifications] 
      })),
      markNotificationsRead: () => set(s => ({
        notifications: s.notifications.map(n => ({ ...n, read: true }))
      }))
    }),
    { name: 'stealthpay-storage' }
  )
)
