```typescript
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor'
import { Connection, PublicKey, Keypair } from '@solana/web3.js'
import { StreamFlow } from './types/streamflow'
import streamflowIdl from './idl/streamflow.json'

export interface StreamData {
  sender: PublicKey
  recipient: PublicKey
  mint: PublicKey
  escrowTokens: PublicKey
  streamedAmount: number
  withdrawnAmount: number
  startTime: number
  endTime: number
  cliff: number
  cliffAmount: number
  cancelableBySender: boolean
  cancelableByRecipient: boolean
  automaticWithdrawal: boolean
  transferableBySender: boolean
  transferableByRecipient: boolean
  canTopup: boolean
  name: string
  withdrawFrequency: number
  closed: boolean
  currentPauseStart: number
  pauseCumulative: number
  lastWithdrawnAt: number
  fundsUnlockedAtLastWithdraw: number
}

export interface CreateStreamParams {
  recipient: PublicKey
  tokenMint: PublicKey
  start: number
  depositedAmount: number
  period: number
  cliff: number
  cliffAmount: number
  cancelableBySender: boolean
  cancelableByRecipient: boolean
  transferableBySender: boolean
  transferableByRecipient: boolean
  automaticWithdrawal: boolean
  withdrawFrequency: number
  name: string
  canTopup: boolean
  canPause: boolean
}

export interface WithdrawParams {
  streamId: PublicKey
  amount: number
}

export interface CancelStreamParams {
  streamId: PublicKey
}

export interface TransferStreamParams {
  streamId: PublicKey
  newRecipient: PublicKey
}

export interface TopupStreamParams {
  streamId: PublicKey
  amount: number
}

export interface PauseStreamParams {
  streamId: PublicKey
}

export class AnchorClient {
  private connection: Connection
  private provider: AnchorProvider
  private program: Program<StreamFlow>
  private wallet: Wallet

  constructor(connection: Connection, wallet: Wallet) {
    this.connection = connection
    this.wallet = wallet
    this.provider = new AnchorProvider(connection, wallet, {
      commitment: 'confirmed',
      preflightCommitment: 'confirmed',
    })
    this.program = new Program(streamflowIdl as StreamFlow, this.provider)
  }

  static create(rpcUrl: string, wallet: Wallet): AnchorClient {
    const connection = new Connection(rpcUrl, 'confirmed')
    return new AnchorClient(connection, wallet)
  }

  async createStream(params: CreateStreamParams): Promise<PublicKey> {
    const streamKeypair = Keypair.generate()
    const streamId = streamKeypair.publicKey

    const [escrowTokens] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), streamId.toBuffer()],
      this.program.programId
    )

    const senderTokenAccount = await this.getAssociatedTokenAddress(
      params.tokenMint,
      this.wallet.publicKey
    )

    const tx = await this.program.methods
      .createStream(
        params.start,
        params.depositedAmount,
        params.period,
        params.cliff,
        params.cliffAmount,
        params.cancelableBySender,
        params.cancelableByRecipient,
        params.transferableBySender,
        params.transferableByRecipient,
        params.automaticWithdrawal,
        params.withdrawFrequency,
        params.name,
        params.canTopup,
        params.canPause
      )
      .accounts({
        sender: this.wallet.publicKey,
        recipient: params.recipient,
        stream: streamId,
        escrowTokens,
        senderTokens: senderTokenAccount,
        mint: params.tokenMint,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
        associatedTokenProgram: new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL'),
        systemProgram: new PublicKey('11111111111111111111111111111111'),
        rent: new PublicKey('SysvarRent111111111111111111111111111111111'),
      })
      .signers([streamKeypair])
      .rpc()

    return streamId
  }

  async withdrawFromStream(params: WithdrawParams): Promise<string> {
    const streamData = await this.getStream(params.streamId)
    
    const [escrowTokens] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), params.streamId.toBuffer()],
      this.program.programId
    )

    const recipientTokenAccount = await this.getAssociatedTokenAddress(
      streamData.mint,
      this.wallet.publicKey
    )

    const tx = await this.program.methods
      .withdrawFromStream(params.amount)
      .accounts({
        recipient: this.wallet.publicKey,
        stream: params.streamId,
        escrowTokens,
        recipientTokens: recipientTokenAccount,
        mint: streamData.mint,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc()

    return tx
  }

  async cancelStream(params: CancelStreamParams): Promise<string> {
    const streamData = await this.getStream(params.streamId)
    
    const [escrowTokens] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), params.streamId.toBuffer()],
      this.program.programId
    )

    const senderTokenAccount = await this.getAssociatedTokenAddress(
      streamData.mint,
      streamData.sender
    )

    const recipientTokenAccount = await this.getAssociatedTokenAddress(
      streamData.mint,
      streamData.recipient
    )

    const tx = await this.program.methods
      .cancelStream()
      .accounts({
        authority: this.wallet.publicKey,
        sender: streamData.sender,
        recipient: streamData.recipient,
        stream: params.streamId,
        escrowTokens,
        senderTokens: senderTokenAccount,
        recipientTokens: recipientTokenAccount,
        mint: streamData.mint,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc()

    return tx
  }

  async transferStream(params: TransferStreamParams): Promise<string> {
    const tx = await this.program.methods
      .transferStream()
      .accounts({
        currentRecipient: this.wallet.publicKey,
        newRecipient: params.newRecipient,
        stream: params.streamId,
      })
      .rpc()

    return tx
  }

  async topupStream(params: TopupStreamParams): Promise<string> {
    const streamData = await this.getStream(params.streamId)
    
    const [escrowTokens] = PublicKey.findProgramAddressSync(
      [Buffer.from('escrow'), params.streamId.toBuffer()],
      this.program.programId
    )

    const senderTokenAccount = await this.getAssociatedTokenAddress(
      streamData.mint,
      this.wallet.publicKey
    )

    const tx = await this.program.methods
      .topupStream(params.amount)
      .accounts({
        sender: this.wallet.publicKey,
        stream: params.streamId,
        escrowTokens,
        senderTokens: senderTokenAccount,
        mint: streamData.mint,
        tokenProgram: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'),
      })
      .rpc()

    return tx
  }

  async pauseStream(params: PauseStreamParams): Promise<string> {
    const tx = await this.program.methods
      .pauseStream()
      .accounts({
        authority: this.wallet.publicKey,
        stream: params.streamId,
      })
      .rpc()

    return tx
  }

  async resumeStream(streamId: PublicKey): Promise<string> {
    const tx = await this.program.methods
      .resumeStream()
      .accounts({
        authority: this.wallet.publicKey,
        stream: streamId,
      })
      .rpc()

    return tx
  }

  async getStream(streamId: PublicKey): Promise<StreamData> {
    const streamAccount = await this.program.account.stream.fetch(streamId)
    return streamAccount as StreamData
  }

  async getAllStreams(): Promise<Array<{ publicKey: PublicKey; account: StreamData }>> {
    const streams = await this.program.account.stream.all()
    return streams.map(stream => ({
      publicKey: stream.publicKey,
      account: stream.account as StreamData
    }))
  }

  async getStreamsBySender(sender: PublicKey): Promise<Array<{ publicKey: PublicKey; account: StreamData }>> {
    const streams = await this.program.account.stream.all([
      {
        memcmp: {
          offset: 8, // Discriminator
          bytes: sender.toBase58(),
        },
      },
    ])
    return streams.map(stream => ({
      publicKey: stream.publicKey,
      account: stream.account as StreamData
    }))
  }

  async getStreamsByRecipient(recipient: PublicKey): Promise<Array<{ publicKey: PublicKey; account: StreamData }>> {
    const streams = await this.program.account.stream.all([
      {
        memcmp: {
          offset: 40, // Discriminator + sender
          bytes: recipient.toBase58(),
        },
      },
    ])
    return streams.map(stream => ({
      publicKey: stream.publicKey,
      account: stream.account as StreamData
    }))
  }

  async getWithdrawableAmount(streamId: PublicKey): Promise<number> {
    const stream = await this.getStream(streamId)
    const currentTime = Math.floor(Date.now() / 1000)
    
    if (currentTime < stream.startTime + stream.cliff) {
      return 0
    }

    if (currentTime >= stream.endTime) {
      return stream.streamedAmount - stream.withdrawnAmount
    }

    const effectiveTime = currentTime - stream.pauseCumulative
    const elapsedTime = effectiveTime - stream.startTime
    const totalDuration = stream.endTime - stream.startTime
    const streamedAmount = (stream.streamedAmount * elapsedTime) / totalDuration

    return Math.max(0, streamedAmount - stream.withdrawnAmount)
  }

  async getStreamProgress(streamId: PublicKey): Promise<number> {
    const stream = await this.getStream(streamId)
    const currentTime = Math.floor(Date.now() / 1000)
    
    if (currentTime < stream.startTime) {
      return 0
    }

    if (currentTime >= stream.endTime) {
      return 100
    }

    const effectiveTime = currentTime - stream.pauseCumulative
    const elapsedTime = effectiveTime - stream.startTime
    const totalDuration = stream.endTime - stream.startTime

    return Math.min(100, (elapsedTime / totalDuration) * 100)
  }

  private async getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): Promise<PublicKey> {
    const [address] = PublicKey.findProgramAddressSync(
      [
        owner.toBuffer(),
        new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA').toBuffer(),
        mint.toBuffer(),
      ],
      new PublicKey('ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL')
    )
    return address
  }

  get programId(): PublicKey {
    return this.program.programId
  }

  get publicKey(): PublicKey {
    return this.wallet.publicKey
  }
}

export default AnchorClient
```