```rust
use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount, Transfer};
use std::mem::size_of;

declare_id!("11111111111111111111111111111112");

#[program]
pub mod streamflow {
    use super::*;

    pub fn create_stream(
        ctx: Context<CreateStream>,
        recipient: Pubkey,
        deposit_amount: u64,
        start_time: i64,
        end_time: i64,
        cliff_time: Option<i64>,
        cancelable_by_sender: bool,
        cancelable_by_recipient: bool,
        transferable_by_sender: bool,
        transferable_by_recipient: bool,
        automatic_withdrawal: bool,
        withdrawal_frequency: u64,
    ) -> Result<()> {
        require!(start_time < end_time, StreamError::InvalidTimeRange);
        require!(deposit_amount > 0, StreamError::InvalidAmount);
        
        if let Some(cliff) = cliff_time {
            require!(cliff >= start_time && cliff <= end_time, StreamError::InvalidCliffTime);
        }

        let stream = &mut ctx.accounts.stream;
        let clock = Clock::get()?;

        stream.sender = ctx.accounts.sender.key();
        stream.recipient = recipient;
        stream.mint = ctx.accounts.sender_token_account.mint;
        stream.escrow_token_account = ctx.accounts.escrow_token_account.key();
        stream.deposit_amount = deposit_amount;
        stream.withdrawn_amount = 0;
        stream.start_time = start_time;
        stream.end_time = end_time;
        stream.cliff_time = cliff_time;
        stream.cancelable_by_sender = cancelable_by_sender;
        stream.cancelable_by_recipient = cancelable_by_recipient;
        stream.transferable_by_sender = transferable_by_sender;
        stream.transferable_by_recipient = transferable_by_recipient;
        stream.automatic_withdrawal = automatic_withdrawal;
        stream.withdrawal_frequency = withdrawal_frequency;
        stream.last_withdrawal_time = start_time;
        stream.created_at = clock.unix_timestamp;
        stream.canceled_at = None;
        stream.canceled_by = None;
        stream.paused = false;
        stream.bump = *ctx.bumps.get("stream").unwrap();

        // Transfer tokens to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, deposit_amount)?;

        emit!(StreamCreated {
            stream: stream.key(),
            sender: stream.sender,
            recipient: stream.recipient,
            deposit_amount,
            start_time,
            end_time,
        });

        Ok(())
    }

    pub fn withdraw(ctx: Context<Withdraw>, amount: u64) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        require!(!stream.paused, StreamError::StreamPaused);
        require!(stream.canceled_at.is_none(), StreamError::StreamCanceled);
        require!(
            ctx.accounts.recipient.key() == stream.recipient,
            StreamError::UnauthorizedRecipient
        );

        let withdrawable_amount = calculate_withdrawable_amount(stream, current_time)?;
        require!(amount <= withdrawable_amount, StreamError::InsufficientFunds);

        stream.withdrawn_amount += amount;
        stream.last_withdrawal_time = current_time;

        // Transfer tokens from escrow to recipient
        let seeds = &[
            b"stream",
            stream.sender.as_ref(),
            stream.recipient.as_ref(),
            stream.mint.as_ref(),
            &[stream.bump],
        ];
        let signer = &[&seeds[..]];

        let cpi_accounts = Transfer {
            from: ctx.accounts.escrow_token_account.to_account_info(),
            to: ctx.accounts.recipient_token_account.to_account_info(),
            authority: stream.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
        token::transfer(cpi_ctx, amount)?;

        emit!(Withdrawal {
            stream: stream.key(),
            recipient: stream.recipient,
            amount,
            withdrawn_amount: stream.withdrawn_amount,
        });

        Ok(())
    }

    pub fn cancel_stream(ctx: Context<CancelStream>) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        let clock = Clock::get()?;
        let current_time = clock.unix_timestamp;

        require!(stream.canceled_at.is_none(), StreamError::StreamAlreadyCanceled);
        require!(!stream.paused, StreamError::StreamPaused);

        let authority = ctx.accounts.authority.key();
        let can_cancel = if authority == stream.sender {
            stream.cancelable_by_sender
        } else if authority == stream.recipient {
            stream.cancelable_by_recipient
        } else {
            false
        };

        require!(can_cancel, StreamError::UnauthorizedCancel);

        let withdrawable_amount = calculate_withdrawable_amount(stream, current_time)?;
        let remaining_amount = stream.deposit_amount - stream.withdrawn_amount;

        stream.canceled_at = Some(current_time);
        stream.canceled_by = Some(authority);

        // Transfer withdrawable amount to recipient if any
        if withdrawable_amount > 0 {
            stream.withdrawn_amount += withdrawable_amount;

            let seeds = &[
                b"stream",
                stream.sender.as_ref(),
                stream.recipient.as_ref(),
                stream.mint.as_ref(),
                &[stream.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.recipient_token_account.to_account_info(),
                authority: stream.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, withdrawable_amount)?;
        }

        // Return remaining amount to sender
        let return_amount = remaining_amount - withdrawable_amount;
        if return_amount > 0 {
            let seeds = &[
                b"stream",
                stream.sender.as_ref(),
                stream.recipient.as_ref(),
                stream.mint.as_ref(),
                &[stream.bump],
            ];
            let signer = &[&seeds[..]];

            let cpi_accounts = Transfer {
                from: ctx.accounts.escrow_token_account.to_account_info(),
                to: ctx.accounts.sender_token_account.to_account_info(),
                authority: stream.to_account_info(),
            };
            let cpi_program = ctx.accounts.token_program.to_account_info();
            let cpi_ctx = CpiContext::new_with_signer(cpi_program, cpi_accounts, signer);
            token::transfer(cpi_ctx, return_amount)?;
        }

        emit!(StreamCanceled {
            stream: stream.key(),
            canceled_by: authority,
            recipient_amount: withdrawable_amount,
            sender_amount: return_amount,
        });

        Ok(())
    }

    pub fn pause_stream(ctx: Context<PauseStream>) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        
        require!(
            ctx.accounts.authority.key() == stream.sender,
            StreamError::UnauthorizedSender
        );
        require!(!stream.paused, StreamError::StreamAlreadyPaused);
        require!(stream.canceled_at.is_none(), StreamError::StreamCanceled);

        stream.paused = true;

        emit!(StreamPaused {
            stream: stream.key(),
            paused_by: stream.sender,
        });

        Ok(())
    }

    pub fn resume_stream(ctx: Context<ResumeStream>) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        
        require!(
            ctx.accounts.authority.key() == stream.sender,
            StreamError::UnauthorizedSender
        );
        require!(stream.paused, StreamError::StreamNotPaused);
        require!(stream.canceled_at.is_none(), StreamError::StreamCanceled);

        stream.paused = false;

        emit!(StreamResumed {
            stream: stream.key(),
            resumed_by: stream.sender,
        });

        Ok(())
    }

    pub fn transfer_stream(ctx: Context<TransferStream>, new_recipient: Pubkey) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        
        let authority = ctx.accounts.authority.key();
        let can_transfer = if authority == stream.sender {
            stream.transferable_by_sender
        } else if authority == stream.recipient {
            stream.transferable_by_recipient
        } else {
            false
        };

        require!(can_transfer, StreamError::UnauthorizedTransfer);
        require!(stream.canceled_at.is_none(), StreamError::StreamCanceled);

        let old_recipient = stream.recipient;
        stream.recipient = new_recipient;

        emit!(StreamTransferred {
            stream: stream.key(),
            old_recipient,
            new_recipient,
            transferred_by: authority,
        });

        Ok(())
    }

    pub fn topup_stream(ctx: Context<TopupStream>, amount: u64) -> Result<()> {
        let stream = &mut ctx.accounts.stream;
        
        require!(
            ctx.accounts.sender.key() == stream.sender,
            StreamError::UnauthorizedSender
        );
        require!(amount > 0, StreamError::InvalidAmount);
        require!(stream.canceled_at.is_none(), StreamError::StreamCanceled);

        stream.deposit_amount += amount;

        // Transfer additional tokens to escrow
        let cpi_accounts = Transfer {
            from: ctx.accounts.sender_token_account.to_account_info(),
            to: ctx.accounts.escrow_token_account.to_account_info(),
            authority: ctx.accounts.sender.to_account_info(),
        };
        let cpi_program = ctx.accounts.token_program.to_account_info();
        let cpi_ctx = CpiContext::new(cpi_program, cpi_accounts);
        token::transfer(cpi_ctx, amount)?;

        emit!(StreamToppedUp {
            stream: stream.key(),
            amount,
            new_deposit_amount: stream.deposit_amount,
        });

        Ok(())
    }
}

fn calculate_withdrawable_amount(stream: &Stream, current_time: i64) -> Result<u64> {
    if current_time < stream.start_time {
        return Ok(0);
    }

    if let Some(cliff_time) = stream.cliff_time {
        if current_time < cliff_time {
            return Ok(0);
        }
    }

    let elapsed_time = if current_time >= stream.end_time {
        stream.end_time - stream.start_time
    } else {
        current_time - stream.start_time
    };

    let total_duration = stream.end_time - stream.start_time;
    let vested_amount = (stream.deposit_amount as u128 * elapsed_time as u128 / total_duration as u128) as u64;
    
    Ok(vested_amount.saturating_sub(stream.withdrawn_amount))
}

#[derive(Accounts)]
#[instruction(recipient: Pubkey)]
pub struct CreateStream<'info> {
    #[account(
        init,
        payer = sender,
        space = 8 + size_of::<Stream>(),
        seeds = [b"stream", sender.key().as_ref(), recipient.as_ref(), sender_token_account.mint.as_ref()],
        bump
    )]
    pub stream: Account<'info, Stream>,
    
    #[account(mut)]
    pub sender: Signer<'info>,
    
    #[account(
        mut,
        constraint = sender_token_account.owner == sender.key()
    )]
    pub sender_token_account: Account<'info, TokenAccount>,
    
    #[account(
        init,
        payer = sender,
        token::mint = sender_token_account.mint,
        token::authority = stream,
        seeds = [b"escrow", stream.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    pub rent: Sysvar<'info, Rent>,
}

#[derive(Accounts)]
pub struct Withdraw<'info> {
    #[account(mut)]
    pub stream: Account<'info, Stream>,
    
    pub recipient: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow", stream.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = recipient_token_account.owner == recipient.key(),
        constraint = recipient_token_account.mint == stream.mint
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct CancelStream<'info> {
    #[account(mut)]
    pub stream: Account<'info, Stream>,
    
    pub authority: Signer<'info>,
    
    #[account(
        mut,
        seeds = [b"escrow", stream.key().as_ref()],
        bump
    )]
    pub escrow_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = recipient_token_account.mint == stream.mint
    )]
    pub recipient_token_account: Account<'info, TokenAccount>,
    
    #[account(
        mut,
        constraint = sender_token_account.mint == stream.mint
    )]
    pub sender_token_account: Account<'info, TokenAccount>,
    
    pub token_program: Program<'info, Token>,
}

#[derive(Accounts)]
pub struct PauseStream<'info> {
    #[account(mut)]
    pub stream: Account<'info, Stream>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct ResumeStream<'info> {
    #[account(mut)]
    pub stream: Account<'info, Stream>,
    
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct Transfer