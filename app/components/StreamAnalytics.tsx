```tsx
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, TrendingDown, DollarSign, Users, Clock, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StreamData {
  id: string
  recipient: string
  amount: number
  streamed: number
  remaining: number
  startDate: string
  endDate: string
  status: 'active' | 'completed' | 'cancelled'
  token: string
}

interface AnalyticsData {
  totalStreams: number
  totalValue: number
  activeStreams: number
  completedStreams: number
  totalRecipients: number
  averageStreamSize: number
  monthlyGrowth: number
  weeklyVolume: number
}

interface ChartData {
  date: string
  volume: number
  streams: number
  recipients: number
}

interface TokenDistribution {
  token: string
  value: number
  percentage: number
  color: string
}

const mockStreamData: StreamData[] = [
  {
    id: '1',
    recipient: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    amount: 50000,
    streamed: 32500,
    remaining: 17500,
    startDate: '2024-01-15',
    endDate: '2024-06-15',
    status: 'active',
    token: 'SOL'
  },
  {
    id: '2',
    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    amount: 25000,
    streamed: 25000,
    remaining: 0,
    startDate: '2024-02-01',
    endDate: '2024-04-01',
    status: 'completed',
    token: 'USDC'
  },
  {
    id: '3',
    recipient: '4vMsoUT2BWatFweudnQM1xedRLfJgJ7hswhcpz4xgBTy',
    amount: 75000,
    streamed: 45000,
    remaining: 30000,
    startDate: '2024-03-01',
    endDate: '2024-09-01',
    status: 'active',
    token: 'SOL'
  }
]

const mockChartData: ChartData[] = [
  { date: '2024-01', volume: 125000, streams: 15, recipients: 12 },
  { date: '2024-02', volume: 180000, streams: 22, recipients: 18 },
  { date: '2024-03', volume: 245000, streams: 31, recipients: 25 },
  { date: '2024-04', volume: 320000, streams: 28, recipients: 22 },
  { date: '2024-05', volume: 410000, streams: 35, recipients: 28 },
  { date: '2024-06', volume: 485000, streams: 42, recipients: 34 }
]

const tokenColors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

export default function StreamAnalytics() {
  const [timeRange, setTimeRange] = useState('30d')
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalStreams: 0,
    totalValue: 0,
    activeStreams: 0,
    completedStreams: 0,
    totalRecipients: 0,
    averageStreamSize: 0,
    monthlyGrowth: 0,
    weeklyVolume: 0
  })

  const [tokenDistribution, setTokenDistribution] = useState<TokenDistribution[]>([])

  useEffect(() => {
    // Calculate analytics from mock data
    const totalStreams = mockStreamData.length
    const totalValue = mockStreamData.reduce((sum, stream) => sum + stream.amount, 0)
    const activeStreams = mockStreamData.filter(stream => stream.status === 'active').length
    const completedStreams = mockStreamData.filter(stream => stream.status === 'completed').length
    const totalRecipients = new Set(mockStreamData.map(stream => stream.recipient)).size
    const averageStreamSize = totalValue / totalStreams
    const monthlyGrowth = 24.5
    const weeklyVolume = 125000

    setAnalyticsData({
      totalStreams,
      totalValue,
      activeStreams,
      completedStreams,
      totalRecipients,
      averageStreamSize,
      monthlyGrowth,
      weeklyVolume
    })

    // Calculate token distribution
    const tokenTotals = mockStreamData.reduce((acc, stream) => {
      acc[stream.token] = (acc[stream.token] || 0) + stream.amount
      return acc
    }, {} as Record<string, number>)

    const distribution = Object.entries(tokenTotals).map(([token, value], index) => ({
      token,
      value,
      percentage: (value / totalValue) * 100,
      color: tokenColors[index % tokenColors.length]
    }))

    setTokenDistribution(distribution)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-US').format(value)
  }

  return (
    <div className="space-y-6 p-6 bg-slate-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Stream Analytics</h1>
          <p className="text-slate-400 mt-1">Monitor your streaming performance and insights</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32 bg-slate-800 border-slate-700 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-slate-800 border-slate-700">
            <SelectItem value="7d" className="text-white hover:bg-slate-700">7 days</SelectItem>
            <SelectItem value="30d" className="text-white hover:bg-slate-700">30 days</SelectItem>
            <SelectItem value="90d" className="text-white hover:bg-slate-700">90 days</SelectItem>
            <SelectItem value="1y" className="text-white hover:bg-slate-700">1 year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Value Streamed</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(analyticsData.totalValue)}</div>
            <div className="flex items-center text-xs text-green-500 mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              +{analyticsData.monthlyGrowth}% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Active Streams</CardTitle>
            <Zap className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatNumber(analyticsData.activeStreams)}</div>
            <div className="flex items-center text-xs text-slate-400 mt-1">
              <Clock className="h-3 w-3 mr-1" />
              {analyticsData.completedStreams} completed
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Recipients</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatNumber(analyticsData.totalRecipients)}</div>
            <div className="flex items-center text-xs text-blue-500 mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +12% this week
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Avg Stream Size</CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{formatCurrency(analyticsData.averageStreamSize)}</div>
            <div className="flex items-center text-xs text-red-500 mt-1">
              <ArrowDownRight className="h-3 w-3 mr-1" />
              -3% from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="volume" className="space-y-6">
        <TabsList className="bg-slate-800 border-slate-700">
          <TabsTrigger value="volume" className="data-[state=active]:bg-slate-700 text-white">Volume</TabsTrigger>
          <TabsTrigger value="streams" className="data-[state=active]:bg-slate-700 text-white">Streams</TabsTrigger>
          <TabsTrigger value="distribution" className="data-[state=active]:bg-slate-700 text-white">Token Distribution</TabsTrigger>
        </TabsList>

        <TabsContent value="volume" className="space-y-6">
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Streaming Volume Over Time</CardTitle>
              <CardDescription className="text-slate-400">
                Total value streamed per month
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={mockChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="date" stroke="#9ca3af" />
                  <YAxis stroke="#9ca3af" tickFormatter={(value) => `$${value / 1000}k`} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1f2937',
                      border: '1px solid #374151',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                    formatter={(value: number) => [formatCurrency(value), 'Volume']}
                  />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    fillOpacity={0.2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="streams" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Stream Count</CardTitle>
                <CardDescription className="text-slate-400">
                  Number of streams created per month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Bar dataKey="streams" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Recipients Growth</CardTitle>
                <CardDescription className="text-slate-400">
                  Unique recipients per month
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={mockChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="date" stroke="#9ca3af" />
                    <YAxis stroke="#9ca3af" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1f2937',
                        border: '1px solid #374151',
                        borderRadius: '8px',
                        color: '#fff'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="recipients"
                      stroke="#