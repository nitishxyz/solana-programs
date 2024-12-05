use anchor_lang::prelude::*;
use anchor_spl::token_interface::{
    transfer_checked, Mint, TokenAccount, TokenInterface, TransferChecked,
};

// Generic function to handle token transfers with decimal precision checking
pub fn transfer_tokens<'info>(
    from: &InterfaceAccount<'info, TokenAccount>,    // Source account
    to: &InterfaceAccount<'info, TokenAccount>,      // Destination account
    amount: &u64,                                    // Amount to transfer
    mint: &InterfaceAccount<'info, Mint>,           // Token mint for decimal verification
    authority: &Signer<'info>,                      // Transaction signer
    token_program: &Interface<'info, TokenInterface>, // Token program interface
) -> Result<()> {
    // Create transfer instruction with decimal verification
    let transfer_accounts_options = TransferChecked {
        from: from.to_account_info(),
        mint: mint.to_account_info(),
        to: to.to_account_info(),
        authority: authority.to_account_info(),
    };

    // Execute the transfer via CPI (Cross-Program Invocation)
    let cpi_context = CpiContext::new(token_program.to_account_info(), transfer_accounts_options);
    transfer_checked(cpi_context, *amount, mint.decimals)?;

    Ok(())
}
