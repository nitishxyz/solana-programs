use anchor_lang::prelude::*;

#[account]               // Anchor macro to mark this as an account structure
#[derive(InitSpace)]    // Automatically calculate required space for account
pub struct Offer {
    pub id: u64,                    // Unique identifier for the offer
    pub maker: Pubkey,              // Address of the user creating the offer
    pub token_mint_a: Pubkey,       // Mint address of token being offered
    pub token_mint_b: Pubkey,       // Mint address of token wanted
    pub token_b_wanted_amount: u64, // Amount of token B wanted
    pub bump: u8,                   // PDA bump seed for deterministic address generation
}