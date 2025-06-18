```typescript
export const APP_CONFIG = {
  name: 'StreamFlow',
  description: 'Token streaming and vesting platform for Solana',
  version: '1.0.0',
  url: process.env.NEXT_PUBLIC_APP_URL || 'https://streamflow.finance',
  author: 'StreamFlow Team',
} as const

export const SOLANA_CONFIG = {
  mainnet: {
    rpcUrl: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
    network: 'mainnet-beta',
  },
  devnet: {
    rpcUrl: 'https://api.devnet.solana.com',
    network: 'devnet',
  },
  testnet: {
    rpcUrl: 'https://api.testnet.solana.com',
    network: 'testnet',
  },
} as const

export const STREAM_TYPES = {
  LINEAR: 'linear',
  CLIFF: 'cliff',
  UNLOCK: 'unlock',
  CUSTOM: 'custom',
} as const

export const STREAM_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  SCHEDULED: 'scheduled',
} as const

export const VESTING_TYPES = {
  EMPLOYEE: 'employee',
  INVESTOR: 'investor',
  ADVISOR: 'advisor',
  TEAM: 'team',
  COMMUNITY: 'community',
} as const

export const PAYMENT_FREQUENCIES = {
  SECOND: 'second',
  MINUTE: 'minute',
  HOUR: 'hour',
  DAY: 'day',
  WEEK: 'week',
  MONTH: 'month',
  QUARTER: 'quarter',
  YEAR: 'year',
} as const

export const TREASURY_ACTIONS = {
  DEPOSIT: 'deposit',
  WITHDRAW: 'withdraw',
  TRANSFER: 'transfer',
  APPROVE: 'approve',
  REVOKE: 'revoke',
} as const

export const UI_CONSTANTS = {
  theme: {
    colors: {
      primary: 'slate-900',
      secondary: 'slate-800',
      accent: 'blue-500',
      background: 'slate-950',
      foreground: 'slate-50',
      muted: 'slate-700',
      border: 'slate-800',
    },
    font: 'Inter',
  },
  breakpoints: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  animations: {
    duration: {
      fast: '150ms',
      normal: '300ms',
      slow: '500ms',
    },
    easing: {
      default: 'cubic-bezier(0.4, 0, 0.2, 1)',
      in: 'cubic-bezier(0.4, 0, 1, 1)',
      out: 'cubic-bezier(0, 0, 0.2, 1)',
    },
  },
} as const

export const API_ENDPOINTS = {
  streams: '/api/streams',
  vesting: '/api/vesting',
  treasury: '/api/treasury',
  tokens: '/api/tokens',
  analytics: '/api/analytics',
  notifications: '/api/notifications',
} as const

export const WALLET_ADAPTERS = {
  PHANTOM: 'phantom',
  SOLFLARE: 'solflare',
  BACKPACK: 'backpack',
  GLOW: 'glow',
  SLOPE: 'slope',
  SOLLET: 'sollet',
} as const

export const TOKEN_STANDARDS = {
  SPL: 'spl',
  SPL22: 'spl-22',
  NATIVE: 'native',
} as const

export const NOTIFICATION_TYPES = {
  STREAM_CREATED: 'stream_created',
  STREAM_STARTED: 'stream_started',
  STREAM_PAUSED: 'stream_paused',
  STREAM_RESUMED: 'stream_resumed',
  STREAM_COMPLETED: 'stream_completed',
  STREAM_CANCELLED: 'stream_cancelled',
  PAYMENT_RECEIVED: 'payment_received',
  VESTING_CLIFF: 'vesting_cliff',
  TREASURY_DEPOSIT: 'treasury_deposit',
  TREASURY_WITHDRAWAL: 'treasury_withdrawal',
} as const

export const DASHBOARD_TABS = {
  OVERVIEW: 'overview',
  STREAMS: 'streams',
  VESTING: 'vesting',
  TREASURY: 'treasury',
  ANALYTICS: 'analytics',
  SETTINGS: 'settings',
} as const

export const STREAM_FILTERS = {
  ALL: 'all',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  PAUSED: 'paused',
  CANCELLED: 'cancelled',
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
} as const

export const DATE_FORMATS = {
  SHORT: 'MMM dd, yyyy',
  LONG: 'MMMM dd, yyyy',
  WITH_TIME: 'MMM dd, yyyy HH:mm',
  ISO: "yyyy-MM-dd'T'HH:mm:ss.SSSxxx",
  RELATIVE: 'relative',
} as const

export const CURRENCY_FORMATS = {
  USD: {
    symbol: '$',
    decimals: 2,
    code: 'USD',
  },
  SOL: {
    symbol: '◎',
    decimals: 9,
    code: 'SOL',
  },
  USDC: {
    symbol: '$',
    decimals: 6,
    code: 'USDC',
  },
} as const

export const VALIDATION_RULES = {
  stream: {
    minAmount: 0.000001,
    maxAmount: 1000000000,
    minDuration: 60, // 1 minute in seconds
    maxDuration: 31536000, // 1 year in seconds
  },
  treasury: {
    minBalance: 0,
    maxTransactionAmount: 1000000,
  },
  wallet: {
    addressLength: 44,
    maxNickname: 32,
  },
} as const

export const FEATURE_FLAGS = {
  ENABLE_ANALYTICS: process.env.NEXT_PUBLIC_ENABLE_ANALYTICS === 'true',
  ENABLE_NOTIFICATIONS: process.env.NEXT_PUBLIC_ENABLE_NOTIFICATIONS === 'true',
  ENABLE_TREASURY: process.env.NEXT_PUBLIC_ENABLE_TREASURY === 'true',
  ENABLE_VESTING: process.env.NEXT_PUBLIC_ENABLE_VESTING === 'true',
  ENABLE_MULTI_TOKEN: process.env.NEXT_PUBLIC_ENABLE_MULTI_TOKEN === 'true',
} as const

export const SOCIAL_LINKS = {
  TWITTER: 'https://twitter.com/streamflow',
  DISCORD: 'https://discord.gg/streamflow',
  GITHUB: 'https://github.com/streamflow-finance',
  DOCS: 'https://docs.streamflow.finance',
  BLOG: 'https://blog.streamflow.finance',
} as const

export const SUPPORTED_TOKENS = [
  {
    symbol: 'SOL',
    name: 'Solana',
    mint: 'So11111111111111111111111111111111111111112',
    decimals: 9,
    logoURI: '/tokens/sol.svg',
  },
  {
    symbol: 'USDC',
    name: 'USD Coin',
    mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    decimals: 6,
    logoURI: '/tokens/usdc.svg',
  },
  {
    symbol: 'USDT',
    name: 'Tether USD',
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    decimals: 6,
    logoURI: '/tokens/usdt.svg',
  },
] as const

export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: 'Please connect your wallet to continue',
  INSUFFICIENT_BALANCE: 'Insufficient balance for this transaction',
  INVALID_AMOUNT: 'Please enter a valid amount',
  INVALID_RECIPIENT: 'Please enter a valid recipient address',
  TRANSACTION_FAILED: 'Transaction failed. Please try again',
  NETWORK_ERROR: 'Network error. Please check your connection',
  UNAUTHORIZED: 'You are not authorized to perform this action',
  STREAM_NOT_FOUND: 'Stream not found',
  INVALID_DATE: 'Please select a valid date',
} as const

export const SUCCESS_MESSAGES = {
  STREAM_CREATED: 'Stream created successfully',
  STREAM_CANCELLED: 'Stream cancelled successfully',
  STREAM_PAUSED: 'Stream paused successfully',
  STREAM_RESUMED: 'Stream resumed successfully',
  PAYMENT_SENT: 'Payment sent successfully',
  SETTINGS_SAVED: 'Settings saved successfully',
  TREASURY_UPDATED: 'Treasury updated successfully',
} as const
```