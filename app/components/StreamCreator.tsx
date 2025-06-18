```tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { CalendarIcon, InfoIcon, PlusIcon, XIcon } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

interface StreamCreatorProps {
  onCreateStream?: (streamData: StreamData) => void
  onCancel?: () => void
}

interface StreamData {
  recipient: string
  tokenAddress: string
  totalAmount: string
  streamName: string
  description: string
  startDate: Date
  endDate: Date
  cliffDate?: Date
  releaseFrequency: 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month'
  cancelable: boolean
  transferable: boolean
  automaticWithdrawal: boolean
  tags: string[]
}

interface TokenOption {
  address: string
  symbol: string
  name: string
  decimals: number
  logoUri?: string
}

const popularTokens: TokenOption[] = [
  {
    address: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoUri: '/tokens/sol.png'
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoUri: '/tokens/usdc.png'
  },
  {
    address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoUri: '/tokens/usdt.png'
  }
]

export default function StreamCreator({ onCreateStream, onCancel }: StreamCreatorProps) {
  const [formData, setFormData] = useState<StreamData>({
    recipient: '',
    tokenAddress: '',
    totalAmount: '',
    streamName: '',
    description: '',
    startDate: new Date(),
    endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    releaseFrequency: 'second',
    cancelable: true,
    transferable: false,
    automaticWithdrawal: false,
    tags: []
  })

  const [newTag, setNewTag] = useState('')
  const [startDateOpen, setStartDateOpen] = useState(false)
  const [endDateOpen, setEndDateOpen] = useState(false)
  const [cliffDateOpen, setCliffDateOpen] = useState(false)
  const [customToken, setCustomToken] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.recipient.trim()) {
      newErrors.recipient = 'Recipient address is required'
    }

    if (!formData.tokenAddress) {
      newErrors.tokenAddress = 'Token selection is required'
    }

    if (!formData.totalAmount || parseFloat(formData.totalAmount) <= 0) {
      newErrors.totalAmount = 'Valid amount is required'
    }

    if (!formData.streamName.trim()) {
      newErrors.streamName = 'Stream name is required'
    }

    if (formData.endDate <= formData.startDate) {
      newErrors.endDate = 'End date must be after start date'
    }

    if (formData.cliffDate && formData.cliffDate <= formData.startDate) {
      newErrors.cliffDate = 'Cliff date must be after start date'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = () => {
    if (validateForm()) {
      onCreateStream?.(formData)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }))
  }

  const calculateStreamRate = () => {
    if (!formData.totalAmount || !formData.startDate || !formData.endDate) return null

    const totalAmount = parseFloat(formData.totalAmount)
    const duration = formData.endDate.getTime() - formData.startDate.getTime()
    const durationInSeconds = duration / 1000

    const ratePerSecond = totalAmount / durationInSeconds

    switch (formData.releaseFrequency) {
      case 'minute':
        return (ratePerSecond * 60).toFixed(6)
      case 'hour':
        return (ratePerSecond * 3600).toFixed(6)
      case 'day':
        return (ratePerSecond * 86400).toFixed(6)
      case 'week':
        return (ratePerSecond * 604800).toFixed(6)
      case 'month':
        return (ratePerSecond * 2592000).toFixed(6)
      default:
        return ratePerSecond.toFixed(9)
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Create New Stream</h1>
          <p className="text-slate-400 mt-2">Set up a new token stream with customizable vesting schedule</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onCancel} className="border-slate-700 text-slate-300 hover:bg-slate-800">
            Cancel
          </Button>
          <Button onClick={handleSubmit} className="bg-blue-500 hover:bg-blue-600 text-white">
            Create Stream
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Basic Information</CardTitle>
              <CardDescription className="text-slate-400">
                Configure the fundamental details of your stream
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="streamName" className="text-slate-300">Stream Name</Label>
                  <Input
                    id="streamName"
                    placeholder="e.g., Team Vesting Q1 2024"
                    value={formData.streamName}
                    onChange={(e) => setFormData(prev => ({ ...prev, streamName: e.target.value }))}
                    className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  {errors.streamName && <p className="text-red-400 text-sm">{errors.streamName}</p>}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="recipient" className="text-slate-300">Recipient Address</Label>
                  <Input
                    id="recipient"
                    placeholder="Solana wallet address"
                    value={formData.recipient}
                    onChange={(e) => setFormData(prev => ({ ...prev, recipient: e.target.value }))}
                    className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  />
                  {errors.recipient && <p className="text-red-400 text-sm">{errors.recipient}</p>}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description" className="text-slate-300">Description (Optional)</Label>
                <Textarea
                  id="description"
                  placeholder="Add a description for this stream..."
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500 min-h-[80px]"
                />
              </div>
            </CardContent>
          </Card>

          {/* Token Configuration */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Token Configuration</CardTitle>
              <CardDescription className="text-slate-400">
                Select the token and amount to stream
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="customToken"
                  checked={customToken}
                  onCheckedChange={setCustomToken}
                />
                <Label htmlFor="customToken" className="text-slate-300">Use custom token</Label>
              </div>

              {!customToken ? (
                <div className="space-y-2">
                  <Label className="text-slate-300">Select Token</Label>
                  <Select value={formData.tokenAddress} onValueChange={(value) => setFormData(prev => ({ ...prev, tokenAddress: value }))}>
                    <SelectTrigger className="bg-slate-900 border-slate-600 text-white">
                      <SelectValue placeholder="Choose a token" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-600">
                      {popularTokens.map((token) => (
                        <SelectItem key={token.address} value={token.address} className="text-white hover:bg-slate-800">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                              <span className="text-xs font-medium">{token.symbol[0]}</span>
                            </div>
                            <span>{token.symbol}</span>
                            <span className="text-slate-400">({token.name})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="customTokenAddress" className="text-slate-300">Token Address</Label>
                  <Input
                    id="customTokenAddress"
                    placeholder="Enter token mint address"
                    value={formData.tokenAddress}
                    onChange={(e) => setFormData(prev => ({ ...prev, tokenAddress: e.target.value }))}
                    className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="totalAmount" className="text-slate-300">Total Amount</Label>
                <Input
                  id="totalAmount"
                  type="number"
                  placeholder="0.00"
                  value={formData.totalAmount}
                  onChange={(e) => setFormData(prev => ({ ...prev, totalAmount: e.target.value }))}
                  className="bg-slate-900 border-slate-600 text-white placeholder:text-slate-500"
                />
                {errors.totalAmount && <p className="text-red-400 text-sm">{errors.totalAmount}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Schedule Configuration */}
          <Card className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">Schedule Configuration</CardTitle>
              <CardDescription className="text-slate-400">
                Define when and how tokens will be released
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">Start Date</Label>
                  <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-slate-900 border-slate-600 text-white hover:bg-slate-800",
                          !formData.startDate && "text-slate-500"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {formData.startDate ? format(formData.startDate, "PPP") : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-slate-900 border-slate-600" align="start">
                      <Calendar
                        mode="single"
                        selected={formData.startDate}
                        onSelect={(date) => {
                          if (date) {
                            setFormData(prev => ({ ...prev, startDate: date }))
                            setStartDateOpen(false)
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="text-white"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">End Date</Label>
                  <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal bg-slate-900 border