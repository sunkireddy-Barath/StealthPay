import { Suspense, lazy, useMemo } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ConnectionProvider, WalletProvider } from '@solana/wallet-adapter-react'
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base'
import { PhantomWalletAdapter, SolflareWalletAdapter } from '@solana/wallet-adapter-wallets'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import { clusterApiUrl } from '@solana/web3.js'
import { ProtectedRoute } from './components/layout/ProtectedRoute'

// Default styles that can be overridden by your app
import '@solana/wallet-adapter-react-ui/styles.css'

const AuthPage = lazy(() => import('./pages/AuthPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const PayrollPage = lazy(() => import('./pages/PayrollPage'))
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'))
const PaymentsPage = lazy(() => import('./pages/PaymentsPage'))
const WalletPage = lazy(() => import('./pages/WalletPage'))
const CompliancePage = lazy(() => import('./pages/CompliancePage'))
const ClaimPaymentPage = lazy(() => import('./pages/ClaimPaymentPage'))

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function PageLoader() {
  return (
    <div className="min-h-screen bg-[#08080F] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="relative w-10 h-10">
          <div className="absolute inset-0 rounded-full border-2 border-violet-500/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-violet-500 animate-spin" />
        </div>
        <span className="text-xs text-zinc-500">Loading StealthPay...</span>
      </div>
    </div>
  )
}

function resolveNetwork(): WalletAdapterNetwork {
  const raw = (import.meta.env.VITE_SOLANA_NETWORK || 'devnet').toLowerCase()
  if (raw === 'mainnet' || raw === 'mainnet-beta') return WalletAdapterNetwork.Mainnet
  if (raw === 'testnet') return WalletAdapterNetwork.Testnet
  return WalletAdapterNetwork.Devnet
}

export default function App() {
  const network = useMemo(resolveNetwork, [])
  const endpoint = useMemo(
    () => import.meta.env.VITE_RPC_URL || clusterApiUrl(network),
    [network]
  )
  
  // By providing an empty array here, the WalletProvider will automatically 
  // detect all wallets that support the Solana Wallet Standard (Phantom, Solflare, etc.)
  // We keep explicit adapters only for older extensions that might not support the standard.
  const wallets = useMemo(() => [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter()
  ], [])

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/dashboard" element={
                    <ProtectedRoute><DashboardPage /></ProtectedRoute>
                  } />
                  <Route path="/payroll" element={
                    <ProtectedRoute><PayrollPage /></ProtectedRoute>
                  } />
                  <Route path="/invoices" element={
                    <ProtectedRoute><InvoicesPage /></ProtectedRoute>
                  } />
                  <Route path="/payments" element={
                    <ProtectedRoute><PaymentsPage /></ProtectedRoute>
                  } />
                  <Route path="/wallet" element={
                    <ProtectedRoute><WalletPage /></ProtectedRoute>
                  } />
                  <Route path="/compliance" element={
                    <ProtectedRoute><CompliancePage /></ProtectedRoute>
                  } />
                  <Route path="/pay/:id" element={<ClaimPaymentPage />} />
                  <Route path="/" element={<Navigate to="/auth" replace />} />
                  <Route path="*" element={<Navigate to="/auth" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </QueryClientProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  )
}
