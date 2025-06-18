```tsx
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { WalletAdapter, WalletError } from '@solana/wallet-adapter-base'
import {
  ConnectionProvider,
  WalletProvider as SolanaWalletProvider,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react'
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui'
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
  LedgerWalletAdapter,
  SlopeWalletAdapter,
} from '@solana/wallet-adapter-wallets'
import { clusterApiUrl } from '@solana/web3.js'
import { toast } from 'sonner'

require('@solana/wallet-adapter-react-ui/styles.css')

interface WalletContextType {
  wallet: WalletAdapter | null
  publicKey: PublicKey | null
  connected: boolean
  connecting: boolean
  disconnecting: boolean
  connection: Connection
  connect: () => Promise<void>
  disconnect: () => Promise<void>
  sendTransaction: (transaction: Transaction) => Promise<string>
  signTransaction: (transaction: Transaction) => Promise<Transaction>
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>
  balance: number | null
  refreshBalance: () => Promise<void>
}

const WalletContext = createContext<WalletContextType | undefined>(undefined)

interface WalletProviderProps {
  children: ReactNode
  network?: 'mainnet-beta' | 'testnet' | 'devnet'
  endpoint?: string
}

const WalletInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { connection } = useConnection()
  const {
    wallet,
    publicKey,
    connected,
    connecting,
    disconnecting,
    connect: walletConnect,
    disconnect: walletDisconnect,
    sendTransaction: walletSendTransaction,
    signTransaction: walletSignTransaction,
    signAllTransactions: walletSignAllTransactions,
  } = useWallet()

  const [balance, setBalance] = useState<number | null>(null)

  const connect = async () => {
    try {
      await walletConnect()
      toast.success('Wallet connected successfully')
    } catch (error) {
      console.error('Failed to connect wallet:', error)
      toast.error('Failed to connect wallet')
    }
  }

  const disconnect = async () => {
    try {
      await walletDisconnect()
      setBalance(null)
      toast.success('Wallet disconnected')
    } catch (error) {
      console.error('Failed to disconnect wallet:', error)
      toast.error('Failed to disconnect wallet')
    }
  }

  const sendTransaction = async (transaction: Transaction): Promise<string> => {
    if (!publicKey) {
      throw new Error('Wallet not connected')
    }

    try {
      const signature = await walletSendTransaction(transaction, connection)
      await connection.confirmTransaction(signature, 'confirmed')
      toast.success('Transaction sent successfully')
      return signature
    } catch (error) {
      console.error('Failed to send transaction:', error)
      toast.error('Failed to send transaction')
      throw error
    }
  }

  const signTransaction = async (transaction: Transaction): Promise<Transaction> => {
    if (!walletSignTransaction) {
      throw new Error('Wallet does not support transaction signing')
    }

    try {
      return await walletSignTransaction(transaction)
    } catch (error) {
      console.error('Failed to sign transaction:', error)
      toast.error('Failed to sign transaction')
      throw error
    }
  }

  const signAllTransactions = async (transactions: Transaction[]): Promise<Transaction[]> => {
    if (!walletSignAllTransactions) {
      throw new Error('Wallet does not support signing multiple transactions')
    }

    try {
      return await walletSignAllTransactions(transactions)
    } catch (error) {
      console.error('Failed to sign transactions:', error)
      toast.error('Failed to sign transactions')
      throw error
    }
  }

  const refreshBalance = async () => {
    if (!publicKey || !connection) return

    try {
      const balance = await connection.getBalance(publicKey)
      setBalance(balance / 1e9) // Convert lamports to SOL
    } catch (error) {
      console.error('Failed to fetch balance:', error)
      setBalance(null)
    }
  }

  useEffect(() => {
    if (connected && publicKey) {
      refreshBalance()
    } else {
      setBalance(null)
    }
  }, [connected, publicKey, connection])

  useEffect(() => {
    if (!connected || !publicKey) return

    const interval = setInterval(refreshBalance, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [connected, publicKey])

  const contextValue: WalletContextType = {
    wallet,
    publicKey,
    connected,
    connecting,
    disconnecting,
    connection,
    connect,
    disconnect,
    sendTransaction,
    signTransaction,
    signAllTransactions,
    balance,
    refreshBalance,
  }

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  )
}

export const WalletProvider: React.FC<WalletProviderProps> = ({
  children,
  network = 'mainnet-beta',
  endpoint,
}) => {
  const wallets = React.useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new TorusWalletAdapter(),
      new LedgerWalletAdapter(),
      new SlopeWalletAdapter(),
    ],
    []
  )

  const connectionEndpoint = endpoint || clusterApiUrl(network)

  const onError = React.useCallback((error: WalletError) => {
    console.error('Wallet error:', error)
    toast.error(`Wallet error: ${error.message}`)
  }, [])

  return (
    <ConnectionProvider endpoint={connectionEndpoint}>
      <SolanaWalletProvider wallets={wallets} onError={onError} autoConnect>
        <WalletModalProvider>
          <WalletInner>{children}</WalletInner>
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  )
}

export const useWalletContext = (): WalletContextType => {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWalletContext must be used within a WalletProvider')
  }
  return context
}

export default WalletProvider
```