# StreamFlow Clone

A modern token streaming and vesting platform for Solana with real-time payments, vesting schedules, and treasury management.

## Features

- **Token Streaming**: Create continuous payment streams with customizable rates and schedules
- **Vesting Schedules**: Set up linear and cliff vesting for team tokens and investor allocations
- **Treasury Management**: Comprehensive dashboard for managing organizational funds
- **Real-time Payments**: Automated payment distribution with second-by-second precision
- **Multi-token Support**: Support for SPL tokens and native SOL
- **Advanced Analytics**: Detailed insights into payment flows and vesting progress
- **Recipient Management**: Easy management of payment recipients and beneficiaries

## Tech Stack

- **Frontend**: Next.js 14 with App Router, TypeScript, Tailwind CSS
- **UI Components**: shadcn/ui component library
- **Blockchain**: Solana Web3.js, Anchor Framework
- **Wallet Integration**: Solana Wallet Adapter
- **State Management**: Zustand
- **Charts**: Recharts
- **Styling**: Tailwind CSS with custom dark theme
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn
- Solana CLI tools
- Phantom or Solflare wallet

### Installation

1. Clone the repository:
```bash
git clone https://github.com/your-username/streamflow-clone.git
cd streamflow-clone
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

4. Configure your environment variables:
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
```

5. Run the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
streamflow-clone/
├── app/                    # Next.js app directory
│   ├── dashboard/         # Dashboard pages
│   ├── streams/           # Stream management pages
│   ├── vesting/           # Vesting schedule pages
│   └── treasury/          # Treasury management pages
├── components/            # Reusable UI components
│   ├── ui/               # shadcn/ui components
│   ├── charts/           # Chart components
│   ├── forms/            # Form components
│   └── layout/           # Layout components
├── lib/                  # Utility functions and configurations
│   ├── solana/           # Solana-specific utilities
│   ├── utils.ts          # General utilities
│   └── constants.ts      # App constants
├── hooks/                # Custom React hooks
├── stores/               # Zustand stores
├── types/                # TypeScript type definitions
└── public/               # Static assets
```

## Key Components

### Stream Management
- Create and manage token streams
- Real-time payment tracking
- Pause, resume, and cancel streams
- Bulk stream operations

### Vesting Schedules
- Linear and cliff vesting options
- Team and investor allocation management
- Automated token release
- Vesting progress visualization

### Treasury Dashboard
- Multi-token balance overview
- Transaction history
- Payment analytics
- Fund allocation insights

### Wallet Integration
- Multi-wallet support (Phantom, Solflare, etc.)
- Secure transaction signing
- Account management
- Network switching

## Usage Examples

### Creating a Token Stream

```typescript
import { createStream } from '@/lib/solana/streams'

const streamData = {
  recipient: 'recipient-wallet-address',
  tokenMint: 'token-mint-address',
  amount: 1000,
  duration: 30 * 24 * 60 * 60, // 30 days in seconds
  startTime: Date.now() / 1000,
}

const stream = await createStream(streamData)
```

### Setting Up Vesting

```typescript
import { createVestingSchedule } from '@/lib/solana/vesting'

const vestingData = {
  beneficiary: 'beneficiary-wallet-address',
  tokenMint: 'token-mint-address',
  totalAmount: 10000,
  cliffDuration: 6 * 30 * 24 * 60 * 60, // 6 months
  vestingDuration: 24 * 30 * 24 * 60 * 60, // 24 months
}

const vesting = await createVestingSchedule(vestingData)
```

## API Reference

### Stream Operations
- `createStream(data)` - Create a new payment stream
- `pauseStream(streamId)` - Pause an active stream
- `resumeStream(streamId)` - Resume a paused stream
- `cancelStream(streamId)` - Cancel and withdraw remaining funds
- `getStreamDetails(streamId)` - Fetch stream information

### Vesting Operations
- `createVestingSchedule(data)` - Create a new vesting schedule
- `claimVestedTokens(scheduleId)` - Claim available vested tokens
- `getVestingProgress(scheduleId)` - Get vesting progress details
- `updateVestingSchedule(scheduleId, data)` - Modify vesting parameters

### Treasury Operations
- `getBalances()` - Fetch all token balances
- `getTransactionHistory()` - Get transaction history
- `transferTokens(data)` - Execute token transfers
- `getAnalytics()` - Fetch treasury analytics

## Configuration

### Solana Network Configuration

```typescript
// lib/solana/config.ts
export const SOLANA_CONFIG = {
  network: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  rpcEndpoint: process.env.NEXT_PUBLIC_RPC_ENDPOINT,
  commitment: 'confirmed' as const,
}
```

### Theme Configuration

```typescript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0f172a', // slate-900
          foreground: '#f8fafc', // slate-50
        },
        secondary: {
          DEFAULT: '#1e293b', // slate-800
          foreground: '#f1f5f9', // slate-100
        },
        accent: {
          DEFAULT: '#3b82f6', // blue-500
          foreground: '#ffffff',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
}
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit your changes: `git commit -am 'Add new feature'`
4. Push to the branch: `git push origin feature/new-feature`
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Use ESLint and Prettier for code formatting
- Write unit tests for utility functions
- Follow the established component structure
- Use semantic commit messages

## Security Considerations

- Never store private keys in the application
- Validate all user inputs
- Use secure RPC endpoints
- Implement proper error handling
- Regular security audits of smart contracts

## Testing

```bash
# Run unit tests
npm run test

# Run integration tests
npm run test:integration

# Run end-to-end tests
npm run test:e2e
```

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

- Documentation: [docs.streamflow-clone.com](https://docs.streamflow-clone.com)
- Discord: [Join our community](https://discord.gg/streamflow-clone)
- Email: support@streamflow-clone.com

## Acknowledgments

- Solana Foundation for blockchain infrastructure
- shadcn/ui for the component library
- Vercel for hosting and deployment
- The open-source community for various tools and libraries