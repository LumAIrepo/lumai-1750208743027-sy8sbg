```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use crate::state::*;
use crate::errors::StreamError;

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(
        mut,
        seeds = [
            b"stream",
            stream.sender.as_ref(),
            stream.recipient.as_ref(),
            &stream.start_time.to_le_bytes(),
        ],
        bump = stream.bump,
        has_one = sender,
        has_one = recipient,
        has_one = mint,
        constraint = stream.is_active @ StreamError::StreamNotActive,
    )]
    pub stream: Account<'info, Stream>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = stream,
    )]
    pub stream_token_account: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = mint,
        associated_token::authority = recipient,
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,

    /// CHECK: This is the mint of the token being streamed
    pub mint: AccountInfo<'info>,

    #[account(mut)]
    pub recipient: Signer<'info>,

    /// CHECK: This is the sender of the stream
    pub sender: AccountInfo<'info>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Withdraw<'info> {
    pub fn transfer_context(&self) -> CpiContext<'_, '_, '_, 'info, Transfer<'info>> {
        CpiContext::new(
            self.token_program.to_account_info(),
            Transfer {
                from: self.stream_token_account.to_account_info(),
                to: self.recipient_token_account.to_account_info(),
                authority: self.stream.to_account_info(),
            },
        )
    }
}

pub fn handler(ctx: Context<Withdraw>, amount: Option<u64>) -> Result<()> {
    let stream = &mut ctx.accounts.stream;
    let clock = Clock::get()?;
    let current_time = clock.unix_timestamp;

    // Calculate withdrawable amount
    let withdrawable_amount = stream.calculate_withdrawable_amount(current_time)?;
    
    require!(withdrawable_amount > 0, StreamError::NoTokensToWithdraw);

    // Determine actual withdrawal amount
    let withdrawal_amount = match amount {
        Some(requested_amount) => {
            require!(
                requested_amount <= withdrawable_amount,
                StreamError::InsufficientWithdrawableBalance
            );
            requested_amount
        }
        None => withdrawable_amount,
    };

    // Update stream state
    stream.withdrawn_amount = stream.withdrawn_amount
        .checked_add(withdrawal_amount)
        .ok_or(StreamError::MathOverflow)?;

    stream.last_withdrawn_at = current_time;

    // Check if stream is fully withdrawn
    if stream.withdrawn_amount >= stream.deposited_amount {
        stream.is_active = false;
        stream.end_time = Some(current_time);
    }

    // Transfer tokens from stream account to recipient
    let seeds = &[
        b"stream",
        stream.sender.as_ref(),
        stream.recipient.as_ref(),
        &stream.start_time.to_le_bytes(),
        &[stream.bump],
    ];
    let signer_seeds = &[&seeds[..]];

    token::transfer(
        ctx.accounts.transfer_context().with_signer(signer_seeds),
        withdrawal_amount,
    )?;

    // Emit withdrawal event
    emit!(WithdrawEvent {
        stream: ctx.accounts.stream.key(),
        recipient: ctx.accounts.recipient.key(),
        amount: withdrawal_amount,
        timestamp: current_time,
        remaining_balance: stream.deposited_amount
            .checked_sub(stream.withdrawn_amount)
            .unwrap_or(0),
    });

    msg!(
        "Withdrawn {} tokens from stream. Remaining balance: {}",
        withdrawal_amount,
        stream.deposited_amount.checked_sub(stream.withdrawn_amount).unwrap_or(0)
    );

    Ok(())
}

#[event]
pub struct WithdrawEvent {
    pub stream: Pubkey,
    pub recipient: Pubkey,
    pub amount: u64,
    pub timestamp: i64,
    pub remaining_balance: u64,
}

impl Stream {
    pub fn calculate_withdrawable_amount(&self, current_time: i64) -> Result<u64> {
        // If stream hasn't started yet
        if current_time < self.start_time {
            return Ok(0);
        }

        // If stream has ended or is cancelled
        if let Some(end_time) = self.end_time {
            if current_time >= end_time {
                return Ok(self.deposited_amount.checked_sub(self.withdrawn_amount).unwrap_or(0));
            }
        }

        // Calculate streamed amount based on time elapsed
        let time_elapsed = current_time
            .checked_sub(self.start_time)
            .ok_or(StreamError::MathOverflow)?;

        let total_duration = match self.stream_type {
            StreamType::Linear => {
                self.end_time.unwrap_or(current_time)
                    .checked_sub(self.start_time)
                    .ok_or(StreamError::MathOverflow)?
            }
            StreamType::Cliff => {
                // For cliff vesting, check if cliff period has passed
                if current_time < self.start_time + self.cliff_amount.unwrap_or(0) {
                    return Ok(0);
                }
                self.end_time.unwrap_or(current_time)
                    .checked_sub(self.start_time)
                    .ok_or(StreamError::MathOverflow)?
            }
        };

        // Prevent division by zero
        if total_duration == 0 {
            return Ok(self.deposited_amount.checked_sub(self.withdrawn_amount).unwrap_or(0));
        }

        // Calculate proportional amount
        let streamed_amount = (self.deposited_amount as u128)
            .checked_mul(time_elapsed as u128)
            .ok_or(StreamError::MathOverflow)?
            .checked_div(total_duration as u128)
            .ok_or(StreamError::MathOverflow)? as u64;

        // Ensure we don't exceed deposited amount
        let streamed_amount = std::cmp::min(streamed_amount, self.deposited_amount);

        // Calculate withdrawable amount (streamed - already withdrawn)
        let withdrawable = streamed_amount
            .checked_sub(self.withdrawn_amount)
            .unwrap_or(0);

        Ok(withdrawable)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_withdrawable_amount_linear() {
        let mut stream = Stream {
            sender: Pubkey::default(),
            recipient: Pubkey::default(),
            mint: Pubkey::default(),
            deposited_amount: 1000,
            withdrawn_amount: 0,
            start_time: 100,
            end_time: Some(200),
            stream_type: StreamType::Linear,
            is_active: true,
            cliff_amount: None,
            last_withdrawn_at: 100,
            bump: 255,
        };

        // Test before start
        assert_eq!(stream.calculate_withdrawable_amount(50).unwrap(), 0);

        // Test at 50% completion
        assert_eq!(stream.calculate_withdrawable_amount(150).unwrap(), 500);

        // Test at completion
        assert_eq!(stream.calculate_withdrawable_amount(200).unwrap(), 1000);

        // Test after completion
        assert_eq!(stream.calculate_withdrawable_amount(300).unwrap(), 1000);

        // Test with partial withdrawal
        stream.withdrawn_amount = 300;
        assert_eq!(stream.calculate_withdrawable_amount(150).unwrap(), 200);
    }

    #[test]
    fn test_calculate_withdrawable_amount_cliff() {
        let stream = Stream {
            sender: Pubkey::default(),
            recipient: Pubkey::default(),
            mint: Pubkey::default(),
            deposited_amount: 1000,
            withdrawn_amount: 0,
            start_time: 100,
            end_time: Some(200),
            stream_type: StreamType::Cliff,
            is_active: true,
            cliff_amount: Some(50), // 50 second cliff
            last_withdrawn_at: 100,
            bump: 255,
        };

        // Test before cliff
        assert_eq!(stream.calculate_withdrawable_amount(140).unwrap(), 0);

        // Test after cliff at 50% completion
        assert_eq!(stream.calculate_withdrawable_amount(150).unwrap(), 500);

        // Test at completion
        assert_eq!(stream.calculate_withdrawable_amount(200).unwrap(), 1000);
    }
}
```