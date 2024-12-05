use anchor_lang::prelude::*;

#[constant]
pub const SEED: &str = "anchor";           // Seed prefix for PDA derivation

// Size of Anchor's account discriminator
// Every Anchor account starts with an 8-byte discriminator
pub const ANCHOR_DISCRIMINATOR: usize = 8;