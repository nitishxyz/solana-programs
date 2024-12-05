// Import module declarations
pub mod constants;      // Constants used throughout the program
pub mod error;         // Custom error definitions
pub mod instructions;  // Program instructions/actions
pub mod state;        // Program state/account definitions

use anchor_lang::prelude::*;

// Re-export modules for easier access
pub use constants::*;
pub use instructions::*;
pub use state::*;

// Declare program ID - unique identifier for your program on Solana
declare_id!("87XAczG3fKY4vKS3YQw7ieQkYfER6uYXW9JkoAesVDYN");

#[program]  // Anchor macro to define program module
pub mod swap {
    use super::*;

    // Main instruction handlers
    // make_offer: Creates a new token swap offer
    pub fn make_offer(
        context: Context<MakeOffer>,  // Context contains all account information
        id: u64,                      // Unique identifier for the offer
        token_a_offered_amount: u64,  // Amount of token A being offered
        token_b_wanted_amount: u64,   // Amount of token B wanted in return
    ) -> Result<()> {
        // Two-step process: transfer tokens and save offer details
        instructions::make_offer::send_offered_tokens_to_vault(&context, token_a_offered_amount)?;
        instructions::make_offer::save_offer(context, id, token_b_wanted_amount)
    }

    // take_offer: Accepts and completes an existing swap offer
    pub fn take_offer(context: Context<TakeOffer>) -> Result<()> {
        // Two-step process: send tokens to maker and close the vault
        instructions::take_offer::send_wanted_tokens_to_maker(&context)?;
        instructions::take_offer::withdraw_and_close_vault(context)
    }
}
