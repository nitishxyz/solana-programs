use anchor_lang::prelude::*;

use anchor_spl::{
    associated_token::AssociatedToken,
    token_interface::{
        close_account, transfer_checked, CloseAccount, Mint, TokenAccount, TokenInterface,
        TransferChecked,
    },
};

use crate::Offer;

use super::transfer_tokens;

// Account validation structure for take_offer instruction
#[derive(Accounts)]
pub struct TakeOffer<'info> {
    #[account(mut)]
    pub taker: Signer<'info>,              // Person accepting the offer
    
    #[account(mut)]
    pub maker: SystemAccount<'info>,       // Original offer creator
    
    // Token mint accounts for both tokens in the swap
    pub token_mint_a: InterfaceAccount<'info, Mint>,
    pub token_mint_b: InterfaceAccount<'info, Mint>,
    
    // Taker's token accounts
    #[account(
        init_if_needed,                    // Create if doesn't exist
        payer = taker,                     // Taker pays rent
        associated_token::mint = token_mint_a,
        associated_token::authority = taker,
        associated_token::token_program = token_program,
    )]
    pub taker_token_account_a: Box<InterfaceAccount<'info, TokenAccount>>,
    
    // Account holding tokens being sent to maker
    #[account(
        mut,
        associated_token::mint = token_mint_b,
        associated_token::authority = taker,
        associated_token::token_program = token_program,
    )]
    pub taker_token_account_b: Box<InterfaceAccount<'info, TokenAccount>>,
    
    // Maker's token account to receive wanted tokens
    #[account(
        init_if_needed,
        payer = taker,
        associated_token::mint = token_mint_b,
        associated_token::authority = maker,
        associated_token::token_program = token_program,
    )]
    pub maker_token_account_b: Box<InterfaceAccount<'info, TokenAccount>>,
    
    // The offer PDA account that will be closed
    #[account(
        mut,
        close = maker,              // Rent goes back to maker
        has_one = maker,            // Verify maker matches
        has_one = token_mint_a,     // Verify token mints match
        has_one = token_mint_b,
        seeds = [b"offer", maker.key().as_ref(), offer.id.to_le_bytes().as_ref()],
        bump = offer.bump
    )]
    offer: Account<'info, Offer>,
    
    // Vault holding the offered tokens
    #[account(
        mut,
        associated_token::mint = token_mint_a,
        associated_token::authority = offer,
        associated_token::token_program = token_program,
    )]
    vault: InterfaceAccount<'info, TokenAccount>,
    
    // Required program accounts
    pub system_program: Program<'info, System>,
    pub token_program: Interface<'info, TokenInterface>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

pub fn send_wanted_tokens_to_maker(context: &Context<TakeOffer>) -> Result<()> {
    transfer_tokens(
        &context.accounts.taker_token_account_b,
        &context.accounts.maker_token_account_b,
        &context.accounts.offer.token_b_wanted_amount,
        &context.accounts.token_mint_b,
        &context.accounts.taker,
        &context.accounts.token_program,
    )
}

pub fn withdraw_and_close_vault(context: Context<TakeOffer>) -> Result<()> {
    let seeds = &[
        b"offer",
        context.accounts.maker.to_account_info().key.as_ref(),
        &context.accounts.offer.id.to_le_bytes()[..],
        &[context.accounts.offer.bump],
    ];

    msg!("withdrawing and closing vault");

    let signer_seeds = [&seeds[..]];

    msg!("transferring tokens from vault to taker");

    let accounts = TransferChecked {
        from: context.accounts.vault.to_account_info(),
        to: context.accounts.taker_token_account_a.to_account_info(),
        mint: context.accounts.token_mint_a.to_account_info(),
        authority: context.accounts.offer.to_account_info(),
    };

    msg!("transferring tokens from vault to taker");

    let cpi_context = CpiContext::new_with_signer(
        context.accounts.token_program.to_account_info(),
        accounts,
        &signer_seeds,
    );

    msg!("transferring tokens from vault to taker");
    transfer_checked(
        cpi_context,
        context.accounts.vault.amount,
        context.accounts.token_mint_a.decimals,
    )?;

    msg!("closing vault");

    let accounts = CloseAccount {
        account: context.accounts.vault.to_account_info(),
        destination: context.accounts.taker.to_account_info(),
        authority: context.accounts.offer.to_account_info(),
    };

    msg!("closing vault");

    let cpi_context = CpiContext::new_with_signer(
        context.accounts.token_program.to_account_info(),
        accounts,
        &signer_seeds,
    );

    msg!("closing vault");

    close_account(cpi_context)
}
