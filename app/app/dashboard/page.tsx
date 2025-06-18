```tsx
import { Suspense } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  Wallet, 
  TrendingUp, 
  Calendar,
  Plus,
  Eye,
  Settings,
  Download
} from 'lucide-react'

interface StreamData {
  id: string
  recipient: string
  amount: number
  token: string
  startDate: string
  endDate: string
  claimed: number
  status: 'active' | 'completed' | 'cancelled'
  type: 'vesting' | 'streaming'
}

interface TreasuryData {
  totalValue: number
  tokens: Array<{
    symbol: string
    amount: number
    value: number
    change24h: number
  }>
}

const mockStreams: StreamData[] = [
  {
    id: '1',
    recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    amount: 10000,
    token: 'USDC',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    claimed: 3500,
    status: 'active',
    type: 'vesting'
  },
  {
    id: '2',
    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    amount: 5000,
    token: 'SOL',
    startDate: '2024-02-15',
    endDate: '2024-08-15',
    claimed: 4200,
    status: 'active',
    type: 'streaming'
  },
  {
    id: '3',
    recipient: '4vMsoUT2BWatFweudnQM1xedRLfJgJ7hswhcpz4xgBTy',
    amount: 25000,
    token: 'USDT',
    startDate: '2023-06-01',
    endDate: '2024-06-01',
    claimed: 25000,
    status: 'completed',
    type: 'vesting'
  }
]

const mockTreasury: TreasuryData = {
  totalValue: 125000,
  tokens: [
    { symbol: 'SOL', amount: 450, value: 45000, change24h: 2.5 },
    { symbol: 'USDC', amount: 50000, value: 50000, change24h: 0.1 },
    { symbol: 'USDT', amount: 30000, value: 30000, change24h: -0.05 }
  ]
}

function DashboardStats() {
  const totalStreaming = mockStreams.reduce((acc, stream) => acc + stream.amount, 0)
  const totalClaimed = mockStreams.reduce((acc, stream) => acc + stream.claimed, 0)
  const activeStreams = mockStreams.filter(stream => stream.status === 'active').length

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Total Streaming</CardTitle>
          <TrendingUp className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">${totalStreaming.toLocaleString()}</div>
          <p className="text-xs text-slate-400">+12% from last month</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Total Claimed</CardTitle>
          <ArrowDownLeft className="h-4 w-4 text-green-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">${totalClaimed.toLocaleString()}</div>
          <p className="text-xs text-slate-400">+8% from last month</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Active Streams</CardTitle>
          <Clock className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">{activeStreams}</div>
          <p className="text-xs text-slate-400">2 ending this month</p>
        </CardContent>
      </Card>
      
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-slate-200">Treasury Value</CardTitle>
          <Wallet className="h-4 w-4 text-blue-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-white">${mockTreasury.totalValue.toLocaleString()}</div>
          <p className="text-xs text-slate-400">+5.2% from last week</p>
        </CardContent>
      </Card>
    </div>
  )
}

function StreamCard({ stream }: { stream: StreamData }) {
  const progress = (stream.claimed / stream.amount) * 100
  const isCompleted = stream.status === 'completed'
  
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Badge 
              variant={stream.type === 'vesting' ? 'default' : 'secondary'}
              className={stream.type === 'vesting' ? 'bg-blue-500 hover:bg-blue-600' : 'bg-slate-600 hover:bg-slate-700'}
            >
              {stream.type}
            </Badge>
            <Badge 
              variant={isCompleted ? 'default' : 'outline'}
              className={
                isCompleted 
                  ? 'bg-green-500 hover:bg-green-600' 
                  : stream.status === 'active' 
                    ? 'border-blue-500 text-blue-400' 
                    : 'border-red-500 text-red-400'
              }
            >
              {stream.status}
            </Badge>
          </div>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
              <Eye className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-slate-400 hover:text-white">
              <Settings className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <CardTitle className="text-lg text-white">
          {stream.amount.toLocaleString()} {stream.token}
        </CardTitle>
        <CardDescription className="text-slate-400">
          To: {stream.recipient.slice(0, 8)}...{stream.recipient.slice(-8)}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Progress</span>
            <span className="text-white">{progress.toFixed(1)}%</span>
          </div>
          <Progress value={progress} className="h-2 bg-slate-700" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Claimed</p>
            <p className="font-medium text-white">{stream.claimed.toLocaleString()} {stream.token}</p>
          </div>
          <div>
            <p className="text-slate-400">Remaining</p>
            <p className="font-medium text-white">{(stream.amount - stream.claimed).toLocaleString()} {stream.token}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-slate-400">Start Date</p>
            <p className="font-medium text-white">{new Date(stream.startDate).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-slate-400">End Date</p>
            <p className="font-medium text-white">{new Date(stream.endDate).toLocaleDateString()}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function TreasuryOverview() {
  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-white">Treasury Overview</CardTitle>
            <CardDescription className="text-slate-400">
              Total value: ${mockTreasury.totalValue.toLocaleString()}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:bg-slate-700">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {mockTreasury.tokens.map((token) => (
          <div key={token.symbol} className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50">
            <div className="flex items-center space-x-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={`/tokens/${token.symbol.toLowerCase()}.png`} />
                <AvatarFallback className="bg-slate-600 text-white text-xs">
                  {token.symbol.slice(0, 2)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-white">{token.symbol}</p>
                <p className="text-sm text-slate-400">{token.amount.toLocaleString()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-medium text-white">${token.value.toLocaleString()}</p>
              <p className={`text-sm ${token.change24h >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                {token.change24h >= 0 ? '+' : ''}{token.change24h}%
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">Dashboard</h1>
            <p className="text-slate-400">Manage your streams and treasury</p>
          </div>
          <div className="flex items-center space-x-3">
            <Button variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule
            </Button>
            <Button className="bg-blue-500 hover:bg-blue-600">
              <Plus className="h-4 w-4 mr-2" />
              Create Stream
            </Button>
          </div>
        </div>

        <Suspense fallback={<div className="h-32 bg-slate-800 rounded-lg animate-pulse" />}>
          <DashboardStats />
        </Suspense>

        <Tabs defaultValue="streams" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="streams" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Active Streams
            </TabsTrigger>
            <TabsTrigger value="completed" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Completed
            </TabsTrigger>
            <TabsTrigger value="treasury" className="data-[state=active]:bg-slate-700 data-[state=active]:text-white">
              Treasury
            </TabsTrigger>
          </TabsList>

          <TabsContent value="streams" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockStreams
                .filter(stream => stream.status === 'active')
                .map((stream) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {mockStreams
                .filter(stream => stream.status === 'completed')
                .map((stream) => (
                  <StreamCard key={stream.id} stream={stream} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="treasury" className="space-y-4">
            <div className="grid gap-6 lg:grid-cols-2">
              <TreasuryOverview />
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Activity</CardTitle>
                  <CardDescription className="text-slate