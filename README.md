# Solana Programs Collection

This repository contains a collection of Solana programs (smart contracts) developed as part of a bootcamp. Each program demonstrates different aspects of Solana development and blockchain functionality.

## Project Structure

The repository contains the following sub-projects, each built using the Anchor framework:

### [Voting System](./voting)

A decentralized voting system implemented on Solana, featuring:

- On-chain vote recording
- Proposal management
- Vote weight calculation

### [Vesting](./vesting)

A token vesting program for managing token release schedules, including:

- Customizable vesting schedules
- Token lock-up periods
- Gradual token distribution

### [Devest](./devest)

A rebuild of the Vesting program, from scratch.

### [CRUD Application](./crud-app)

A basic CRUD (Create, Read, Update, Delete) application demonstrating fundamental Solana program operations. Features:

- Next.js frontend
- Full CRUD functionality on-chain
- React components for Solana interaction
- Anchor program integration

### [Swap](./swap)

A token swap program for exchanging different types of tokens, supporting:

- Token pair trading

### [Token Lottery](./token-lottery)

To be completed.

## Development Environment Setup

### Prerequisites

- Node.js v18.18.0 or higher
- Rust v1.77.2 or higher
- Solana CLI v1.18.17 or higher
- Anchor CLI v0.30.1 or higher
- pnpm (recommended package manager)

### Global Setup Steps

1. Install Solana CLI tools:

   ```bash
   sh -c "$(curl -sSfL https://release.solana.com/v1.18.17/install)"
   ```

2. Install Rust:

   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

3. Install Anchor:

   ```bash
   cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
   avm install latest
   avm use latest
   ```

4. Install Node.js dependencies:
   ```bash
   pnpm install
   ```

## Project Structure

Each sub-project follows a similar structure:

- `/anchor` - Contains the Solana program code
- `/src` - Frontend application code
- `/tests` - Program and integration tests

## Common Commands

For each project, you can use these common commands:

```bash
# Build the Solana program
pnpm anchor-build

# Run tests
pnpm anchor-test

# Start local development
pnpm dev

# Deploy to devnet
pnpm anchor deploy --provider.cluster devnet
```

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request

## License

This project is open source and available under the MIT License.
