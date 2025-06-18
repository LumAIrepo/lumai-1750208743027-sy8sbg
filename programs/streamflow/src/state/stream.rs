```rust
use anchor_lang::prelude::*;
use anchor_spl::token::Mint;

#[account]
#[derive(Debug)]
pub struct Stream {
    /// The authority that can modify the stream
    pub sender: Pubkey,
    /// The recipient of the stream
    pub recipient: Pubkey,
    /// The mint of the token being streamed
    pub mint: Pubkey,
    /// The escrow token account holding the funds
    pub escrow_tokens: Pubkey,
    /// The amount of tokens deposited in the stream
    pub deposited_amount: u64,
    /// The amount of tokens withdrawn from the stream
    pub withdrawn_amount: u64,
    /// The start time of the stream (Unix timestamp)
    pub start_time: i64,
    /// The end time of the stream (Unix timestamp)
    pub end_time: i64,
    /// The last withdrawal time (Unix timestamp)
    pub last_withdrawn_at: i64,
    /// The rate at which tokens are released per second
    pub rate_amount: u64,
    /// The interval at which tokens are released (in seconds)
    pub rate_interval_in_seconds: u64,
    /// Whether the stream can be cancelled by the sender
    pub cancelable_by_sender: bool,
    /// Whether the stream can be cancelled by the recipient
    pub cancelable_by_recipient: bool,
    /// Whether automatic withdrawal is enabled
    pub automatic_withdrawal: bool,
    /// Whether the stream allows topup
    pub can_topup: bool,
    /// Whether the stream allows update rate
    pub can_update_rate: bool,
    /// The current status of the stream
    pub status: StreamStatus,
    /// The type of stream (linear, cliff, etc.)
    pub stream_type: StreamType,
    /// Cliff amount (for cliff vesting)
    pub cliff_amount: u64,
    /// Cliff time (Unix timestamp)
    pub cliff_time: i64,
    /// The fee percentage (basis points)
    pub fee_percentage: u16,
    /// The fee recipient
    pub fee_recipient: Option<Pubkey>,
    /// The partner fee percentage (basis points)
    pub partner_fee_percentage: u16,
    /// The partner fee recipient
    pub partner_fee_recipient: Option<Pubkey>,
    /// Stream name/identifier
    pub name: [u8; 64],
    /// Additional metadata
    pub metadata: StreamMetadata,
    /// Bump seed for PDA
    pub bump: u8,
    /// Reserved space for future upgrades
    pub _reserved: [u8; 128],
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum StreamStatus {
    /// Stream is scheduled but not yet started
    Scheduled,
    /// Stream is currently active and streaming
    Streaming,
    /// Stream has been paused
    Paused,
    /// Stream has been cancelled
    Cancelled,
    /// Stream has completed successfully
    Completed,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, PartialEq)]
pub enum StreamType {
    /// Linear vesting over time
    Linear,
    /// Cliff vesting with initial unlock
    Cliff,
    /// Step-wise vesting at intervals
    Step,
    /// Custom vesting schedule
    Custom,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug, Default)]
pub struct StreamMetadata {
    /// Description of the stream
    pub description: [u8; 128],
    /// Category/tag for the stream
    pub category: [u8; 32],
    /// External reference ID
    pub external_id: [u8; 32],
    /// Creation timestamp
    pub created_at: i64,
    /// Last updated timestamp
    pub updated_at: i64,
}

impl Stream {
    pub const LEN: usize = 8 + // discriminator
        32 + // sender
        32 + // recipient
        32 + // mint
        32 + // escrow_tokens
        8 + // deposited_amount
        8 + // withdrawn_amount
        8 + // start_time
        8 + // end_time
        8 + // last_withdrawn_at
        8 + // rate_amount
        8 + // rate_interval_in_seconds
        1 + // cancelable_by_sender
        1 + // cancelable_by_recipient
        1 + // automatic_withdrawal
        1 + // can_topup
        1 + // can_update_rate
        1 + // status (enum)
        1 + // stream_type (enum)
        8 + // cliff_amount
        8 + // cliff_time
        2 + // fee_percentage
        33 + // fee_recipient (Option<Pubkey>)
        2 + // partner_fee_percentage
        33 + // partner_fee_recipient (Option<Pubkey>)
        64 + // name
        (128 + 32 + 32 + 8 + 8) + // metadata
        1 + // bump
        128; // reserved

    /// Calculate the amount of tokens that can be withdrawn at the current time
    pub fn withdrawable_amount(&self, current_time: i64) -> Result<u64> {
        if self.status != StreamStatus::Streaming {
            return Ok(0);
        }

        let total_streamed = self.calculate_streamed_amount(current_time)?;
        Ok(total_streamed.saturating_sub(self.withdrawn_amount))
    }

    /// Calculate the total amount streamed up to a given time
    pub fn calculate_streamed_amount(&self, current_time: i64) -> Result<u64> {
        if current_time < self.start_time {
            return Ok(0);
        }

        match self.stream_type {
            StreamType::Linear => self.calculate_linear_amount(current_time),
            StreamType::Cliff => self.calculate_cliff_amount(current_time),
            StreamType::Step => self.calculate_step_amount(current_time),
            StreamType::Custom => self.calculate_custom_amount(current_time),
        }
    }

    /// Calculate linear vesting amount
    fn calculate_linear_amount(&self, current_time: i64) -> Result<u64> {
        let effective_time = std::cmp::min(current_time, self.end_time);
        let elapsed_time = effective_time.saturating_sub(self.start_time);
        let total_duration = self.end_time.saturating_sub(self.start_time);

        if total_duration == 0 {
            return Ok(self.deposited_amount);
        }

        let streamed_amount = (self.deposited_amount as u128)
            .checked_mul(elapsed_time as u128)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(total_duration as u128)
            .ok_or(ErrorCode::MathOverflow)? as u64;

        Ok(std::cmp::min(streamed_amount, self.deposited_amount))
    }

    /// Calculate cliff vesting amount
    fn calculate_cliff_amount(&self, current_time: i64) -> Result<u64> {
        if current_time < self.cliff_time {
            return Ok(0);
        }

        if current_time < self.start_time {
            return Ok(0);
        }

        // Cliff amount is immediately available after cliff time
        let cliff_released = if current_time >= self.cliff_time {
            self.cliff_amount
        } else {
            0
        };

        // Linear vesting for remaining amount after start time
        let remaining_amount = self.deposited_amount.saturating_sub(self.cliff_amount);
        let linear_amount = if current_time > self.start_time && remaining_amount > 0 {
            let effective_time = std::cmp::min(current_time, self.end_time);
            let elapsed_time = effective_time.saturating_sub(self.start_time);
            let total_duration = self.end_time.saturating_sub(self.start_time);

            if total_duration > 0 {
                (remaining_amount as u128)
                    .checked_mul(elapsed_time as u128)
                    .ok_or(ErrorCode::MathOverflow)?
                    .checked_div(total_duration as u128)
                    .ok_or(ErrorCode::MathOverflow)? as u64
            } else {
                remaining_amount
            }
        } else {
            0
        };

        Ok(cliff_released.saturating_add(linear_amount))
    }

    /// Calculate step vesting amount
    fn calculate_step_amount(&self, current_time: i64) -> Result<u64> {
        if current_time < self.start_time {
            return Ok(0);
        }

        let elapsed_time = current_time.saturating_sub(self.start_time);
        let intervals_passed = elapsed_time / self.rate_interval_in_seconds;
        let amount_per_interval = self.rate_amount;

        let total_released = intervals_passed
            .checked_mul(amount_per_interval as i64)
            .ok_or(ErrorCode::MathOverflow)? as u64;

        Ok(std::cmp::min(total_released, self.deposited_amount))
    }

    /// Calculate custom vesting amount (placeholder for future implementation)
    fn calculate_custom_amount(&self, _current_time: i64) -> Result<u64> {
        // Custom vesting logic would be implemented here
        // For now, fallback to linear
        self.calculate_linear_amount(_current_time)
    }

    /// Check if the stream is active
    pub fn is_active(&self) -> bool {
        matches!(self.status, StreamStatus::Streaming)
    }

    /// Check if the stream has ended
    pub fn has_ended(&self, current_time: i64) -> bool {
        current_time >= self.end_time || self.status == StreamStatus::Completed
    }

    /// Check if the stream can be cancelled by the given authority
    pub fn can_cancel(&self, authority: &Pubkey) -> bool {
        match self.status {
            StreamStatus::Streaming | StreamStatus::Paused | StreamStatus::Scheduled => {
                (self.cancelable_by_sender && *authority == self.sender) ||
                (self.cancelable_by_recipient && *authority == self.recipient)
            }
            _ => false,
        }
    }

    /// Calculate fees for a given amount
    pub fn calculate_fees(&self, amount: u64) -> Result<(u64, u64)> {
        let platform_fee = if self.fee_percentage > 0 {
            (amount as u128)
                .checked_mul(self.fee_percentage as u128)
                .ok_or(ErrorCode::MathOverflow)?
                .checked_div(10000)
                .ok_or(ErrorCode::MathOverflow)? as u64
        } else {
            0
        };

        let partner_fee = if self.partner_fee_percentage > 0 {
            (amount as u128)
                .checked_mul(self.partner_fee_percentage as u128)
                .ok_or(ErrorCode::MathOverflow)?
                .checked_div(10000)
                .ok_or(ErrorCode::MathOverflow)? as u64
        } else {
            0
        };

        Ok((platform_fee, partner_fee))
    }

    /// Get the remaining balance in the stream
    pub fn remaining_balance(&self) -> u64 {
        self.deposited_amount.saturating_sub(self.withdrawn_amount)
    }

    /// Get stream progress as a percentage (0-10000 basis points)
    pub fn get_progress(&self, current_time: i64) -> Result<u16> {
        if current_time < self.start_time {
            return Ok(0);
        }

        if current_time >= self.end_time {
            return Ok(10000);
        }

        let elapsed = current_time.saturating_sub(self.start_time);
        let total_duration = self.end_time.saturating_sub(self.start_time);

        if total_duration == 0 {
            return Ok(10000);
        }

        let progress = (elapsed as u128)
            .checked_mul(10000)
            .ok_or(ErrorCode::MathOverflow)?
            .checked_div(total_duration as u128)
            .ok_or(ErrorCode::MathOverflow)? as u16;

        Ok(std::cmp::min(progress, 10000))
    }
}

#[error_code]
pub enum ErrorCode {
    #[msg("Mathematical operation resulted in overflow")]
    MathOverflow,
    #[msg("Invalid stream configuration")]
    InvalidStreamConfig,
    #[msg("Stream is not active")]
    StreamNotActive,
    #[msg("Insufficient balance")]
    InsufficientBalance,
    #[msg("Unauthorized operation")]
    Unauthorized,
    #[msg("Stream has already ended")]
    StreamEnded,
    #[msg("Invalid time parameters")]
    InvalidTimeParams,
}
```