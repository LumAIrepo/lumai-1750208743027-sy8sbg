```tsx
import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  CalendarDays, 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Users, 
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Copy,
  ExternalLink,
  Pause,
  Play,
  Settings
} from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

interface StreamData {
  id: string
  name: string
  description: string
  status: 'active' | 'paused' | 'completed' | 'cancelled'
  tokenSymbol: string
  tokenName: string
  tokenImage: string
  totalAmount: number
  streamedAmount: number
  remainingAmount: number
  startDate: Date
  endDate: Date
  cliffDate?: Date
  recipient: {
    address: string
    name?: string
    avatar?: string
  }
  sender: {
    address: string
    name?: string
    avatar?: string
  }
  streamRate: number
  withdrawnAmount: number
  lastWithdrawal?: Date
  createdAt: Date
  vestingSchedule: 'linear' | 'cliff' | 'custom'
  canWithdraw: boolean
  canPause: boolean
  canCancel: boolean
}

interface Transaction {
  id: string
  type: 'withdrawal' | 'deposit' | 'pause' | 'resume' | 'cancel'
  amount?: number
  timestamp: Date
  txHash: string
  status: 'confirmed' | 'pending' | 'failed'
}

async function getStreamData(id: string): Promise<StreamData> {
  // Mock data - replace with actual API call
  const mockData: StreamData = {
    id,
    name: 'Employee Salary Stream',
    description: 'Monthly salary payment stream for software engineer position',
    status: 'active',
    tokenSymbol: 'USDC',
    tokenName: 'USD Coin',
    tokenImage: '/tokens/usdc.png',
    totalAmount: 120000,
    streamedAmount: 45000,
    remainingAmount: 75000,
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
    cliffDate: new Date('2024-02-01'),
    recipient: {
      address: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
      name: 'John Doe',
      avatar: '/avatars/john.png'
    },
    sender: {
      address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      name: 'TechCorp Inc.',
      avatar: '/avatars/techcorp.png'
    },
    streamRate: 10000,
    withdrawnAmount: 42000,
    lastWithdrawal: new Date('2024-11-15'),
    createdAt: new Date('2023-12-15'),
    vestingSchedule: 'linear',
    canWithdraw: true,
    canPause: true,
    canCancel: false
  }

  return mockData
}

async function getTransactionHistory(id: string): Promise<Transaction[]> {
  // Mock data - replace with actual API call
  return [
    {
      id: '1',
      type: 'withdrawal',
      amount: 5000,
      timestamp: new Date('2024-11-15'),
      txHash: '5KJp89B4owHyGzxggh7VB1oRjDvTHT28entjgjdwDcRD',
      status: 'confirmed'
    },
    {
      id: '2',
      type: 'withdrawal',
      amount: 10000,
      timestamp: new Date('2024-11-01'),
      txHash: '3NMpu7v2tnTuYphFBdXaFNCojATMJjaz6AkakUYkEeVs',
      status: 'confirmed'
    },
    {
      id: '3',
      type: 'deposit',
      amount: 120000,
      timestamp: new Date('2024-01-01'),
      txHash: '2b1ktyC4oqFoXMiwEbFvXoECAkNQdmW7hdSNODgAiMRj',
      status: 'confirmed'
    }
  ]
}

function StreamHeader({ stream }: { stream: StreamData }) {
  const progressPercentage = (stream.streamedAmount / stream.totalAmount) * 100

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-white">{stream.name}</h1>
            <Badge 
              variant={stream.status === 'active' ? 'default' : 'secondary'}
              className={`${
                stream.status === 'active' 
                  ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                  : 'bg-slate-700 text-slate-300'
              }`}
            >
              {stream.status.charAt(0).toUpperCase() + stream.status.slice(1)}
            </Badge>
          </div>
          <p className="text-slate-400 max-w-2xl">{stream.description}</p>
        </div>
        
        <div className="flex items-center gap-2">
          {stream.canPause && (
            <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
              {stream.status === 'active' ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
              {stream.status === 'active' ? 'Pause' : 'Resume'}
            </Button>
          )}
          <Button variant="outline" size="sm" className="border-slate-700 text-slate-300 hover:bg-slate-800">
            <Settings className="h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Total Amount</p>
                <p className="text-2xl font-bold text-white">
                  {stream.totalAmount.toLocaleString()} {stream.tokenSymbol}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Streamed</p>
                <p className="text-2xl font-bold text-green-400">
                  {stream.streamedAmount.toLocaleString()} {stream.tokenSymbol}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Withdrawn</p>
                <p className="text-2xl font-bold text-blue-400">
                  {stream.withdrawnAmount.toLocaleString()} {stream.tokenSymbol}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">Remaining</p>
                <p className="text-2xl font-bold text-slate-300">
                  {stream.remainingAmount.toLocaleString()} {stream.tokenSymbol}
                </p>
              </div>
              <Clock className="h-8 w-8 text-slate-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-800 border-slate-700">
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Stream Progress</h3>
              <span className="text-sm text-slate-400">{progressPercentage.toFixed(1)}% Complete</span>
            </div>
            <Progress value={progressPercentage} className="h-3 bg-slate-700" />
            <div className="flex justify-between text-sm text-slate-400">
              <span>Started {format(stream.startDate, 'MMM dd, yyyy')}</span>
              <span>Ends {format(stream.endDate, 'MMM dd, yyyy')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function StreamDetails({ stream }: { stream: StreamData }) {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5" />
            Participants
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-slate-400 mb-2">Sender</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={stream.sender.avatar} />
                  <AvatarFallback className="bg-slate-700 text-slate-300">
                    {stream.sender.name?.charAt(0) || 'S'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-white font-medium">{stream.sender.name || 'Unknown'}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-400">{formatAddress(stream.sender.address)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                      onClick={() => copyToClipboard(stream.sender.address)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="bg-slate-700" />

            <div>
              <p className="text-sm text-slate-400 mb-2">Recipient</p>
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={stream.recipient.avatar} />
                  <AvatarFallback className="bg-slate-700 text-slate-300">
                    {stream.recipient.name?.charAt(0) || 'R'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-white font-medium">{stream.recipient.name || 'Unknown'}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-slate-400">{formatAddress(stream.recipient.address)}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0 text-slate-400 hover:text-white"
                      onClick={() => copyToClipboard(stream.recipient.address)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Schedule Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-400">Start Date</p>
              <p className="text-white font-medium">{format(stream.startDate, 'MMM dd, yyyy')}</p>
              <p className="text-xs text-slate-500">{format(stream.startDate, 'HH:mm:ss')}</p>
            </div>
            <div>
              <p className="text-sm text-slate-400">End Date</p>
              <p className="text-white font-medium">{format(stream.endDate, 'MMM dd, yyyy')}</p>
              <p className="text-xs text-slate-500">{format(stream.endDate, 'HH:mm:ss')}</p>
            </div>
          </div>

          {stream.cliffDate && (
            <div>
              <p className="text-sm text-slate-400">Cliff Date</p>
              <p className="text-white font-medium">{format(stream.cliffDate, 'MMM dd, yyyy')}</p>
              <p className="text-xs text