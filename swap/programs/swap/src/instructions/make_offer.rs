use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{Mint, TokenAccount, TokenInterface},
};

use crate::{Offer, ANCHOR_DISCRIMINATOR};

use super::transfer_tokens;

// Account validation structure for make_offer instruction
#[derive(Accounts)]
#[instruction(id: u64)]  // Receives id parameter from instruction
pub struct MakeOffer<'info> {
    #[account(mut)]
    pub maker: Signer<'info>,      // Transaction signer (offer creator)

    // Token mint accounts for both tokens
    #[account(mint::token_program = token_program)]
    pub token_mint_a: InterfaceAccount<'info, Mint>,
    pub token_mint_b: InterfaceAccount<'info, Mint>,

    // Maker's token A account (source of offered tokens)
    #[account(
        mut,
        associated_token::mint = token_mint_a,
        associated_token::authority = maker,
        associated_token::token_program = token_program,
    )]
    pub maker_token_account_a: InterfaceAccount<'info, TokenAccount>,

    // New offer account (PDA)
    #[account(
        init,                    // Initialize new account
        payer = maker,          // Maker pays for account rent
        space = ANCHOR_DISCRIMINATOR + Offer::INIT_SPACE,  // Account size
        seeds = [b"offer", maker.key().as_ref(), id.to_le_bytes().as_ref()],
        bump                    // For PDA derivation
    )]
    pub offer: Account<'info, Offer>,

    // Vault to hold offered tokens
    #[account(
        init,
        payer = maker,
        associated_token::mint = token_mint_a,
        associated_token::authority = offer,
        associated_token::token_program = token_program,
    )]
    pub vault: InterfaceAccount<'info, TokenAccount>,

    // Required program accounts
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn send_offered_tokens_to_vault(
    context: &Context<MakeOffer>,
    token_a_offered_amount: u64,
) -> Result<()> {
    transfer_tokens(
        &context.accounts.maker_token_account_a,
        &context.accounts.vault,
        &token_a_offered_amount,
        &context.accounts.token_mint_a,
        &context.accounts.maker,
        &context.accounts.token_program,
    )
}

pub fn save_offer(context: Context<MakeOffer>, id: u64, token_b_wanted_amount: u64) -> Result<()> {
    context.accounts.offer.set_inner(Offer {
        id,
        maker: context.accounts.maker.key(),
        token_mint_a: context.accounts.token_mint_a.key(),
        token_mint_b: context.accounts.token_mint_b.key(),
        token_b_wanted_amount,
        bump: context.bumps.offer,
    });
    Ok(())
}
