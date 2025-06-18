```rust
use anchor_lang::prelude::*;

#[error_code]
pub enum StreamFlowError {
    #[msg("Invalid stream configuration")]
    InvalidStreamConfig,
    
    #[msg("Stream not found")]
    StreamNotFound,
    
    #[msg("Unauthorized access to stream")]
    UnauthorizedAccess,
    
    #[msg("Stream is already initialized")]
    StreamAlreadyInitialized,
    
    #[msg("Stream is not active")]
    StreamNotActive,
    
    #[msg("Stream has already been cancelled")]
    StreamAlreadyCancelled,
    
    #[msg("Stream has already been completed")]
    StreamAlreadyCompleted,
    
    #[msg("Insufficient funds for stream creation")]
    InsufficientFunds,
    
    #[msg("Invalid recipient address")]
    InvalidRecipient,
    
    #[msg("Invalid stream duration")]
    InvalidDuration,
    
    #[msg("Invalid stream amount")]
    InvalidAmount,
    
    #[msg("Stream start time must be in the future")]
    InvalidStartTime,
    
    #[msg("Stream end time must be after start time")]
    InvalidEndTime,
    
    #[msg("Cannot withdraw before cliff period")]
    CliffPeriodNotReached,
    
    #[msg("No funds available for withdrawal")]
    NoFundsAvailable,
    
    #[msg("Withdrawal amount exceeds available balance")]
    InsufficientWithdrawableAmount,
    
    #[msg("Stream cannot be cancelled after completion")]
    CannotCancelCompletedStream,
    
    #[msg("Only stream creator can cancel")]
    OnlyCreatorCanCancel,
    
    #[msg("Only stream recipient can withdraw")]
    OnlyRecipientCanWithdraw,
    
    #[msg("Stream is paused")]
    StreamPaused,
    
    #[msg("Stream is not paused")]
    StreamNotPaused,
    
    #[msg("Cannot pause completed stream")]
    CannotPauseCompletedStream,
    
    #[msg("Cannot resume cancelled stream")]
    CannotResumeCancelledStream,
    
    #[msg("Invalid token mint")]
    InvalidTokenMint,
    
    #[msg("Token account not found")]
    TokenAccountNotFound,
    
    #[msg("Invalid token account owner")]
    InvalidTokenAccountOwner,
    
    #[msg("Arithmetic overflow")]
    ArithmeticOverflow,
    
    #[msg("Arithmetic underflow")]
    ArithmeticUnderflow,
    
    #[msg("Division by zero")]
    DivisionByZero,
    
    #[msg("Invalid vesting schedule")]
    InvalidVestingSchedule,
    
    #[msg("Vesting cliff cannot be greater than duration")]
    InvalidCliffPeriod,
    
    #[msg("Stream rate calculation failed")]
    StreamRateCalculationFailed,
    
    #[msg("Invalid stream type")]
    InvalidStreamType,
    
    #[msg("Stream modification not allowed")]
    StreamModificationNotAllowed,
    
    #[msg("Invalid fee configuration")]
    InvalidFeeConfiguration,
    
    #[msg("Fee calculation failed")]
    FeeCalculationFailed,
    
    #[msg("Treasury account not found")]
    TreasuryAccountNotFound,
    
    #[msg("Invalid treasury configuration")]
    InvalidTreasuryConfiguration,
    
    #[msg("Multisig threshold not met")]
    MultisigThresholdNotMet,
    
    #[msg("Invalid multisig configuration")]
    InvalidMultisigConfiguration,
    
    #[msg("Proposal not found")]
    ProposalNotFound,
    
    #[msg("Proposal already executed")]
    ProposalAlreadyExecuted,
    
    #[msg("Proposal voting period expired")]
    ProposalVotingExpired,
    
    #[msg("Insufficient voting power")]
    InsufficientVotingPower,
    
    #[msg("Already voted on proposal")]
    AlreadyVoted,
    
    #[msg("Invalid proposal type")]
    InvalidProposalType,
    
    #[msg("Proposal execution failed")]
    ProposalExecutionFailed,
    
    #[msg("Stream template not found")]
    StreamTemplateNotFound,
    
    #[msg("Invalid template configuration")]
    InvalidTemplateConfiguration,
    
    #[msg("Template already exists")]
    TemplateAlreadyExists,
    
    #[msg("Cannot delete template with active streams")]
    CannotDeleteActiveTemplate,
    
    #[msg("Batch operation limit exceeded")]
    BatchOperationLimitExceeded,
    
    #[msg("Invalid batch operation")]
    InvalidBatchOperation,
    
    #[msg("Batch operation partially failed")]
    BatchOperationPartialFailure,
    
    #[msg("Stream metadata too large")]
    StreamMetadataTooLarge,
    
    #[msg("Invalid metadata format")]
    InvalidMetadataFormat,
    
    #[msg("Escrow account not found")]
    EscrowAccountNotFound,
    
    #[msg("Invalid escrow configuration")]
    InvalidEscrowConfiguration,
    
    #[msg("Escrow release conditions not met")]
    EscrowReleaseConditionsNotMet,
    
    #[msg("Oracle price feed not found")]
    OraclePriceFeedNotFound,
    
    #[msg("Invalid oracle configuration")]
    InvalidOracleConfiguration,
    
    #[msg("Oracle price data stale")]
    OraclePriceDataStale,
    
    #[msg("Price deviation too high")]
    PriceDeviationTooHigh,
    
    #[msg("Slippage tolerance exceeded")]
    SlippageToleranceExceeded,
    
    #[msg("Liquidity pool not found")]
    LiquidityPoolNotFound,
    
    #[msg("Insufficient liquidity")]
    InsufficientLiquidity,
    
    #[msg("Swap failed")]
    SwapFailed,
    
    #[msg("Invalid swap configuration")]
    InvalidSwapConfiguration,
    
    #[msg("Automated payment failed")]
    AutomatedPaymentFailed,
    
    #[msg("Payment schedule not found")]
    PaymentScheduleNotFound,
    
    #[msg("Invalid payment schedule")]
    InvalidPaymentSchedule,
    
    #[msg("Recurring payment limit exceeded")]
    RecurringPaymentLimitExceeded,
    
    #[msg("Payment authorization expired")]
    PaymentAuthorizationExpired,
    
    #[msg("Invalid payment method")]
    InvalidPaymentMethod,
    
    #[msg("Cross-chain bridge not available")]
    CrossChainBridgeNotAvailable,
    
    #[msg("Bridge transaction failed")]
    BridgeTransactionFailed,
    
    #[msg("Invalid bridge configuration")]
    InvalidBridgeConfiguration,
    
    #[msg("Destination chain not supported")]
    DestinationChainNotSupported,
    
    #[msg("Bridge fee calculation failed")]
    BridgeFeeCalculationFailed,
    
    #[msg("Governance token not found")]
    GovernanceTokenNotFound,
    
    #[msg("Invalid governance configuration")]
    InvalidGovernanceConfiguration,
    
    #[msg("Voting power calculation failed")]
    VotingPowerCalculationFailed,
    
    #[msg("Quorum not reached")]
    QuorumNotReached,
    
    #[msg("Proposal creation failed")]
    ProposalCreationFailed,
    
    #[msg("Invalid timelock configuration")]
    InvalidTimelockConfiguration,
    
    #[msg("Timelock period not elapsed")]
    TimelockPeriodNotElapsed,
    
    #[msg("Emergency pause activated")]
    EmergencyPauseActivated,
    
    #[msg("System maintenance mode")]
    SystemMaintenanceMode,
    
    #[msg("Rate limit exceeded")]
    RateLimitExceeded,
    
    #[msg("Invalid API key")]
    InvalidApiKey,
    
    #[msg("API quota exceeded")]
    ApiQuotaExceeded,
    
    #[msg("Webhook delivery failed")]
    WebhookDeliveryFailed,
    
    #[msg("Invalid webhook configuration")]
    InvalidWebhookConfiguration,
    
    #[msg("Notification service unavailable")]
    NotificationServiceUnavailable,
    
    #[msg("Invalid notification configuration")]
    InvalidNotificationConfiguration,
    
    #[msg("Analytics data not available")]
    AnalyticsDataNotAvailable,
    
    #[msg("Report generation failed")]
    ReportGenerationFailed,
    
    #[msg("Export format not supported")]
    ExportFormatNotSupported,
    
    #[msg("Data integrity check failed")]
    DataIntegrityCheckFailed,
    
    #[msg("Backup creation failed")]
    BackupCreationFailed,
    
    #[msg("Restore operation failed")]
    RestoreOperationFailed,
    
    #[msg("Version compatibility check failed")]
    VersionCompatibilityCheckFailed,
    
    #[msg("Migration failed")]
    MigrationFailed,
    
    #[msg("Configuration validation failed")]
    ConfigurationValidationFailed,
    
    #[msg("System resource limit exceeded")]
    SystemResourceLimitExceeded,
    
    #[msg("Network connectivity issue")]
    NetworkConnectivityIssue,
    
    #[msg("External service unavailable")]
    ExternalServiceUnavailable,
    
    #[msg("Timeout occurred")]
    TimeoutOccurred,
    
    #[msg("Retry limit exceeded")]
    RetryLimitExceeded,
    
    #[msg("Circuit breaker activated")]
    CircuitBreakerActivated,
    
    #[msg("Health check failed")]
    HealthCheckFailed,
    
    #[msg("Service degraded")]
    ServiceDegraded,
    
    #[msg("Capacity limit reached")]
    CapacityLimitReached,
    
    #[msg("Resource allocation failed")]
    ResourceAllocationFailed,
    
    #[msg("Permission denied")]
    PermissionDenied,
    
    #[msg("Access token expired")]
    AccessTokenExpired,
    
    #[msg("Invalid signature")]
    InvalidSignature,
    
    #[msg("Nonce already used")]
    NonceAlreadyUsed,
    
    #[msg("Request expired")]
    RequestExpired,
    
    #[msg("Invalid request format")]
    InvalidRequestFormat,
    
    #[msg("Unsupported operation")]
    UnsupportedOperation,
    
    #[msg("Feature not enabled")]
    FeatureNotEnabled,
    
    #[msg("Deprecated functionality")]
    DeprecatedFunctionality,
    
    #[msg("Unknown error occurred")]
    UnknownError,
}

impl From<StreamFlowError> for ProgramError {
    fn from(e: StreamFlowError) -> Self {
        ProgramError::Custom(e as u32)
    }
}

impl StreamFlowError {
    pub fn log(&self) {
        msg!("StreamFlow Error: {}", self);
    }
    
    pub fn error_code(&self) -> u32 {
        *self as u32
    }
    
    pub fn is_recoverable(&self) -> bool {
        matches!(
            self,
            StreamFlowError::NetworkConnectivityIssue
                | StreamFlowError::ExternalServiceUnavailable
                | StreamFlowError::TimeoutOccurred
                | StreamFlowError::ServiceDegraded
                | StreamFlowError::RateLimitExceeded
                | StreamFlowError::SystemMaintenanceMode
        )
    }
    
    pub fn requires_retry(&self) -> bool {
        matches!(
            self,
            StreamFlowError::NetworkConnectivityIssue
                | StreamFlowError::ExternalServiceUnavailable
                | StreamFlowError::TimeoutOccurred
                | StreamFlowError::AutomatedPaymentFailed
                | StreamFlowError::WebhookDeliveryFailed
        )
    }
    
    pub fn is_user_error(&self) -> bool {
        matches!(
            self,
            StreamFlowError::InvalidStreamConfig
                | StreamFlowError::InvalidRecipient
                | StreamFlowError::InvalidDuration
                | StreamFlowError::InvalidAmount
                | StreamFlowError::InvalidStartTime
                | StreamFlowError::InvalidEndTime
                | StreamFlowError::InsufficientFunds
                | StreamFlowError::UnauthorizedAccess
                | StreamFlowError::InvalidTokenMint
                | StreamFlowError::InvalidVestingSchedule
                | StreamFlowError::InvalidCliffPeriod
        )
    }
    
    pub fn is_system_error(&self) -> bool {
        matches!(
            self,
            StreamFlowError::ArithmeticOverflow
                | StreamFlowError::ArithmeticUnderflow
                | StreamFlowError::DivisionByZero
                | StreamFlowError::SystemResourceLimitExceeded
                | StreamFlowError::DataIntegrityCheckFailed
                | StreamFlowError::ConfigurationValidationFailed
        )
    }
}

pub type StreamFlowResult<T> = Result<T, StreamFlowError>;

#[macro_export]
macro_rules! require {
    ($condition:expr, $error:expr) => {
        if !$condition {
            return Err($error.into());
        }
    };
}

#[macro_export]
macro_rules! ensure {
    ($condition:expr, $error:expr) => {
        if !$condition {
            $error.log();
            return Err($error.into());
        }
    };
}

#[macro_export]
macro_rules! error_log {
    ($error:expr) => {
        $error.log();
        $error
    };
}
```