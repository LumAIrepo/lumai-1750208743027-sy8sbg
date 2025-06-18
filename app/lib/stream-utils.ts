```typescript
import { PublicKey } from '@solana/web3.js'
import { BN } from '@coral-xyz/anchor'

export interface StreamData {
  id: string
  sender: PublicKey
  recipient: PublicKey
  mint: PublicKey
  depositedAmount: BN
  withdrawnAmount: BN
  startTime: BN
  endTime: BN
  cliffTime: BN
  cancelableBySender: boolean
  cancelableByRecipient: boolean
  automaticWithdrawal: boolean
  transferableBySender: boolean
  transferableByRecipient: boolean
  canTopup: boolean
  streamName: string
  withdrawFrequency: BN
  amountPerPeriod: BN
  created: number
  lastWithdrawnAt: BN
  closedAt?: BN
}

export interface VestingSchedule {
  totalAmount: number
  releasedAmount: number
  startDate: Date
  endDate: Date
  cliffDate?: Date
  withdrawnAmount: number
  remainingAmount: number
  nextUnlockDate: Date
  nextUnlockAmount: number
}

export interface StreamMetrics {
  totalStreamed: number
  totalWithdrawn: number
  streamingRate: number
  timeRemaining: number
  percentageComplete: number
  isActive: boolean
  isPaused: boolean
  isCompleted: boolean
  isCancelled: boolean
}

export class StreamCalculator {
  /**
   * Calculate the total amount that should be available for withdrawal at a given time
   */
  static calculateVestedAmount(
    totalAmount: number,
    startTime: number,
    endTime: number,
    currentTime: number,
    cliffTime?: number
  ): number {
    if (currentTime < startTime) return 0
    
    // Check if cliff period has passed
    if (cliffTime && currentTime < cliffTime) return 0
    
    if (currentTime >= endTime) return totalAmount
    
    const totalDuration = endTime - startTime
    const elapsedTime = currentTime - startTime
    const vestedPercentage = elapsedTime / totalDuration
    
    return Math.floor(totalAmount * vestedPercentage)
  }

  /**
   * Calculate withdrawable amount (vested - already withdrawn)
   */
  static calculateWithdrawableAmount(
    totalAmount: number,
    withdrawnAmount: number,
    startTime: number,
    endTime: number,
    currentTime: number,
    cliffTime?: number
  ): number {
    const vestedAmount = this.calculateVestedAmount(
      totalAmount,
      startTime,
      endTime,
      currentTime,
      cliffTime
    )
    
    return Math.max(0, vestedAmount - withdrawnAmount)
  }

  /**
   * Calculate streaming rate per second
   */
  static calculateStreamingRate(
    totalAmount: number,
    startTime: number,
    endTime: number
  ): number {
    const duration = endTime - startTime
    return duration > 0 ? totalAmount / duration : 0
  }

  /**
   * Calculate time remaining until stream completion
   */
  static calculateTimeRemaining(
    endTime: number,
    currentTime: number
  ): number {
    return Math.max(0, endTime - currentTime)
  }

  /**
   * Calculate percentage of stream completed
   */
  static calculateCompletionPercentage(
    startTime: number,
    endTime: number,
    currentTime: number
  ): number {
    if (currentTime < startTime) return 0
    if (currentTime >= endTime) return 100
    
    const totalDuration = endTime - startTime
    const elapsedTime = currentTime - startTime
    
    return Math.min(100, (elapsedTime / totalDuration) * 100)
  }

  /**
   * Calculate next unlock date and amount for periodic vesting
   */
  static calculateNextUnlock(
    totalAmount: number,
    startTime: number,
    endTime: number,
    currentTime: number,
    withdrawFrequency: number,
    amountPerPeriod: number,
    withdrawnAmount: number
  ): { date: Date; amount: number } {
    if (currentTime >= endTime) {
      return { date: new Date(endTime * 1000), amount: 0 }
    }

    const periodsElapsed = Math.floor((currentTime - startTime) / withdrawFrequency)
    const nextUnlockTime = startTime + ((periodsElapsed + 1) * withdrawFrequency)
    
    const totalPeriodsInStream = Math.ceil((endTime - startTime) / withdrawFrequency)
    const remainingPeriods = totalPeriodsInStream - periodsElapsed - 1
    
    let nextAmount = amountPerPeriod
    
    // Handle final period which might have different amount
    if (remainingPeriods === 0) {
      const totalShouldBeWithdrawn = totalAmount
      const totalWillBeWithdrawn = withdrawnAmount + (periodsElapsed * amountPerPeriod)
      nextAmount = totalShouldBeWithdrawn - totalWillBeWithdrawn
    }

    return {
      date: new Date(Math.min(nextUnlockTime, endTime) * 1000),
      amount: Math.max(0, nextAmount)
    }
  }

  /**
   * Generate complete vesting schedule
   */
  static generateVestingSchedule(
    streamData: StreamData,
    currentTime: number = Date.now() / 1000
  ): VestingSchedule {
    const totalAmount = streamData.depositedAmount.toNumber()
    const withdrawnAmount = streamData.withdrawnAmount.toNumber()
    const startTime = streamData.startTime.toNumber()
    const endTime = streamData.endTime.toNumber()
    const cliffTime = streamData.cliffTime.toNumber()

    const vestedAmount = this.calculateVestedAmount(
      totalAmount,
      startTime,
      endTime,
      currentTime,
      cliffTime > 0 ? cliffTime : undefined
    )

    const remainingAmount = totalAmount - withdrawnAmount
    const nextUnlock = this.calculateNextUnlock(
      totalAmount,
      startTime,
      endTime,
      currentTime,
      streamData.withdrawFrequency.toNumber(),
      streamData.amountPerPeriod.toNumber(),
      withdrawnAmount
    )

    return {
      totalAmount,
      releasedAmount: vestedAmount,
      startDate: new Date(startTime * 1000),
      endDate: new Date(endTime * 1000),
      cliffDate: cliffTime > 0 ? new Date(cliffTime * 1000) : undefined,
      withdrawnAmount,
      remainingAmount,
      nextUnlockDate: nextUnlock.date,
      nextUnlockAmount: nextUnlock.amount
    }
  }

  /**
   * Generate stream metrics
   */
  static generateStreamMetrics(
    streamData: StreamData,
    currentTime: number = Date.now() / 1000
  ): StreamMetrics {
    const totalAmount = streamData.depositedAmount.toNumber()
    const withdrawnAmount = streamData.withdrawnAmount.toNumber()
    const startTime = streamData.startTime.toNumber()
    const endTime = streamData.endTime.toNumber()
    const cliffTime = streamData.cliffTime.toNumber()

    const vestedAmount = this.calculateVestedAmount(
      totalAmount,
      startTime,
      endTime,
      currentTime,
      cliffTime > 0 ? cliffTime : undefined
    )

    const streamingRate = this.calculateStreamingRate(totalAmount, startTime, endTime)
    const timeRemaining = this.calculateTimeRemaining(endTime, currentTime)
    const percentageComplete = this.calculateCompletionPercentage(startTime, endTime, currentTime)

    const isActive = currentTime >= startTime && currentTime < endTime && !streamData.closedAt
    const isCompleted = currentTime >= endTime || withdrawnAmount >= totalAmount
    const isCancelled = !!streamData.closedAt && streamData.closedAt.toNumber() < endTime
    const isPaused = false // StreamFlow doesn't have pause functionality

    return {
      totalStreamed: vestedAmount,
      totalWithdrawn: withdrawnAmount,
      streamingRate,
      timeRemaining,
      percentageComplete,
      isActive,
      isPaused,
      isCompleted,
      isCancelled
    }
  }

  /**
   * Format time duration in human readable format
   */
  static formatDuration(seconds: number): string {
    if (seconds < 60) return `${Math.floor(seconds)}s`
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d`
    if (seconds < 31536000) return `${Math.floor(seconds / 2592000)}mo`
    return `${Math.floor(seconds / 31536000)}y`
  }

  /**
   * Calculate APY for a stream (annualized percentage yield)
   */
  static calculateAPY(
    totalAmount: number,
    duration: number,
    currentPrice: number,
    initialPrice: number
  ): number {
    if (duration <= 0 || initialPrice <= 0) return 0
    
    const durationInYears = duration / (365 * 24 * 60 * 60)
    const priceAppreciation = (currentPrice - initialPrice) / initialPrice
    const streamingYield = 0 // StreamFlow doesn't provide additional yield beyond token appreciation
    
    return ((1 + priceAppreciation + streamingYield) ** (1 / durationInYears) - 1) * 100
  }

  /**
   * Validate stream parameters
   */
  static validateStreamParams(params: {
    startTime: number
    endTime: number
    cliffTime?: number
    amount: number
    withdrawFrequency?: number
  }): { isValid: boolean; errors: string[] } {
    const errors: string[] = []
    const currentTime = Date.now() / 1000

    if (params.amount <= 0) {
      errors.push('Amount must be greater than 0')
    }

    if (params.startTime >= params.endTime) {
      errors.push('End time must be after start time')
    }

    if (params.cliffTime && params.cliffTime < params.startTime) {
      errors.push('Cliff time cannot be before start time')
    }

    if (params.cliffTime && params.cliffTime > params.endTime) {
      errors.push('Cliff time cannot be after end time')
    }

    if (params.withdrawFrequency && params.withdrawFrequency <= 0) {
      errors.push('Withdraw frequency must be greater than 0')
    }

    const duration = params.endTime - params.startTime
    if (duration < 60) {
      errors.push('Stream duration must be at least 1 minute')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Calculate gas fees for stream operations
   */
  static estimateGasFees(operation: 'create' | 'withdraw' | 'cancel' | 'transfer'): {
    estimatedSol: number
    estimatedUsd: number
  } {
    // Base estimates for different operations on Solana
    const baseFees = {
      create: 0.01,
      withdraw: 0.005,
      cancel: 0.005,
      transfer: 0.005
    }

    const solPrice = 100 // This should be fetched from a price API in production

    return {
      estimatedSol: baseFees[operation],
      estimatedUsd: baseFees[operation] * solPrice
    }
  }
}

/**
 * Utility functions for working with BN (Big Number) values
 */
export class BNUtils {
  static toBN(value: number | string): BN {
    return new BN(value)
  }

  static fromBN(bn: BN, decimals: number = 9): number {
    return bn.toNumber() / Math.pow(10, decimals)
  }

  static formatBN(bn: BN, decimals: number = 9, precision: number = 6): string {
    const value = this.fromBN(bn, decimals)
    return value.toFixed(precision)
  }

  static addBN(a: BN, b: BN): BN {
    return a.add(b)
  }

  static subBN(a: BN, b: BN): BN {
    return a.sub(b)
  }

  static mulBN(a: BN, b: BN): BN {
    return a.mul(b)
  }

  static divBN(a: BN, b: BN): BN {
    return a.div(b)
  }

  static compareBN(a: BN, b: BN): number {
    return a.cmp(b)
  }

  static isZero(bn: BN): boolean {
    return bn.isZero()
  }

  static isNegative(bn: BN): boolean {
    return bn.isNeg()
  }

  static max(a: BN, b: BN): BN {
    return a.gt(b) ? a : b
  }

  static min(a: BN, b: BN): BN {
    return a.lt(b) ? a : b
  }
}

/**
 * Constants for stream calculations
 */
export const STREAM_CONSTANTS = {
  MIN_STREAM_DURATION: 60, // 1 minute
  MAX_STREAM_DURATION: 365 * 24 * 60 * 60, // 1 year
  DEFAULT_WITHDRAW_FREQUENCY: 24 * 60 * 60, // 1 day
  SOLANA_DECIMALS: 9,
  USDC_DECIMALS: 6,
  PRECISION: 6
} as const

/**
 * Stream status enum
 */
export enum StreamStatus {
  SCHEDULED = 'scheduled',
  STREAMING = 'streaming',
  PAUSED = 'paused',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

/**
 * Get stream status based on current time and stream data
 */
export function getStreamStatus(
  streamData: StreamData,
  currentTime: number = Date.now() / 1000
): StreamStatus {
  const startTime = streamData.startTime.toNumber()
  const endTime = streamData.endTime.toNumber()
  const totalAmount = streamData.depositedAmount.toNumber()
  const withdrawnAmount = streamData.withdrawnAmount.toNumber()

  if (streamData.closedAt && streamData.closedAt.toNumber() < endTime) {
    return StreamStatus.CANCELLED
  }

  if (currentTime < startTime) {
    return StreamStatus.SCHEDULED
  }

  if (currentTime >= endTime || withdrawnAmount >= totalAmount) {
    return StreamStatus.COMPLETED
  }

  return StreamStatus.STREAMING
}
```