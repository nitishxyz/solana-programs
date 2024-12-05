use anchor_lang::prelude::*;

// Custom error enum for program-specific errors
#[error_code]
pub enum ErrorCode {
    #[msg("Custom error message")]
    CustomError,    // Example custom error
}