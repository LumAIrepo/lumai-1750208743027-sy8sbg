```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};

use crate::errors::StreamError;
use crate::state::{Stream, StreamStatus};

#[derive(Accounts)]
pub struct CancelStream<'info> {
    #[account(
        mut,
        seeds = [
            b"stream",
            stream.sender.as_ref(),
            stream.recipient.as_ref(),
            &stream.start_time.to_le_bytes(),
        ],
        bump = stream.bump,
        constraint = stream.status == StreamStatus::Active @ StreamError::StreamNotActive,
        constraint = stream.sender == sender.key() @ StreamError::Unauthorized,
    )]
    pub stream: Account<'info, Stream>,

    #[account(mut)]
    pub sender: Signer<'info>,

    /// CHECK: This is the recipient account, validated through the stream
    #[account(
        constraint = recipient.key() == stream.recipient @ StreamError::InvalidRecipient
    )]
    pub recipient: AccountInfo<'info>,

    #[account(
        mut,
        constraint = sender_token_account.mint == stream.mint @ StreamError::InvalidMint,
        constraint = sender_token_account.owner == sender.key() @ StreamError::InvalidTokenAccount,
    )]
    pub sender_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        constraint = recipient_token_account.mint == stream.mint @ StreamError::InvalidMint,
        constraint = recipient_token_account.owner == recipient.key() @ StreamError::InvalidTokenAccount,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        seeds = [
            b"escrow",
            stream.key().as_ref(),
        ],
        bump = stream.escrow_bump,
        constraint = escrow_token_account.mint == stream.mint @ StreamError::InvalidMint,
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> CancelStream<'info> {
    pub fn cancel_stream(&mut self) -> Result<()> {
        let stream = &mut self.stream;
        let current_time = Clock::get()?.unix_timestamp;

        // Ensure stream is still active
        require!(
            stream.status == StreamStatus::Active,
            StreamError::StreamNotActive
        );

        // Calculate amounts to distribute
        let (streamed_amount, remaining_amount) = self.calculate_amounts(current_time)?;

        // Transfer streamed amount to recipient if any
        if streamed_amount > 0 {
            self.transfer_to_recipient(streamed_amount)?;
        }

        // Transfer remaining amount back to sender if any
        if remaining_amount > 0 {
            self.transfer_to_sender(remaining_amount)?;
        }

        // Update stream status
        stream.status = StreamStatus::Cancelled;
        stream.cancelled_at = Some(current_time);
        stream.withdrawn_amount = stream.withdrawn_amount.checked_add(streamed_amount)
            .ok_or(StreamError::MathOverflow)?;

        emit!(StreamCancelledEvent {
            stream: stream.key(),
            sender: stream.sender,
            recipient: stream.recipient,
            streamed_amount,
            remaining_amount,
            cancelled_at: current_time,
        });

        Ok(())
    }

    fn calculate_amounts(&self, current_time: i64) -> Result<(u64, u64)> {
        let stream = &self.stream;
        
        // Calculate total streamed amount up to cancellation time
        let elapsed_time = current_time.saturating_sub(stream.start_time);
        let stream_duration = stream.end_time.saturating_sub(stream.start_time);
        
        let streamed_amount = if elapsed_time >= stream_duration {
            // Stream has completed, all tokens should be streamed
            stream.amount
        } else if elapsed_time <= 0 {
            // Stream hasn't started yet
            0
        } else {
            // Calculate proportional amount based on time elapsed
            let total_amount = stream.amount as u128;
            let elapsed = elapsed_time as u128;
            let duration = stream_duration as u128;
            
            ((total_amount * elapsed) / duration) as u64
        };

        // Subtract already withdrawn amount
        let available_streamed = streamed_amount.saturating_sub(stream.withdrawn_amount);
        
        // Calculate remaining amount in escrow
        let total_in_escrow = self.escrow_token_account.amount;
        let remaining_amount = total_in_escrow.saturating_sub(available_streamed);

        Ok((available_streamed, remaining_amount))
    }

    fn transfer_to_recipient(&self, amount: u64) -> Result<()> {
        if amount == 0 {
            return Ok(());
        }

        let stream = &self.stream;
        let seeds = &[
            b"escrow",
            stream.key().as_ref(),
            &[stream.escrow_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            Transfer {
                from: self.escrow_token_account.to_account_info(),
                to: self.recipient_token_account.to_account_info(),
                authority: self.escrow_token_account.to_account_info(),
            },
            signer_seeds,
        );

        token::transfer(transfer_ctx, amount)?;
        Ok(())
    }

    fn transfer_to_sender(&self, amount: u64) -> Result<()> {
        if amount == 0 {
            return Ok(());
        }

        let stream = &self.stream;
        let seeds = &[
            b"escrow",
            stream.key().as_ref(),
            &[stream.escrow_bump],
        ];
        let signer_seeds = &[&seeds[..]];

        let transfer_ctx = CpiContext::new_with_signer(
            self.token_program.to_account_info(),
            Transfer {
                from: self.escrow_token_account.to_account_info(),
                to: self.sender_token_account.to_account_info(),
                authority: self.escrow_token_account.to_account_info(),
            },
            signer_seeds,
        );

        token::transfer(transfer_ctx, amount)?;
        Ok(())
    }
}

pub fn handler(ctx: Context<CancelStream>) -> Result<()> {
    ctx.accounts.cancel_stream()
}

#[event]
pub struct StreamCancelledEvent {
    pub stream: Pubkey,
    pub sender: Pubkey,
    pub recipient: Pubkey,
    pub streamed_amount: u64,
    pub remaining_amount: u64,
    pub cancelled_at: i64,
}
```