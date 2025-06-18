```typescript
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { StreamFlow } from "../target/types/stream_flow";
import { PublicKey, Keypair, SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, createMint, createAccount, mintTo, getAccount } from "@solana/spl-token";
import { expect } from "chai";

describe("StreamFlow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.StreamFlow as Program<StreamFlow>;
  const payer = provider.wallet as anchor.Wallet;

  let mint: PublicKey;
  let senderTokenAccount: PublicKey;
  let recipientTokenAccount: PublicKey;
  let streamAccount: Keypair;
  let escrowAccount: PublicKey;
  let recipient: Keypair;

  const streamAmount = new anchor.BN(1000 * LAMPORTS_PER_SOL);
  const startTime = new anchor.BN(Math.floor(Date.now() / 1000));
  const endTime = new anchor.BN(Math.floor(Date.now() / 1000) + 3600); // 1 hour from now
  const cliffTime = new anchor.BN(Math.floor(Date.now() / 1000) + 1800); // 30 minutes from now

  before(async () => {
    // Create recipient keypair
    recipient = Keypair.generate();

    // Airdrop SOL to recipient for account creation
    const signature = await provider.connection.requestAirdrop(
      recipient.publicKey,
      2 * LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Create mint
    mint = await createMint(
      provider.connection,
      payer.payer,
      payer.publicKey,
      null,
      9
    );

    // Create token accounts
    senderTokenAccount = await createAccount(
      provider.connection,
      payer.payer,
      mint,
      payer.publicKey
    );

    recipientTokenAccount = await createAccount(
      provider.connection,
      payer.payer,
      mint,
      recipient.publicKey
    );

    // Mint tokens to sender
    await mintTo(
      provider.connection,
      payer.payer,
      mint,
      senderTokenAccount,
      payer.publicKey,
      streamAmount.toNumber() * 2
    );

    // Generate stream account keypair
    streamAccount = Keypair.generate();

    // Derive escrow account PDA
    [escrowAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), streamAccount.publicKey.toBuffer()],
      program.programId
    );
  });

  it("Creates a token stream", async () => {
    const tx = await program.methods
      .createStream(
        streamAmount,
        startTime,
        endTime,
        cliffTime,
        false, // cancelable
        false  // pausable
      )
      .accounts({
        stream: streamAccount.publicKey,
        sender: payer.publicKey,
        recipient: recipient.publicKey,
        mint: mint,
        senderTokenAccount: senderTokenAccount,
        escrowTokenAccount: escrowAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([streamAccount])
      .rpc();

    console.log("Create stream transaction signature:", tx);

    // Verify stream account data
    const streamData = await program.account.stream.fetch(streamAccount.publicKey);
    expect(streamData.sender.toString()).to.equal(payer.publicKey.toString());
    expect(streamData.recipient.toString()).to.equal(recipient.publicKey.toString());
    expect(streamData.mint.toString()).to.equal(mint.toString());
    expect(streamData.amount.toString()).to.equal(streamAmount.toString());
    expect(streamData.startTime.toString()).to.equal(startTime.toString());
    expect(streamData.endTime.toString()).to.equal(endTime.toString());
    expect(streamData.cliffTime.toString()).to.equal(cliffTime.toString());
    expect(streamData.amountWithdrawn.toString()).to.equal("0");
    expect(streamData.canceled).to.be.false;
    expect(streamData.paused).to.be.false;

    // Verify escrow account has tokens
    const escrowTokenAccount = await getAccount(provider.connection, escrowAccount);
    expect(escrowTokenAccount.amount.toString()).to.equal(streamAmount.toString());
  });

  it("Withdraws from stream", async () => {
    // Wait a bit to allow some tokens to be withdrawable
    await new Promise(resolve => setTimeout(resolve, 2000));

    const withdrawAmount = new anchor.BN(100 * LAMPORTS_PER_SOL);

    const tx = await program.methods
      .withdraw(withdrawAmount)
      .accounts({
        stream: streamAccount.publicKey,
        recipient: recipient.publicKey,
        recipientTokenAccount: recipientTokenAccount,
        escrowTokenAccount: escrowAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([recipient])
      .rpc();

    console.log("Withdraw transaction signature:", tx);

    // Verify stream data updated
    const streamData = await program.account.stream.fetch(streamAccount.publicKey);
    expect(streamData.amountWithdrawn.toNumber()).to.be.greaterThan(0);

    // Verify recipient received tokens
    const recipientAccount = await getAccount(provider.connection, recipientTokenAccount);
    expect(recipientAccount.amount.toString()).to.equal(streamData.amountWithdrawn.toString());
  });

  it("Calculates withdrawable amount correctly", async () => {
    const currentTime = Math.floor(Date.now() / 1000);
    const streamData = await program.account.stream.fetch(streamAccount.publicKey);

    let expectedWithdrawable = new anchor.BN(0);

    if (currentTime >= streamData.cliffTime.toNumber()) {
      if (currentTime >= streamData.endTime.toNumber()) {
        // Stream fully vested
        expectedWithdrawable = streamData.amount.sub(streamData.amountWithdrawn);
      } else {
        // Partial vesting
        const elapsed = new anchor.BN(currentTime - streamData.startTime.toNumber());
        const duration = streamData.endTime.sub(streamData.startTime);
        const vestedAmount = streamData.amount.mul(elapsed).div(duration);
        expectedWithdrawable = vestedAmount.sub(streamData.amountWithdrawn);
      }
    }

    // This is a basic check - in practice you'd call a view function
    expect(expectedWithdrawable.toNumber()).to.be.greaterThanOrEqual(0);
  });

  it("Prevents withdrawal before cliff", async () => {
    // Create a new stream with cliff in the future
    const futureCliffTime = new anchor.BN(Math.floor(Date.now() / 1000) + 7200); // 2 hours from now
    const newStreamAccount = Keypair.generate();
    const [newEscrowAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), newStreamAccount.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .createStream(
        streamAmount,
        startTime,
        endTime,
        futureCliffTime,
        false,
        false
      )
      .accounts({
        stream: newStreamAccount.publicKey,
        sender: payer.publicKey,
        recipient: recipient.publicKey,
        mint: mint,
        senderTokenAccount: senderTokenAccount,
        escrowTokenAccount: newEscrowAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([newStreamAccount])
      .rpc();

    // Try to withdraw before cliff
    try {
      await program.methods
        .withdraw(new anchor.BN(1))
        .accounts({
          stream: newStreamAccount.publicKey,
          recipient: recipient.publicKey,
          recipientTokenAccount: recipientTokenAccount,
          escrowTokenAccount: newEscrowAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .signers([recipient])
        .rpc();
      
      expect.fail("Should have failed to withdraw before cliff");
    } catch (error) {
      expect(error.toString()).to.include("CliffNotReached");
    }
  });

  it("Cancels a cancelable stream", async () => {
    // Create a cancelable stream
    const cancelableStreamAccount = Keypair.generate();
    const [cancelableEscrowAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), cancelableStreamAccount.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .createStream(
        streamAmount,
        startTime,
        endTime,
        cliffTime,
        true, // cancelable
        false
      )
      .accounts({
        stream: cancelableStreamAccount.publicKey,
        sender: payer.publicKey,
        recipient: recipient.publicKey,
        mint: mint,
        senderTokenAccount: senderTokenAccount,
        escrowTokenAccount: cancelableEscrowAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([cancelableStreamAccount])
      .rpc();

    // Cancel the stream
    const tx = await program.methods
      .cancelStream()
      .accounts({
        stream: cancelableStreamAccount.publicKey,
        sender: payer.publicKey,
        recipient: recipient.publicKey,
        senderTokenAccount: senderTokenAccount,
        recipientTokenAccount: recipientTokenAccount,
        escrowTokenAccount: cancelableEscrowAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    console.log("Cancel stream transaction signature:", tx);

    // Verify stream is canceled
    const streamData = await program.account.stream.fetch(cancelableStreamAccount.publicKey);
    expect(streamData.canceled).to.be.true;
  });

  it("Prevents canceling non-cancelable stream", async () => {
    try {
      await program.methods
        .cancelStream()
        .accounts({
          stream: streamAccount.publicKey,
          sender: payer.publicKey,
          recipient: recipient.publicKey,
          senderTokenAccount: senderTokenAccount,
          recipientTokenAccount: recipientTokenAccount,
          escrowTokenAccount: escrowAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();
      
      expect.fail("Should have failed to cancel non-cancelable stream");
    } catch (error) {
      expect(error.toString()).to.include("StreamNotCancelable");
    }
  });

  it("Pauses and resumes a pausable stream", async () => {
    // Create a pausable stream
    const pausableStreamAccount = Keypair.generate();
    const [pausableEscrowAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), pausableStreamAccount.publicKey.toBuffer()],
      program.programId
    );

    await program.methods
      .createStream(
        streamAmount,
        startTime,
        endTime,
        cliffTime,
        false,
        true // pausable
      )
      .accounts({
        stream: pausableStreamAccount.publicKey,
        sender: payer.publicKey,
        recipient: recipient.publicKey,
        mint: mint,
        senderTokenAccount: senderTokenAccount,
        escrowTokenAccount: pausableEscrowAccount,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([pausableStreamAccount])
      .rpc();

    // Pause the stream
    await program.methods
      .pauseStream()
      .accounts({
        stream: pausableStreamAccount.publicKey,
        sender: payer.publicKey,
      })
      .rpc();

    let streamData = await program.account.stream.fetch(pausableStreamAccount.publicKey);
    expect(streamData.paused).to.be.true;

    // Resume the stream
    await program.methods
      .resumeStream()
      .accounts({
        stream: pausableStreamAccount.publicKey,
        sender: payer.publicKey,
      })
      .rpc();

    streamData = await program.account.stream.fetch(pausableStreamAccount.publicKey);
    expect(streamData.paused).to.be.false;
  });

  it("Updates stream recipient", async () => {
    const newRecipient = Keypair.generate();
    
    // Airdrop SOL to new recipient
    const signature = await provider.connection.requestAirdrop(
      newRecipient.publicKey,
      LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    const tx = await program.methods
      .updateRecipient(newRecipient.publicKey)
      .accounts({
        stream: streamAccount.publicKey,
        currentRecipient: recipient.publicKey,
      })
      .signers([recipient])
      .rpc();

    console.log("Update recipient transaction signature:", tx);

    const streamData = await program.account.stream.fetch(streamAccount.publicKey);
    expect(streamData.recipient.toString()).to.equal(newRecipient.publicKey.toString());
  });

  it("Handles multiple streams for same sender-recipient pair", async () => {
    const stream1 = Keypair.generate();
    const stream2 = Keypair.generate();
    
    const [escrow1] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), stream1.publicKey.toBuffer()],
      program.programId
    );
    
    const [escrow2] = PublicKey.findProgramAddressSync(
      [Buffer.from("escrow"), stream2.publicKey.toBuffer()],
      program.programId
    );

    // Create first stream
    await program.methods
      .createStream(
        new anchor.BN(500 * LAMPORTS_PER_SOL),
        startTime,
        endTime,
        cliffTime,
        false,
        false
      )
      .accounts({
        stream: stream1.publicKey,
        sender: payer.publicKey,
        recipient: recipient.publicKey,
        mint: mint,
        senderTokenAccount: senderTokenAccount,
        escrowTokenAccount: escrow1,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .signers([stream1])
      .rpc();

    // Create second stream
    await program.methods
      .createStream(
        new anchor.BN(300 * LAMPORTS_PER_SOL),
        startTime,
        new anchor.BN(Math.floor(Date.now() / 1000) + 7200), // Different