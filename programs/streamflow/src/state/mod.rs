```rust
//! State module for StreamFlow program
//! 
//! This module contains all the account state definitions and related functionality
//! for the StreamFlow token streaming and vesting platform.

pub mod stream;
pub mod treasury;
pub mod vesting;

pub use stream::*;
pub use treasury::*;
pub use vesting::*;

use anchor_lang::prelude::*;

/// Common state validation trait
pub trait StateValidation {
    /// Validates the state of the account
    fn validate(&self) -> Result<()>;
}

/// Common state initialization trait
pub trait StateInitialization {
    /// Initializes the state with default values
    fn initialize(&mut self) -> Result<()>;
}

/// Stream status enumeration
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum StreamStatus {
    /// Stream is scheduled but not yet started
    Scheduled,
    /// Stream is currently active and streaming
    Streaming,
    /// Stream has been paused by sender or recipient
    Paused,
    /// Stream has been cancelled
    Cancelled,
    /// Stream has completed successfully
    Completed,
}

impl Default for StreamStatus {
    fn default() -> Self {
        StreamStatus::Scheduled
    }
}

/// Vesting type enumeration
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum VestingType {
    /// Linear vesting over time
    Linear,
    /// Cliff vesting with unlock at specific time
    Cliff,
    /// Custom vesting schedule with multiple unlock points
    Custom,
}

impl Default for VestingType {
    fn default() -> Self {
        VestingType::Linear
    }
}

/// Payment frequency enumeration
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum PaymentFrequency {
    /// Payments every second (real-time streaming)
    PerSecond,
    /// Payments every minute
    PerMinute,
    /// Payments every hour
    PerHour,
    /// Payments daily
    Daily,
    /// Payments weekly
    Weekly,
    /// Payments monthly
    Monthly,
}

impl Default for PaymentFrequency {
    fn default() -> Self {
        PaymentFrequency::PerSecond
    }
}

impl PaymentFrequency {
    /// Returns the duration in seconds for the payment frequency
    pub fn to_seconds(&self) -> u64 {
        match self {
            PaymentFrequency::PerSecond => 1,
            PaymentFrequency::PerMinute => 60,
            PaymentFrequency::PerHour => 3600,
            PaymentFrequency::Daily => 86400,
            PaymentFrequency::Weekly => 604800,
            PaymentFrequency::Monthly => 2592000, // 30 days
        }
    }
}

/// Treasury role enumeration
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug, PartialEq)]
pub enum TreasuryRole {
    /// Treasury owner with full permissions
    Owner,
    /// Treasury admin with management permissions
    Admin,
    /// Treasury member with limited permissions
    Member,
    /// Treasury viewer with read-only access
    Viewer,
}

impl Default for TreasuryRole {
    fn default() -> Self {
        TreasuryRole::Viewer
    }
}

/// Common constants used across state modules
pub mod constants {
    /// Maximum number of recipients per stream
    pub const MAX_RECIPIENTS: usize = 100;
    
    /// Maximum number of vesting schedules per account
    pub const MAX_VESTING_SCHEDULES: usize = 50;
    
    /// Maximum number of treasury members
    pub const MAX_TREASURY_MEMBERS: usize = 20;
    
    /// Minimum stream duration in seconds (1 minute)
    pub const MIN_STREAM_DURATION: u64 = 60;
    
    /// Maximum stream duration in seconds (10 years)
    pub const MAX_STREAM_DURATION: u64 = 315360000;
    
    /// Minimum stream amount (1 lamport)
    pub const MIN_STREAM_AMOUNT: u64 = 1;
    
    /// Platform fee basis points (0.5%)
    pub const PLATFORM_FEE_BPS: u16 = 50;
    
    /// Maximum platform fee basis points (5%)
    pub const MAX_PLATFORM_FEE_BPS: u16 = 500;
}

/// Error codes for state validation
#[error_code]
pub enum StateError {
    #[msg("Invalid stream status transition")]
    InvalidStatusTransition,
    
    #[msg("Stream amount cannot be zero")]
    ZeroStreamAmount,
    
    #[msg("Invalid stream duration")]
    InvalidStreamDuration,
    
    #[msg("Stream start time cannot be in the past")]
    InvalidStartTime,
    
    #[msg("Stream end time must be after start time")]
    InvalidEndTime,
    
    #[msg("Maximum number of recipients exceeded")]
    TooManyRecipients,
    
    #[msg("Invalid vesting schedule")]
    InvalidVestingSchedule,
    
    #[msg("Insufficient treasury balance")]
    InsufficientTreasuryBalance,
    
    #[msg("Unauthorized treasury operation")]
    UnauthorizedTreasuryOperation,
    
    #[msg("Treasury member limit exceeded")]
    TreasuryMemberLimitExceeded,
    
    #[msg("Invalid payment frequency")]
    InvalidPaymentFrequency,
    
    #[msg("Stream is not active")]
    StreamNotActive,
    
    #[msg("Stream is already completed")]
    StreamAlreadyCompleted,
    
    #[msg("Stream is paused")]
    StreamPaused,
    
    #[msg("Vesting not yet unlocked")]
    VestingNotUnlocked,
    
    #[msg("Invalid cliff date")]
    InvalidCliffDate,
    
    #[msg("Platform fee exceeds maximum")]
    PlatformFeeExceedsMaximum,
}

/// Utility functions for state management
pub mod utils {
    use super::*;
    
    /// Calculates the amount that should be streamed at a given timestamp
    pub fn calculate_streamed_amount(
        total_amount: u64,
        start_time: i64,
        end_time: i64,
        current_time: i64,
    ) -> u64 {
        if current_time <= start_time {
            return 0;
        }
        
        if current_time >= end_time {
            return total_amount;
        }
        
        let elapsed = (current_time - start_time) as u64;
        let duration = (end_time - start_time) as u64;
        
        (total_amount * elapsed) / duration
    }
    
    /// Calculates the vested amount based on vesting type and schedule
    pub fn calculate_vested_amount(
        total_amount: u64,
        vesting_type: VestingType,
        start_time: i64,
        cliff_time: Option<i64>,
        end_time: i64,
        current_time: i64,
    ) -> u64 {
        match vesting_type {
            VestingType::Linear => {
                calculate_streamed_amount(total_amount, start_time, end_time, current_time)
            }
            VestingType::Cliff => {
                if let Some(cliff) = cliff_time {
                    if current_time >= cliff {
                        total_amount
                    } else {
                        0
                    }
                } else {
                    0
                }
            }
            VestingType::Custom => {
                // Custom vesting logic would be implemented based on specific schedules
                calculate_streamed_amount(total_amount, start_time, end_time, current_time)
            }
        }
    }
    
    /// Validates that a status transition is allowed
    pub fn is_valid_status_transition(from: StreamStatus, to: StreamStatus) -> bool {
        match (from, to) {
            (StreamStatus::Scheduled, StreamStatus::Streaming) => true,
            (StreamStatus::Scheduled, StreamStatus::Cancelled) => true,
            (StreamStatus::Streaming, StreamStatus::Paused) => true,
            (StreamStatus::Streaming, StreamStatus::Cancelled) => true,
            (StreamStatus::Streaming, StreamStatus::Completed) => true,
            (StreamStatus::Paused, StreamStatus::Streaming) => true,
            (StreamStatus::Paused, StreamStatus::Cancelled) => true,
            _ => false,
        }
    }
    
    /// Calculates platform fee for a given amount
    pub fn calculate_platform_fee(amount: u64, fee_bps: u16) -> u64 {
        (amount * fee_bps as u64) / 10000
    }
    
    /// Validates treasury role permissions
    pub fn has_treasury_permission(role: TreasuryRole, required_role: TreasuryRole) -> bool {
        match (role, required_role) {
            (TreasuryRole::Owner, _) => true,
            (TreasuryRole::Admin, TreasuryRole::Admin) => true,
            (TreasuryRole::Admin, TreasuryRole::Member) => true,
            (TreasuryRole::Admin, TreasuryRole::Viewer) => true,
            (TreasuryRole::Member, TreasuryRole::Member) => true,
            (TreasuryRole::Member, TreasuryRole::Viewer) => true,
            (TreasuryRole::Viewer, TreasuryRole::Viewer) => true,
            _ => false,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use super::utils::*;
    
    #[test]
    fn test_payment_frequency_to_seconds() {
        assert_eq!(PaymentFrequency::PerSecond.to_seconds(), 1);
        assert_eq!(PaymentFrequency::PerMinute.to_seconds(), 60);
        assert_eq!(PaymentFrequency::PerHour.to_seconds(), 3600);
        assert_eq!(PaymentFrequency::Daily.to_seconds(), 86400);
    }
    
    #[test]
    fn test_calculate_streamed_amount() {
        let total = 1000;
        let start = 0;
        let end = 100;
        
        assert_eq!(calculate_streamed_amount(total, start, end, -10), 0);
        assert_eq!(calculate_streamed_amount(total, start, end, 0), 0);
        assert_eq!(calculate_streamed_amount(total, start, end, 50), 500);
        assert_eq!(calculate_streamed_amount(total, start, end, 100), 1000);
        assert_eq!(calculate_streamed_amount(total, start, end, 150), 1000);
    }
    
    #[test]
    fn test_status_transitions() {
        assert!(is_valid_status_transition(StreamStatus::Scheduled, StreamStatus::Streaming));
        assert!(is_valid_status_transition(StreamStatus::Streaming, StreamStatus::Paused));
        assert!(!is_valid_status_transition(StreamStatus::Completed, StreamStatus::Streaming));
        assert!(!is_valid_status_transition(StreamStatus::Cancelled, StreamStatus::Streaming));
    }
    
    #[test]
    fn test_platform_fee_calculation() {
        assert_eq!(calculate_platform_fee(10000, 50), 50); // 0.5%
        assert_eq!(calculate_platform_fee(10000, 100), 100); // 1%
        assert_eq!(calculate_platform_fee(10000, 500), 500); // 5%
    }
    
    #[test]
    fn test_treasury_permissions() {
        assert!(has_treasury_permission(TreasuryRole::Owner, TreasuryRole::Admin));
        assert!(has_treasury_permission(TreasuryRole::Admin, TreasuryRole::Member));
        assert!(!has_treasury_permission(TreasuryRole::Member, TreasuryRole::Admin));
        assert!(!has_treasury_permission(TreasuryRole::Viewer, TreasuryRole::Member));
    }
}
```